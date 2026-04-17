#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Bytes, BytesN, Env};

fn dummy_verifier(env: &Env) -> Address {
    Address::generate(env)
}

#[test]
fn test_join() {
    let env = Env::default();
    env.mock_all_auths();

    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let verifier = dummy_verifier(&env);

    let contract_id = env.register(WreckedContract, (&verifier, &player1));
    let client = WreckedContractClient::new(&env, &contract_id);

    client.join(&player2);
    let game = client.get_game();
    assert!(game.state == GameState::CommittingBoards);
}

#[test]
fn test_commit_board() {
    let env = Env::default();
    env.mock_all_auths();

    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let verifier = dummy_verifier(&env);

    let contract_id = env.register(WreckedContract, (&verifier, &player1));
    let client = WreckedContractClient::new(&env, &contract_id);

    client.join(&player2);

    let commitment = BytesN::from_array(&env, &[1u8; 32]);
    client.commit_board(&player1, &commitment);
    client.commit_board(&player2, &commitment);

    let game = client.get_game();
    assert!(game.state == GameState::InProgress);
    assert!(game.current_turn == 1);
}

#[test]
#[should_panic]
fn test_wrong_player_cannot_join_twice() {
    let env = Env::default();
    env.mock_all_auths();

    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let verifier = dummy_verifier(&env);

    let contract_id = env.register(WreckedContract, (&verifier, &player1));
    let client = WreckedContractClient::new(&env, &contract_id);

    client.join(&player2);
    client.join(&player2);
}

#[test]
#[should_panic]
fn test_attack_wrong_turn_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let verifier = dummy_verifier(&env);

    let contract_id = env.register(WreckedContract, (&verifier, &player1));
    let client = WreckedContractClient::new(&env, &contract_id);

    client.join(&player2);

    let commitment = BytesN::from_array(&env, &[1u8; 32]);
    client.commit_board(&player1, &commitment);
    client.commit_board(&player2, &commitment);

    client.submit_attack(&player2, &0, &0);
}

#[test]
#[should_panic]
fn test_out_of_bounds_attack_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let verifier = dummy_verifier(&env);

    let contract_id = env.register(WreckedContract, (&verifier, &player1));
    let client = WreckedContractClient::new(&env, &contract_id);

    client.join(&player2);

    let commitment = BytesN::from_array(&env, &[1u8; 32]);
    client.commit_board(&player1, &commitment);
    client.commit_board(&player2, &commitment);

    client.submit_attack(&player1, &5, &0);
}
