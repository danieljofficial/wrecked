import { useState } from "react";
import { invokeContract, Address, nativeToScVal } from "../client";
import { GAME_CONTRACT_ID } from "../../lib/constants";

export const useSubmitAttack = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAttack = async (
    attackerAddress: string,
    guessX: number,
    guessY: number,
  ) => {
    setLoading(true);
    setError(null);
    try {
      await invokeContract(
        GAME_CONTRACT_ID,
        "submit_attack",
        [
          new Address(attackerAddress).toScVal(),
          nativeToScVal(guessX, { type: "u32" }),
          nativeToScVal(guessY, { type: "u32" }),
        ],
        attackerAddress,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit attack";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { submitAttack, loading, error };
};
