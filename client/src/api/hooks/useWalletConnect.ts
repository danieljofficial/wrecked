import { useCallback, useEffect } from "react";
import { isConnected, getAddress, requestAccess } from "@stellar/freighter-api";
import { useWallet } from "../../store/wallet";
import { toast } from "sonner";

export const useWalletConnect = () => {
  const { address, isConnecting, setAddress, setIsConnecting, disconnect } =
    useWallet();

  const checkExistingConnection = useCallback(async () => {
    try {
      const connected = await isConnected();
      if (connected.isConnected) {
        const addressResult = await getAddress();
        if (addressResult.address) {
          setAddress(addressResult.address);
        }
      }
    } catch {
      toast.error("Freighter not installed or connected.");
    }
  }, [setAddress]);

  useEffect(() => {
    checkExistingConnection();
  }, [checkExistingConnection]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const accessResult = await requestAccess();
      if (accessResult.error) {
        throw new Error(accessResult.error);
      }
      const addressResult = await getAddress();
      if (addressResult.address) {
        setAddress(addressResult.address);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      throw new Error(message);
    } finally {
      setIsConnecting(false);
    }
  }, [setAddress, setIsConnecting]);

  const truncatedAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : null;

  return {
    address,
    truncatedAddress,
    isConnecting,
    isConnected: !!address,
    connect,
    disconnect,
  };
};
