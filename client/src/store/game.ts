import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface GameStore {
  board: number[];
  contractId: string | null;
  attackedCells: number[];
  setBoard: (board: number[]) => void;
  setContractId: (id: string) => void;
  addAttackedCell: (index: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      board: [],
      contractId: null,
      attackedCells: [],
      setBoard: (board) => set({ board }),
      setContractId: (id) => set({ contractId: id }),
      addAttackedCell: (index) =>
        set((state) => ({
          attackedCells: state.attackedCells.includes(index)
            ? state.attackedCells
            : [...state.attackedCells, index],
        })),
      reset: () => set({ board: [], contractId: null, attackedCells: [] }),
    }),
    {
      name: "wrecked-game-store",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
