export type CellState = "empty" | "ship" | "hit" | "miss";

export type Player = 1 | 2;

export interface Move {
  attacker: Player;
  guess_x: number;
  guess_y: number;
  is_hit: number;
}

export type GameState =
  | "WaitingForOpponent"
  | "CommittingBoards"
  | "InProgress"
  | "Finished";

export interface Game {
  player1: string;
  player2: string;
  board_commitment_1: string;
  board_commitment_2: string;
  committed_1: boolean;
  committed_2: boolean;
  current_turn: number;
  hits_by_p1: number;
  hits_by_p2: number;
  last_guess_x: number;
  last_guess_y: number;
  state: GameState;
  winner: number;
  moves: Move[];
  attack_submitted: boolean;
}

export const getGameState = (state: unknown): string => {
  if (Array.isArray(state)) return state[0] as string;
  return state as string;
};
