import { useRef, useState } from "react";
import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";
import circuit from "../../noir/battleship.json";

export type ProofResult = {
  proof: Uint8Array;
  publicInputs: string[];
};

function normalizeCommitment(value: unknown): string {
  if (typeof value === "string") {
    if (value.startsWith("0x")) return value;
    if (/^\d+$/.test(value)) return value;
    return `0x${value}`;
  }

  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as any).data)
  ) {
    const bytes = (value as any).data as number[];
    return "0x" + bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  if (
    value instanceof Uint8Array ||
    (typeof Buffer !== "undefined" && Buffer.isBuffer(value))
  ) {
    return (
      "0x" +
      Array.from(value as Uint8Array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  throw new Error(`Cannot normalize commitment: ${JSON.stringify(value)}`);
}

export const useProofGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noirRef = useRef<Noir | null>(null);
  const backendRef = useRef<UltraHonkBackend | null>(null);

  const getInstances = () => {
    if (!noirRef.current) {
      noirRef.current = new Noir(circuit as never);
    }
    if (!backendRef.current) {
      backendRef.current = new UltraHonkBackend(circuit.bytecode);
    }
    return { noir: noirRef.current, backend: backendRef.current };
  };

  const generateProof = async (
    board: number[],
    boardCommitment: string,
    guessX: number,
    guessY: number,
  ): Promise<ProofResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { noir, backend } = getInstances();

      const inputs = {
        board: board.map((cell) => cell.toString()),
        board_commitment: normalizeCommitment(boardCommitment),
        guess_x: guessX.toString(),
        guess_y: guessY.toString(),
      };

      const { witness } = await noir.execute(inputs);
      const { proof, publicInputs } = await backend.generateProof(witness, {
        keccak: true,
      });

      return { proof, publicInputs };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Proof generation failed";
      setError(message);
      throw new Error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const computeCommitment = async (board: number[]): Promise<string> => {
    const commitCircuit = await import("../../noir/commits.json");
    const noir = new Noir(commitCircuit.default as never);

    const inputs = {
      board: board.map((cell) => cell.toString()),
    };

    const { returnValue } = await noir.execute(inputs);
    const val = returnValue as string;
    return BigInt(val).toString(10);
  };

  return {
    generateProof,
    computeCommitment,
    isGenerating,
    error,
  };
};
