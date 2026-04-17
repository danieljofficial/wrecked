import { useState } from "react";
import { invokeContract, Address, nativeToScVal, xdr } from "../client";
import { GAME_CONTRACT_ID } from "../../lib/constants";
import { useProofGenerator } from "../noir/useProofGenerator";

export type ProofStatus =
  | "idle"
  | "generating"
  | "submitting"
  | "verified"
  | "error";

export const useSubmitProof = () => {
  const [status, setStatus] = useState<ProofStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const { generateProof } = useProofGenerator();

  const submitProof = async (
    defenderAddress: string,
    board: number[],
    boardCommitment: string,
    guessX: number,
    guessY: number,
  ) => {
    setError(null);

    try {
      setStatus("generating");
      const { proof, publicInputs } = await generateProof(
        board,
        boardCommitment,
        guessX,
        guessY,
      );

      const isHit = board[guessY * 5 + guessX];

      const pubInputBuf = Buffer.alloc(publicInputs.length * 32);
      publicInputs.forEach((input, i) => {
        const hex = input.startsWith("0x") ? input.slice(2) : input;
        const padded = hex.padStart(64, "0");
        for (let j = 0; j < 32; j++) {
          pubInputBuf[i * 32 + j] = parseInt(
            padded.slice(j * 2, j * 2 + 2),
            16,
          );
        }
      });

      setStatus("submitting");
      await invokeContract(
        GAME_CONTRACT_ID,
        "submit_proof",
        [
          new Address(defenderAddress).toScVal(),
          nativeToScVal(isHit, { type: "u32" }),
          xdr.ScVal.scvBytes(Buffer.from(proof)),
          xdr.ScVal.scvBytes(pubInputBuf),
        ],
        defenderAddress,
      );

      setStatus("verified");

      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Proof submission failed";
      setError(message);
      setStatus("error");
      throw new Error(message);
    }
  };

  return {
    submitProof,
    status,
    error,
    isGenerating: status === "generating",
    isSubmitting: status === "submitting",
    isVerified: status === "verified",
  };
};
