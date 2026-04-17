import { useState, useEffect, useCallback } from "react";
import { readContract } from "../client";
import { GAME_CONTRACT_ID } from "../../lib/constants";
import { Game } from "../../lib/types";

const POLL_INTERVAL = 3000;

export const useGameState = (signerAddress: string | null) => {
  const [data, setData] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!signerAddress) return;
    try {
      const result = await readContract(
        GAME_CONTRACT_ID,
        "get_game",
        [],
        signerAddress,
      );
      console.log("[POLL] got state", {
        lastGuess: `${(result as Game).last_guess_x},${(result as Game).last_guess_y}`,
        currentTurn: (result as Game).current_turn,
        movesCount: (result as Game).moves?.length,
      });
      setData(result as Game);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch game state",
      );
    }
  }, [signerAddress]);

  useEffect(() => {
    if (!signerAddress) return;
    setLoading(true);
    fetch().finally(() => setLoading(false));

    const interval = setInterval(fetch, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [signerAddress, fetch]);

  return {
    data,
    loading,
    error,
    refetch: fetch,
  };
};
