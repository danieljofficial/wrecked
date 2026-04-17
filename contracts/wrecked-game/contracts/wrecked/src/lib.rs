#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN, Env, Symbol, Vec,
};

mod test;

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum GameState {
    WaitingForOpponent,
    CommittingBoards,
    InProgress,
    Finished,
}

#[contracttype]
#[derive(Clone)]
pub struct Move {
    pub attacker: u32,
    pub guess_x: u32,
    pub guess_y: u32,
    pub is_hit: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Game {
    pub player1: Address,
    pub player2: Address,
    pub board_commitment_1: BytesN<32>,
    pub board_commitment_2: BytesN<32>,
    pub committed_1: bool,
    pub committed_2: bool,
    pub current_turn: u32,
    pub hits_by_p1: u32,
    pub hits_by_p2: u32,
    pub last_guess_x: u32,
    pub last_guess_y: u32,
    pub state: GameState,
    pub winner: u32,
    pub moves: Vec<Move>,
    pub attack_submitted: bool,
}

const GAME: Symbol = symbol_short!("GAME");
const VERIFIER: Symbol = symbol_short!("VERIFIER");

#[contract]
pub struct WreckedContract;

#[contractimpl]
impl WreckedContract {
    pub fn __constructor(env: Env, verifier_address: Address, player1: Address) {
        env.storage().instance().set(&VERIFIER, &verifier_address);

        let empty_commitment: BytesN<32> = BytesN::from_array(&env, &[0u8; 32]);
        let game = Game {
            player1: player1.clone(),
            player2: player1.clone(),
            board_commitment_1: empty_commitment.clone(),
            board_commitment_2: empty_commitment,
            committed_1: false,
            committed_2: false,
            current_turn: 1,
            hits_by_p1: 0,
            hits_by_p2: 0,
            last_guess_x: 0,
            last_guess_y: 0,
            state: GameState::WaitingForOpponent,
            winner: 0,
            moves: Vec::new(&env),
            attack_submitted: false,
        };
        env.storage().instance().set(&GAME, &game);
    }

    pub fn join(env: Env, player2: Address) {
        player2.require_auth();
        let mut game: Game = env.storage().instance().get(&GAME).unwrap();
        assert!(
            game.state == GameState::WaitingForOpponent,
            "Game not waiting for opponent"
        );
        game.player2 = player2;
        game.state = GameState::CommittingBoards;
        env.storage().instance().set(&GAME, &game);
    }

    pub fn commit_board(env: Env, player: Address, commitment: BytesN<32>) {
        player.require_auth();
        let mut game: Game = env.storage().instance().get(&GAME).unwrap();
        assert!(
            game.state == GameState::CommittingBoards,
            "Not in committing phase"
        );

        if player == game.player1 {
            game.board_commitment_1 = commitment;
            game.committed_1 = true;
        } else if player == game.player2 {
            game.board_commitment_2 = commitment;
            game.committed_2 = true;
        } else {
            panic!("Not a player in this game");
        }

        if game.committed_1 && game.committed_2 {
            game.state = GameState::InProgress;
            game.current_turn = 1;
        }

        env.storage().instance().set(&GAME, &game);
    }

    pub fn submit_attack(env: Env, attacker: Address, guess_x: u32, guess_y: u32) {
        attacker.require_auth();
        let mut game: Game = env.storage().instance().get(&GAME).unwrap();
        assert!(game.state == GameState::InProgress, "Game not in progress");

        let attacker_turn = if attacker == game.player1 { 1u32 } else { 2u32 };
        assert!(
            attacker_turn == game.current_turn,
            "Not your turn to attack"
        );
        assert!(guess_x < 5, "guess_x out of bounds");
        assert!(guess_y < 5, "guess_y out of bounds");

        game.last_guess_x = guess_x;
        game.last_guess_y = guess_y;
        game.attack_submitted = true;
        env.storage().instance().set(&GAME, &game);
    }

    pub fn submit_proof(
        env: Env,
        defender: Address,
        is_hit: u32,
        proof: Bytes,
        public_inputs: Bytes,
    ) {
        defender.require_auth();
        let mut game: Game = env.storage().instance().get(&GAME).unwrap();
        assert!(game.state == GameState::InProgress, "Game not in progress");

        let defender_turn = if defender == game.player1 { 2u32 } else { 1u32 };
        assert!(
            defender_turn == game.current_turn,
            "Not your turn to defend"
        );

        let verifier: Address = env.storage().instance().get(&VERIFIER).unwrap();

        let _: soroban_sdk::Val = env.invoke_contract(
            &verifier,
            &Symbol::new(&env, "verify_proof"),
            soroban_sdk::vec![
                &env,
                soroban_sdk::IntoVal::<Env, soroban_sdk::Val>::into_val(&public_inputs, &env),
                soroban_sdk::IntoVal::<Env, soroban_sdk::Val>::into_val(&proof, &env),
            ],
        );

        let attacker_num = if game.current_turn == 1 { 1u32 } else { 2u32 };
        if is_hit == 1 {
            if attacker_num == 1 {
                game.hits_by_p1 += 1;
            } else {
                game.hits_by_p2 += 1;
            }
        }

        let m = Move {
            attacker: attacker_num,
            guess_x: game.last_guess_x,
            guess_y: game.last_guess_y,
            is_hit,
        };
        game.moves.push_back(m);

        if game.hits_by_p1 >= 5 {
            game.state = GameState::Finished;
            game.winner = 1;
        } else if game.hits_by_p2 >= 5 {
            game.state = GameState::Finished;
            game.winner = 2;
        } else {
            game.current_turn = if game.current_turn == 1 { 2 } else { 1 };
        }
        game.attack_submitted = false;
        env.storage().instance().set(&GAME, &game);
    }

    pub fn get_game(env: Env) -> Game {
        env.storage().instance().get(&GAME).unwrap()
    }

    pub fn reset_game(env: Env, player1: Address) {
        player1.require_auth();
        let game: Game = env.storage().instance().get(&GAME).unwrap();
        assert!(game.player1 == player1, "Only player1 can reset the game");

        let empty_commitment: BytesN<32> = BytesN::from_array(&env, &[0u8; 32]);
        let reset = Game {
            player1: player1.clone(),
            player2: player1.clone(),
            board_commitment_1: empty_commitment.clone(),
            board_commitment_2: empty_commitment,
            committed_1: false,
            committed_2: false,
            current_turn: 1,
            hits_by_p1: 0,
            hits_by_p2: 0,
            last_guess_x: 0,
            last_guess_y: 0,
            state: GameState::WaitingForOpponent,
            winner: 0,
            moves: Vec::new(&env),
            attack_submitted: false,
        };
        env.storage().instance().set(&GAME, &reset);
    }
}
