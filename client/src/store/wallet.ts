import { create } from "zustand";

interface WalletState {
  address: string | null;
  isConnecting: boolean;
  setAddress: (address: string | null) => void;
  setIsConnecting: (value: boolean) => void;
  disconnect: () => void;
}

export const useWallet = create<WalletState>((set) => ({
  address: null,
  isConnecting: false,
  setAddress: (address) => set({ address }),
  setIsConnecting: (value) => set({ isConnecting: value }),
  disconnect: () => set({ address: null }),
}));
