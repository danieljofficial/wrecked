import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useWalletConnect } from "../../api/hooks/useWalletConnect";
import { useJoinGame } from "../../api/hooks/useJoinGame";
import { useGameStore } from "../../store/game";

import { GAME_CONTRACT_ID } from "../../lib/constants";
import { AppPathsEnum } from "../../router/enums";
import Modal from "../../components/modal/Modal";
import useDialogue from "../../api/hooks/useDialogue";
import CrosshairIcon from "../../assets/icons/CrosshairIcon";
import FuelIcon from "../../assets/icons/FuelIcon";
import BoosterIcon from "../../assets/icons/BoosterIcon";
import SignalIcon from "../../assets/icons/SignalIcon";

export const StatusText = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-xs tracking-widest text-[#525252]">
    {children}
  </span>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const {
    address,
    isConnecting,
    isConnected,
    connect,
    truncatedAddress,
    disconnect,
  } = useWalletConnect();
  const { joinGame, loading: joining } = useJoinGame();
  const { setContractId } = useGameStore();

  const [joinContractId, setJoinContractId] = useState("");
  const [copied, setCopied] = useState(false);

  const createDialogue = useDialogue();
  const joinDialogue = useDialogue();

  const handleConnect = async () => {
    if (isConnected) {
      disconnect();
      toast.success("Wallet disconnected successfully");

      return;
    }
    try {
      await connect();
      toast.success("Wallet connected successfully");
    } catch {
      toast.error("Failed to connect wallet");
    }
  };

  const handleCreateGame = () => {
    if (!isConnected) {
      toast.error("Connect your wallet first");
      return;
    }
    setContractId(GAME_CONTRACT_ID);
    createDialogue.handleOpenDialogue();
  };

  const handleJoinGame = () => {
    if (!isConnected) {
      toast.error("Connect your wallet first");
      return;
    }
    joinDialogue.handleOpenDialogue();
  };

  const handleCopyContractId = () => {
    navigator.clipboard.writeText(GAME_CONTRACT_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterGame = () => {
    createDialogue.handleCloseDialogue();
    navigate(AppPathsEnum.PLACEMENT);
  };

  const handleConfirmJoin = async () => {
    if (!joinContractId.trim()) {
      toast.error("Enter a contract ID");
      return;
    }
    if (!address) return;
    try {
      setContractId(joinContractId.trim());
      await joinGame(address);
      joinDialogue.handleCloseDialogue();
      navigate(AppPathsEnum.PLACEMENT);
    } catch (error) {
      console.log("actual error", error);
      toast.error("Game not found. Check the contract ID and try again.");
    }
  };

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#0E0E0E]">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: "url('/backgrounds/atmosphere.png')" }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('/backgrounds/ambience.png')" }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-40 bg-cover bg-center opacity-100"
        style={{ backgroundImage: "url('/backgrounds/grain.png')" }}
      />

      <div className="relative z-30 flex h-full flex-col">
        <header className="flex items-start justify-between px-8 pt-6">
          <div className="flex flex-col gap-1">
            <span
              className="font-lora text-lg font-semibold tracking-widest italic text-brand-white"
              style={{ letterSpacing: "-1.2px" }}
            >
              WRECKED!
            </span>
            <StatusText>STATUS: ACTIVE_COMMISSION</StatusText>
          </div>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="border border-brand-yellow bg-transparent px-5 py-2 font-mono text-sm tracking-widest text-brand-yellow transition-all hover:bg-brand-yellow hover:text-brand-black disabled:opacity-50"
          >
            {isConnecting
              ? "CONNECTING..."
              : isConnected
                ? `${truncatedAddress} · DISCONNECT`
                : "CONNECT WALLET"}
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-3xl ">
            <div className=" px-10 py-8">
              <h1
                className="font-lora text-center text-9xl font-bold italic text-brand-yellow"
                style={{ letterSpacing: "-9.6px" }}
              >
                WRECKED!
              </h1>
            </div>
            <div className="px-10 py-8 text-center">
              <p
                className="font-mono text-base leading-relaxed text-[#A3A3A3]"
                style={{ letterSpacing: "1.6px" }}
              >
                Navigate the silence of a forgotten sector.
                <br />
                Recover what was lost before the void reclaims it.
              </p>
            </div>
            <div className="flex h-16 border border-brand-yellow">
              <button
                onClick={handleCreateGame}
                className="flex flex-1 items-center justify-center bg-brand-yellow  font-mono text-sm font-bold tracking-widest text-brand-black transition-all hover:bg-yellow-300"
              >
                CREATE GAME
              </button>
              <button
                onClick={handleJoinGame}
                className="flex flex-1 items-center justify-center border-l border-brand-yellow bg-transparent font-mono text-sm font-bold tracking-widest text-brand-yellow transition-all hover:bg-brand-yellow/10"
              >
                JOIN GAME
              </button>
            </div>
          </div>
        </main>

        <div className="relative z-30 flex justify-between px-8 pb-2">
          <div className="flex flex-col gap-1">
            <StatusText>EST_RECOVERY: 14 : 02 : 11</StatusText>
            <StatusText>OXYGEN_RESERVES: 12%</StatusText>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusText>VERSION: 0.8.4_ALPHA</StatusText>
            <StatusText>LATENCY: ~ 5S</StatusText>
          </div>
        </div>

        <footer className="relative z-30 flex items-center justify-between border-t border-[#1a1a1a] bg-[#0E0E0E] px-8 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CrosshairIcon />
              <StatusText>COORDINATES: 5 30 N, 6 00 E</StatusText>
            </div>
            <div className="flex items-center gap-2">
              <BoosterIcon />
              <StatusText>SYSTEM_STATUS: NOMINAL</StatusText>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <FuelIcon />
              <span className="font-mono text-xs tracking-widest text-brand-yellow">
                FUEL_RESERVE: 100%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <SignalIcon />
              <StatusText>SIGNAL_STRENGTH: FULL</StatusText>
            </div>
          </div>
        </footer>
      </div>

      {createDialogue.isDialogueOpen && (
        <Modal
          modalId={createDialogue.dialogueId}
          isModalOpen={createDialogue.isDialogueOpen}
          headerTitle="GAME CREATED"
          onDismiss={createDialogue.handleUnmountDialogue}
          handleConfirm={handleEnterGame}
          confirmButtonLabel="ENTER GAME"
          handleCancel={createDialogue.handleCloseDialogue}
          cancelButtonLabel="CLOSE"
          closeOnClickOutside
        >
          <div className="flex flex-col gap-4">
            <p className="font-mono text-sm text-[#A3A3A3]">
              Share this contract ID with your opponent to join the game.
            </p>
            <div className="flex items-center gap-3 border border-brand-yellow/30 bg-brand-navy p-3">
              <span className="flex-1 break-all font-mono text-xs text-brand-white">
                {GAME_CONTRACT_ID}
              </span>
              <button
                onClick={handleCopyContractId}
                className="shrink-0 border border-brand-yellow px-3 py-1 font-mono text-xs text-brand-yellow transition-all hover:bg-brand-yellow hover:text-brand-black"
              >
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
            <p className="font-mono text-xs text-[#525252]">
              Once your opponent joins, proceed to place your fleet.
            </p>
          </div>
        </Modal>
      )}

      {joinDialogue.isDialogueOpen && (
        <Modal
          modalId={joinDialogue.dialogueId}
          isModalOpen={joinDialogue.isDialogueOpen}
          headerTitle="JOIN GAME"
          onDismiss={joinDialogue.handleUnmountDialogue}
          handleConfirm={handleConfirmJoin}
          confirmButtonLabel={joining ? "JOINING..." : "JOIN"}
          confirmLoading={joining}
          handleCancel={joinDialogue.handleCloseDialogue}
          cancelButtonLabel="CANCEL"
          closeOnClickOutside
          disableConfirmButton={joining}
        >
          <div className="flex flex-col gap-4">
            <p className="font-mono text-sm text-[#A3A3A3]">
              Enter the contract ID shared by the game creator.
            </p>
            <input
              type="text"
              value={joinContractId}
              onChange={(e) => setJoinContractId(e.target.value)}
              placeholder="CONTRACT_ID"
              className="w-full border border-brand-yellow/30 bg-brand-navy p-3 font-mono text-sm text-brand-white placeholder-[#525252] outline-none focus:border-brand-yellow"
            />
            <p className="font-mono text-xs text-[#525252]">
              You will be added as player 2.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LandingPage;
