import { useState } from "react";
import { invokeContract, Address } from "../client";
import { GAME_CONTRACT_ID } from "../../lib/constants";

export const useResetGame = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetGame = async (player1Address: string) => {
    setLoading(true);
    setError(null);
    try {
      await invokeContract(
        GAME_CONTRACT_ID,
        "reset_game",
        [new Address(player1Address).toScVal()],
        player1Address,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset game";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { resetGame, loading, error };
};
