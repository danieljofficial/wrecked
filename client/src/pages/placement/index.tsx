import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useWalletConnect } from "../../api/hooks/useWalletConnect";
import { useGameState } from "../../api/hooks/useGameState";
import { useCommitBoard } from "../../api/hooks/useCommitBoard";
import { useProofGenerator } from "../../api/noir/useProofGenerator";
import { useGameStore } from "../../store/game";
import { AppPathsEnum } from "../../router/enums";
import { GRID_SIZE, SHIP_COUNT } from "../../lib/constants";
import RocketIcon from "../../assets/icons/RocketIcon";
import { useResetGame } from "../../api/hooks/useResetGame";
import useDialogue from "../../api/hooks/useDialogue";
import Modal from "../../components/modal/Modal";
import { getGameState } from "../../lib/types";

const COLS = ["A", "B", "C", "D", "E"];
const ROWS = ["1", "2", "3", "4", "5"];
const WAITING_TIMEOUT_MS = 1 * 60 * 1000;

type ButtonState =
  | "idle"
  | "confirm"
  | "sealing"
  | "waiting"
  | "retry"
  | "ready";

const PlacementPage = () => {
  const navigate = useNavigate();
  const { address } = useWalletConnect();
  const { data: gameState, loading: gameLoading } = useGameState(address);
  const { commitBoard } = useCommitBoard();
  const { computeCommitment } = useProofGenerator();
  const { setBoard, contractId, reset } = useGameStore();

  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set());
  const [committed, setCommitted] = useState(false);
  const [buttonState, setButtonState] = useState<ButtonState>("idle");
  const [waitingSecondsLeft, setWaitingSecondsLeft] = useState<number | null>(
    null,
  );

  const isPlayer1 = gameState?.player1 === address;
  const myCommitted = isPlayer1
    ? gameState?.committed_1
    : gameState?.committed_2;
  const opponentCommitted = isPlayer1
    ? gameState?.committed_2
    : gameState?.committed_1;
  const bothCommitted = gameState?.committed_1 && gameState?.committed_2;

  useEffect(() => {
    if (buttonState !== "waiting") return;

    const timeout = setTimeout(() => {
      setButtonState("retry");
      toast.error("Opponent has not joined. Click RETRY to keep waiting.");

      setCommitted(true);
    }, WAITING_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [buttonState]);

  useEffect(() => {
    if (buttonState !== "waiting") {
      setWaitingSecondsLeft(null);
      return;
    }

    setWaitingSecondsLeft(60);
    const interval = setInterval(() => {
      setWaitingSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [buttonState]);

  useEffect(() => {
    if (!contractId && !gameLoading) {
      navigate(AppPathsEnum.LANDING);
    }
  }, [contractId, gameLoading, navigate]);

  useEffect(() => {
    if (myCommitted && !opponentCommitted) {
      setCommitted(true);
      setButtonState("waiting");
    }
    if (bothCommitted) {
      setButtonState("ready");
    }
  }, [myCommitted, opponentCommitted, bothCommitted]);

  const { resetGame, loading: resetting } = useResetGame();
  const resetDialogue = useDialogue();

  const handleReset = async () => {
    if (!address) return;
    try {
      await resetGame(address);
      resetDialogue.handleCloseDialogue();
      reset();
      navigate(AppPathsEnum.LANDING);
      toast.success("Game reset. Redeploy to start fresh.");
    } catch {
      toast.error("Failed to reset game.");
    }
  };

  const handleCellClick = (index: number) => {
    if (committed) return;
    setSelectedCells((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else if (next.size < SHIP_COUNT) {
        next.add(index);
      }
      return next;
    });
  };

  const handleButtonClick = () => {
    if (buttonState === "ready") return handleEnterBattle();
    if (buttonState === "retry") return setButtonState("waiting");
    return handleConfirmFleet();
  };

  const handleRandomize = () => {
    if (committed) return;
    const indices = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
    const shuffled = indices
      .sort(() => Math.random() - 0.5)
      .slice(0, SHIP_COUNT);
    setSelectedCells(new Set(shuffled));
  };

  const handleConfirmFleet = async () => {
    if (selectedCells.size !== SHIP_COUNT || !address) return;
    setButtonState("sealing");

    try {
      const boardArray = Array.from(
        { length: GRID_SIZE * GRID_SIZE },
        (_, i) => (selectedCells.has(i) ? 1 : 0),
      );
      setBoard(boardArray);

      const commitment = await computeCommitment(boardArray);
      await commitBoard(address, commitment);

      setCommitted(true);
      setButtonState("waiting");
      toast.success("Fleet sealed. Waiting for opponent.");
    } catch (error) {
      setButtonState("confirm");
      console.log(error);
      toast.error("Failed to seal fleet. Try again.");
    }
  };

  const handleEnterBattle = () => {
    navigate(AppPathsEnum.GAME);
  };

  const getButtonLabel = () => {
    switch (buttonState) {
      case "sealing":
        return "SEALING BOARD...";
      case "waiting":
        return "WAITING FOR OPPONENT...";
      case "ready":
        return "ENTER BATTLE";
      case "retry":
        return "RETRY";
      default:
        return "CONFIRM FLEET";
    }
  };

  const stateValue = getGameState(gameState?.state);

  const opponentJoined =
    stateValue === "CommittingBoards" || stateValue === "InProgress";

  const isButtonDisabled =
    buttonState === "sealing" ||
    buttonState === "waiting" ||
    (buttonState === "idle" && selectedCells.size !== SHIP_COUNT) ||
    (isPlayer1 && !opponentJoined);
  console.log(
    "gameState",
    gameState,
    "address",
    address,
    "opponentJoined",
    opponentJoined,
  );

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#0E0E0E]">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: "url('/backgrounds/atmosphere.png')" }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/backgrounds/grain.png')" }}
      />

      <div className="relative z-30 flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-[#1a1a1a] px-8 py-4">
          <span
            className="font-lora text-lg font-semibold tracking-widest italic text-brand-white cursor-pointer"
            style={{ letterSpacing: "-1.2px" }}
            onClick={() => {
              navigate(AppPathsEnum.LANDING);
            }}
          >
            WRECKED!
          </span>
          <span className="font-mono text-xs tracking-widest text-[#525252]">
            PHASE: FLEET_DEPLOYMENT
          </span>
          {isPlayer1 && (
            <button
              onClick={resetDialogue.handleOpenDialogue}
              className="border border-red-800 bg-transparent px-3 py-1 font-mono text-xs tracking-widest text-red-800 transition-all hover:border-red-600 hover:text-red-600"
            >
              RETREAT
            </button>
          )}
          {address && (
            <span className="font-mono text-xs text-[#525252]">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          )}
        </header>

        <main className="flex flex-1 gap-0 overflow-hidden">
          <div className="flex flex-1 flex-col items-center justify-center gap-6 border-r border-[#1a1a1a] p-8">
            <div className="flex flex-col items-center gap-2">
              <h2 className="font-lora text-2xl text-brand-white">
                PLACE YOUR FLEET
              </h2>
              <span className="font-mono text-xs text-[#525252]">
                UNITS PLACED: {selectedCells.size} / {SHIP_COUNT}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex gap-1 pl-6">
                {COLS.map((col) => (
                  <div
                    key={col}
                    className="flex h-6 w-12 items-center justify-center font-mono text-xs text-[#525252]"
                  >
                    {col}
                  </div>
                ))}
              </div>

              {ROWS.map((row, rowIdx) => (
                <div key={row} className="flex items-center gap-1">
                  <div className="flex h-12 w-6 items-center justify-center font-mono text-xs text-[#525252]">
                    {row}
                  </div>
                  {COLS.map((_, colIdx) => {
                    const index = rowIdx * GRID_SIZE + colIdx;
                    const isSelected = selectedCells.has(index);
                    return (
                      <button
                        key={index}
                        onClick={() => handleCellClick(index)}
                        disabled={committed}
                        className={`h-12 w-12 border transition-all flex items-center justify-center ${
                          committed
                            ? isSelected
                              ? "cursor-not-allowed border-brand-yellow/30 bg-brand-yellow/30"
                              : "cursor-not-allowed border-[#1a1a1a] bg-[#0a0a0a]"
                            : isSelected
                              ? "border-brand-yellow bg-brand-yellow cursor-pointer"
                              : "border-[#1a1a1a] bg-brand-navy cursor-pointer hover:border-brand-yellow/50 hover:bg-brand-navy/80"
                        }`}
                      >
                        {isSelected && <RocketIcon />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex w-full max-w-xs flex-col gap-3">
              <button
                onClick={handleRandomize}
                disabled={committed}
                className="w-full border border-[#525252] bg-transparent py-2 font-mono text-xs tracking-widest text-[#525252] transition-all hover:border-brand-beige hover:text-brand-beige disabled:cursor-not-allowed disabled:opacity-30"
              >
                RANDOMIZE
              </button>
              {isPlayer1 && !opponentJoined && (
                <span className="text-center font-mono text-xs text-[#525252]">
                  WAITING FOR OPPONENT TO JOIN...
                </span>
              )}

              <button
                onClick={handleButtonClick}
                disabled={isButtonDisabled}
                className={`w-full py-3 font-mono text-sm font-bold tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  buttonState === "ready"
                    ? "animate-proof-pulse border border-brand-yellow bg-brand-yellow text-brand-black"
                    : buttonState === "waiting" || buttonState === "sealing"
                      ? "border border-brand-yellow/30 bg-transparent text-brand-yellow/30"
                      : buttonState === "retry"
                        ? "border border-brand-beige bg-transparent text-brand-beige hover:border-brand-yellow hover:text-brand-yellow"
                        : "border border-brand-yellow bg-brand-yellow text-brand-black hover:bg-yellow-300"
                }`}
              >
                {getButtonLabel()}
              </button>
              {buttonState === "waiting" && waitingSecondsLeft !== null && (
                <span className="text-center font-mono text-xs text-[#525252]">
                  TIMEOUT IN {Math.floor(waitingSecondsLeft / 60)}:
                  {String(waitingSecondsLeft % 60).padStart(2, "0")}
                </span>
              )}
            </div>
          </div>

          <div className="flex w-96 flex-col gap-8 overflow-y-auto p-8">
            <div className="flex flex-col gap-1">
              <h3 className="font-lora text-xl text-brand-yellow">
                MISSION BRIEFING
              </h3>
              <div className="mt-1 h-px w-12 bg-brand-yellow" />
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs tracking-widest text-[#525252]">
                FLEET INTEL
              </span>
              <div className="flex flex-col gap-2 border border-[#1a1a1a] p-4">
                {[
                  ["FLEET SIZE", "5 UNITS"],
                  ["GRID SECTOR", "5 x 5"],
                  ["WIN CONDITION", "DESTROY ALL 5"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="font-mono text-xs text-[#525252]">
                      {label}
                    </span>
                    <span className="font-mono text-xs text-brand-white">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs tracking-widest text-[#525252]">
                RULES OF ENGAGEMENT
              </span>
              <ul className="flex flex-col gap-2">
                {[
                  "Place each unit on a single cell",
                  "Units cannot share a cell",
                  "Board is sealed on commit",
                  "Cannot change fleet after sealing",
                  "First to destroy all 5 enemy units wins",
                ].map((rule) => (
                  <li key={rule} className="flex  gap-2   items-center">
                    <span className="  text-brand-yellow">—</span>
                    <span className="font-mono text-xs  leading-relaxed text-brand-beige">
                      {rule}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs tracking-widest text-[#525252]">
                ZK PROTOCOL
              </span>
              <p className="font-mono text-xs leading-relaxed text-[#525252]">
                Your board is hashed using Poseidon and stored on the Stellar
                blockchain. Every hit or miss response generates a zero
                knowledge proof verified on chain before the turn advances.
                Cheating is mathematically impossible ;)
              </p>
            </div>
          </div>
        </main>
      </div>
      {resetDialogue.isDialogueOpen && (
        <Modal
          modalId={resetDialogue.dialogueId}
          isModalOpen={resetDialogue.isDialogueOpen}
          headerTitle="ABANDON GAME"
          onDismiss={resetDialogue.handleUnmountDialogue}
          handleConfirm={handleReset}
          confirmButtonLabel={resetting ? "RESETTING..." : "CONFIRM ABANDON"}
          confirmLoading={resetting}
          handleCancel={resetDialogue.handleCloseDialogue}
          cancelButtonLabel="CANCEL"
          closeOnClickOutside
          disableConfirmButton={resetting}
        >
          <div className="flex flex-col gap-4">
            <p className="font-mono text-sm text-[#A3A3A3]">
              This will reset the game contract to its initial state.
            </p>
            <p className="font-mono text-sm text-red-600">
              You will need to redeploy ships and pay the transaction fee again.
              Your opponent will be removed from the game.
            </p>
            <p className="font-mono text-xs text-[#525252]">
              This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PlacementPage;
