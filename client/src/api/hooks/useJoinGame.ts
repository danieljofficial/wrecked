import { useState } from "react";
import { invokeContract, Address } from "../client";
import { useGameStore } from "../../store/game";

export const useJoinGame = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { contractId } = useGameStore();

  const joinGame = async (playerAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      const targetContract = contractId;
      if (!targetContract) throw new Error("No contract ID");

      await invokeContract(
        targetContract,
        "join",
        [new Address(playerAddress).toScVal()],
        playerAddress,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to join game";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { joinGame, loading, error };
};
