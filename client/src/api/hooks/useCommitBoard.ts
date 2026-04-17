import { useState } from "react";
import { invokeContract, Address, xdr } from "../client";
import { GAME_CONTRACT_ID } from "../../lib/constants";

export const useCommitBoard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commitBoard = async (
    playerAddress: string,
    commitmentDecimal: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const commitmentBigInt = BigInt(commitmentDecimal);
      const hex = commitmentBigInt.toString(16).padStart(64, "0");
      const commitmentBytes = Buffer.from(hex, "hex");

      const commitmentScVal = xdr.ScVal.scvBytes(commitmentBytes);

      await invokeContract(
        GAME_CONTRACT_ID,
        "commit_board",
        [new Address(playerAddress).toScVal(), commitmentScVal],
        playerAddress,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to commit board";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { commitBoard, loading, error };
};
