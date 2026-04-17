import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletConnect } from "../../api/hooks/useWalletConnect";
import { useGameState } from "../../api/hooks/useGameState";
import { useSubmitProof } from "../../api/hooks/useSubmitProof";
import { useGameStore } from "../../store/game";
import { AppPathsEnum } from "../../router/enums";
import { GRID_SIZE } from "../../lib/constants";
import { useSubmitAttack } from "../../api/hooks/useSubmitAttack";
import RocketIcon from "../../assets/icons/RocketIcon";
import { getGameState } from "../../lib/types";
import { useResetGame } from "../../api/hooks/useResetGame";
import useDialogue from "../../api/hooks/useDialogue";
import { toast } from "sonner";
import Modal from "../../components/modal/Modal";
import MissIcon from "../../assets/icons/MissIcon";
import HitIcon from "../../assets/icons/HitIcon";

const COLS = ["A", "B", "C", "D", "E"];
const ROWS = ["1", "2", "3", "4", "5"];

const StatusText = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-xs tracking-widest text-[#525252]">
    {children}
  </span>
);

interface LogEntry {
  id: number;
  text: string;
}

interface ProofBarProps {
  active: boolean;
  onComplete: () => void;
}

const ProofStatusBar = ({ active, onComplete }: ProofBarProps) => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setProgress(0);
    const duration = 7000;
    const steps = 100;
    const stepTime = duration / steps;
    let current = 0;

    intervalRef.current = setInterval(() => {
      current += 1;
      if (current >= 95) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setProgress(95);
      } else {
        setProgress(current);
      }
    }, stepTime);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  useEffect(() => {
    if (progress === 95 && active) {
      const finish = setTimeout(() => {
        setProgress(100);
        setTimeout(onComplete, 600);
      }, 1000);
      return () => clearTimeout(finish);
    }
  }, [progress, active, onComplete]);

  if (!active && progress === 0) return null;

  return (
    <div className="flex flex-col gap-1 min-w-48">
      <div className="flex justify-between">
        <StatusText>ZK_PROOF</StatusText>
        <span className="font-mono text-xs text-brand-yellow">{progress}%</span>
      </div>
      <div className="h-1.5 w-full bg-[#1a1a1a] overflow-hidden">
        <div
          className="h-full bg-brand-yellow transition-all duration-200"
          style={{
            width: `${progress}%`,
            boxShadow:
              progress > 0 ? "0 0 8px #FDDA24, 0 0 16px #FDDA2466" : "none",
          }}
        />
      </div>
      <StatusText>
        {progress < 100 ? "GENERATING_PROOF..." : "PROOF_VERIFIED"}
      </StatusText>
    </div>
  );
};

const GamePage = () => {
  const navigate = useNavigate();
  const { address } = useWalletConnect();
  const { data: gameState, loading: gameLoading } = useGameState(address);
  const { submitAttack, loading: attacking } = useSubmitAttack();
  const { submitProof } = useSubmitProof();
  const { board, contractId, addAttackedCell, attackedCells, reset } =
    useGameStore();

  const [log, setLog] = useState<LogEntry[]>([]);
  const [logCounter, setLogCounter] = useState(0);
  const [proofActive, setProofActive] = useState(false);
  const [attackLocked, setAttackLocked] = useState(false);
  const [prevMoveCount, setPrevMoveCount] = useState(0);
  const [showWin, setShowWin] = useState(false);

  const defendingRef = useRef(false);

  const isPlayer1 = gameState?.player1 === address;
  const myTurn = gameState?.current_turn === (isPlayer1 ? 1 : 2);
  const myHits = isPlayer1
    ? (gameState?.hits_by_p1 ?? 0)
    : (gameState?.hits_by_p2 ?? 0);
  const myMisses = (gameState?.moves ?? []).filter(
    (m) => m.attacker === (isPlayer1 ? 1 : 2) && m.is_hit === 0,
  ).length;
  const enemyHits = isPlayer1
    ? (gameState?.hits_by_p2 ?? 0)
    : (gameState?.hits_by_p1 ?? 0);
  const enemyMisses = (gameState?.moves ?? []).filter(
    (m) => m.attacker === (isPlayer1 ? 2 : 1) && m.is_hit === 0,
  ).length;
  const signalStrength = Math.max(0, 100 - enemyHits * 20);

  const stateValue = getGameState(gameState?.state);

  useEffect(() => {
    if (!contractId && !gameLoading) {
      navigate(AppPathsEnum.LANDING);
    }
  }, [contractId, gameLoading, navigate]);

  useEffect(() => {
    if (stateValue === "Finished") {
      setShowWin(true);
    }
    if (stateValue === "WaitingForOpponent") {
      reset();
      navigate(AppPathsEnum.LANDING);
    }
  }, [stateValue]);

  useEffect(() => {
    const moves = gameState?.moves ?? [];
    if (moves.length > prevMoveCount) {
      const latest = moves[moves.length - 1];
      const col = COLS[latest.guess_x];
      const row = ROWS[latest.guess_y];
      const coord = `${col}${row}`;
      const attackerIsMe = latest.attacker === (isPlayer1 ? 1 : 2);
      const hit = latest.is_hit === 1;

      const text = attackerIsMe
        ? hit
          ? `YOU HIT ${coord}`
          : `YOU MISSED ${coord}`
        : hit
          ? `ENEMY HIT ${coord}`
          : `ENEMY MISSED ${coord}`;

      setLog((prev) => [...prev, { id: logCounter, text }]);
      setLogCounter((c) => c + 1);
      setPrevMoveCount(moves.length);
      setAttackLocked(false);
    }
  }, [gameState?.moves, prevMoveCount, isPlayer1, logCounter]);

  const handleDefend = useCallback(async () => {
    console.log("[DEFEND] ENTER", {
      hasAddress: !!address,
      hasGameState: !!gameState,
      boardLength: board.length,
      defending: defendingRef.current,
    });

    if (!address) {
      console.log("[DEFEND] bail: no address");
      return;
    }
    if (!gameState) {
      console.log("[DEFEND] bail: no gameState");
      return;
    }
    if (board.length === 0) {
      console.log("[DEFEND] bail: empty board");
      return;
    }
    if (defendingRef.current) {
      console.log("[DEFEND] bail: already defending");
      return;
    }

    if (!address || !gameState || board.length === 0) return;
    if (defendingRef.current) return;
    defendingRef.current = true;

    const guessX = gameState.last_guess_x;
    const guessY = gameState.last_guess_y;
    const myCommitment = isPlayer1
      ? gameState.board_commitment_1
      : gameState.board_commitment_2;

    setProofActive(true);
    try {
      const result = await submitProof(
        address,
        board,
        myCommitment,
        guessX,
        guessY,
      );
      console.log("[DEFEND] submitProof resolved", result);
    } catch (err) {
      console.error("[DEFEND] submitProof FAILED", err);
      toast.error(
        `Proof submission failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      setProofActive(false);
    } finally {
      defendingRef.current = false;
    }
  }, [address, gameState, board, isPlayer1, submitProof]);

  const lastProcessedGuessRef = useRef<string | null>(null);
  const currentGuess = `${gameState?.last_guess_x}-${gameState?.last_guess_y}-${gameState?.current_turn}`;

  console.log("[DEFEND EFFECT]", {
    currentGuess,
    prev: lastProcessedGuessRef.current,
    myTurn,
    proofActive,
    defending: defendingRef.current,
    stateValue,
  });

  useEffect(() => {
    console.log("[DEFEND EFFECT BODY] running", {
      hasGameState: !!gameState,
      state: gameState ? getGameState(gameState.state) : null,
      proofActive,
      defending: defendingRef.current,
      currentTurn: gameState?.current_turn,
      myPlayerNum: isPlayer1 ? 1 : 2,
      movesCount: gameState?.moves?.length,
      lastGuess: `${gameState?.last_guess_x},${gameState?.last_guess_y}`,
      prevRef: lastProcessedGuessRef.current,
    });

    if (!gameState) {
      console.log("[DEFEND] exit: no gameState");
      return;
    }
    if (getGameState(gameState.state) !== "InProgress") {
      console.log("[DEFEND] exit: not InProgress");
      return;
    }
    if (proofActive || defendingRef.current) {
      console.log("[DEFEND] exit: already active/defending");
      return;
    }
    if (!gameState.attack_submitted) return;

    const myPlayerNum = isPlayer1 ? 1 : 2;
    const iAmDefender = gameState.current_turn !== myPlayerNum;
    if (!iAmDefender) {
      console.log("[DEFEND] exit: not defender");
      return;
    }

    const turnNumber = gameState.current_turn;
    const movesCount = gameState.moves?.length ?? 0;
    const pendingProof = movesCount < turnNumber - 1 + 1;
    if (!pendingProof) {
      console.log("[DEFEND] exit: no pending proof", {
        movesCount,
        turnNumber,
      });
      return;
    }

    const defenseKey = `${gameState.last_guess_x}-${gameState.last_guess_y}-${movesCount}`;
    if (lastProcessedGuessRef.current === defenseKey) {
      console.log("[DEFEND] exit: key already processed", defenseKey);
      return;
    }

    console.log("[DEFEND] TRIGGERING handleDefend, key:", defenseKey);
    lastProcessedGuessRef.current = defenseKey;
    handleDefend();
  }, [gameState, isPlayer1, proofActive, handleDefend]);

  const { resetGame, loading: resetting } = useResetGame();
  const resetDialogue = useDialogue();

  const handleReset = async () => {
    if (!address) return;
    try {
      await resetGame(address);
      resetDialogue.handleCloseDialogue();
      reset();
      navigate(AppPathsEnum.LANDING);
    } catch {
      toast.error("Failed to abandon game.");
    }
  };

  const handleProofComplete = () => {
    setProofActive(false);
  };

  const handleAttack = async (colIdx: number, rowIdx: number) => {
    if (!address || !myTurn || attackLocked || attacking) return;
    const index = rowIdx * GRID_SIZE + colIdx;
    if (attackedCells.includes(index)) return;

    setAttackLocked(true);
    addAttackedCell(index);
    try {
      await submitAttack(address, colIdx, rowIdx);
    } catch {
      setAttackLocked(false);
    }
  };

  const getEnemyCell = (colIdx: number, rowIdx: number) => {
    const move = (gameState?.moves ?? []).find(
      (m) =>
        m.attacker === (isPlayer1 ? 1 : 2) &&
        m.guess_x === colIdx &&
        m.guess_y === rowIdx,
    );
    if (!move) return "empty";
    return move.is_hit === 1 ? "hit" : "miss";
  };

  const getMyCell = (colIdx: number, rowIdx: number) => {
    const index = rowIdx * GRID_SIZE + colIdx;
    const isShip = board[index] === 1;
    const enemyMove = (gameState?.moves ?? []).find(
      (m) =>
        m.attacker === (isPlayer1 ? 2 : 1) &&
        m.guess_x === colIdx &&
        m.guess_y === rowIdx,
    );
    if (enemyMove) return enemyMove.is_hit === 1 ? "hit" : "miss";
    if (isShip) return "ship";
    return "empty";
  };

  const iWon = gameState?.winner === (isPlayer1 ? 1 : 2);
  const visibleLog = log.slice(-3);

  console.log("[GAME]", {
    myTurn,
    stateValue,
    proofActive,
    defending: defendingRef.current,
    lastGuess: `${gameState?.last_guess_x},${gameState?.last_guess_y}`,
    currentTurn: gameState?.current_turn,
    isPlayer1,
    movesCount: gameState?.moves?.length ?? 0,
  });

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
            className="cursor-pointer font-lora text-lg font-semibold italic tracking-widest text-brand-white"
            style={{ letterSpacing: "-1.2px" }}
            onClick={() => navigate(AppPathsEnum.LANDING)}
          >
            WRECKED!
          </span>
          <span className="font-mono text-xs tracking-widest text-[#525252]">
            PHASE: COMBAT
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

        <main className="flex flex-1 flex-col items-center gap-3 overflow-hidden px-8 py-4">
          <div className="flex w-full max-w-4xl flex-col gap-3">
            <div className="flex items-center bg-brand-navy px-6 py-3">
              <div className="flex flex-1 justify-evenly items-center gap-8 ">
                <div className="flex flex-col gap-1">
                  <StatusText>YOUR HITS</StatusText>
                  <span className="font-mono text-center text-2xl font-bold text-brand-yellow">
                    {myHits}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <StatusText>YOUR MISSES</StatusText>
                  <span className="font-mono text-center text-2xl font-bold text-brand-yellow">
                    {myMisses}
                  </span>
                </div>
              </div>

              <div className="mx-4 h-8 w-px bg-white/10" />

              <div className="flex flex-1 items-center justify-evenly gap-8 ">
                <div className="flex flex-col items-center gap-1">
                  <StatusText>ENEMY HITS</StatusText>
                  <span className="font-mono text-center text-2xl font-bold text-brand-yellow">
                    {enemyHits}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <StatusText>ENEMY MISSES</StatusText>
                  <span className="font-mono text-center text-2xl font-bold text-brand-yellow">
                    {enemyMisses}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <span
                className={`font-lora text-lg ${
                  myTurn ? "text-brand-yellow" : "text-brand-beige"
                }`}
              >
                {myTurn ? "Your Turn" : "Enemy's Turn"}
              </span>
            </div>

            <div className="flex justify-center gap-16">
              <div className="flex flex-col gap-1  ">
                <span className="mb-4 text-center font-mono text-xs tracking-widest text-[#525252]">
                  YOUR FLEET
                </span>
                <div className="flex gap-1 pl-6">
                  {COLS.map((col) => (
                    <div
                      key={col}
                      className="flex h-5 w-10 items-center justify-center font-mono text-xs text-[#525252]"
                    >
                      {col}
                    </div>
                  ))}
                </div>
                {ROWS.map((row, rowIdx) => (
                  <div key={row} className="flex items-center gap-1">
                    <div className="flex h-10 w-6 items-center justify-center font-mono text-xs text-[#525252]">
                      {row}
                    </div>
                    {COLS.map((_, colIdx) => {
                      const state = getMyCell(colIdx, rowIdx);
                      return (
                        <div
                          key={colIdx}
                          className={`flex h-10 w-10 items-center justify-center   transition-all ${
                            state === "ship"
                              ? " bg-brand-yellow/60"
                              : state === "hit"
                                ? "border-brand-teal/50 bg-[#0a0a0a]"
                                : state === "miss"
                                  ? "border-[#1a1a1a] bg-[#0a0a0a]"
                                  : "border-[#1a1a1a] bg-brand-navy"
                          }`}
                        >
                          {state === "hit" && <HitIcon />}
                          {state === "miss" && <MissIcon />}
                          {state === "ship" && <RocketIcon />}
                        </div>
                        // <div
                        //   key={colIdx}
                        //   className={`flex h-10 w-10 items-center justify-center transition-all ${
                        //     state === "ship"
                        //       ? "bg-brand-yellow"
                        //       : "border border-[#1a1a1a] bg-brand-navy"
                        //   }`}
                        // >
                        //   {state === "hit" && <HitIcon />}
                        //   {state === "miss" && <MissIcon />}
                        //   {state === "ship" && <RocketIcon />}
                        // </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1 ">
                <span className="mb-4 text-center  font-mono text-xs tracking-widest text-[#525252]">
                  ENEMY FLEET
                </span>
                <div className="flex gap-1 pl-6">
                  {COLS.map((col) => (
                    <div
                      key={col}
                      className="flex h-5 w-10 items-center justify-center font-mono text-xs text-[#525252]"
                    >
                      {col}
                    </div>
                  ))}
                </div>
                {ROWS.map((row, rowIdx) => (
                  <div key={row} className="flex items-center gap-1">
                    <div className="flex h-10 w-6 items-center justify-center font-mono text-xs text-[#525252]">
                      {row}
                    </div>
                    {COLS.map((_, colIdx) => {
                      const index = rowIdx * GRID_SIZE + colIdx;
                      const state = getEnemyCell(colIdx, rowIdx);
                      const isAttacked = attackedCells.includes(index);
                      const canAttack =
                        myTurn &&
                        !attackLocked &&
                        !attacking &&
                        state === "empty" &&
                        !isAttacked;
                      return (
                        <button
                          key={colIdx}
                          onClick={() =>
                            canAttack && handleAttack(colIdx, rowIdx)
                          }
                          disabled={!canAttack}
                          className={`flex h-10 w-10 items-center justify-center   transition-all ${
                            state === "hit"
                              ? "  bg-[#0a0a0a] cursor-default"
                              : state === "miss"
                                ? "  bg-[#0a0a0a] cursor-default"
                                : canAttack
                                  ? "  bg-brand-navy cursor-crosshair hover:border-brand-yellow/50 hover:bg-brand-yellow/5"
                                  : "  bg-brand-navy cursor-default"
                          }`}
                        >
                          {state === "hit" && <HitIcon />}
                          {state === "miss" && <MissIcon />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="relative z-30 flex items-center justify-between border-t border-[#1a1a1a] bg-[#0E0E0E] px-8 py-4">
          <div className="flex h-16 w-52 flex-col justify-end gap-1 overflow-hidden">
            <AnimatePresence initial={false}>
              {visibleLog.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <StatusText>{entry.text}</StatusText>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex flex-col items-center gap-1">
            <StatusText>SIGNAL_STRENGTH</StatusText>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-32 overflow-hidden bg-[#1a1a1a]">
                <div
                  className="h-full bg-brand-teal transition-all duration-500"
                  style={{ width: `${signalStrength}%` }}
                />
              </div>
              <span className="font-mono text-xs text-brand-teal">
                {signalStrength}%
              </span>
            </div>
          </div>

          <div className="flex w-52 justify-end">
            <ProofStatusBar
              active={proofActive}
              onComplete={handleProofComplete}
            />
          </div>
        </footer>
      </div>

      {showWin && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-black/90">
          <div className="flex flex-col items-center gap-6 border border-brand-yellow p-12">
            <h2 className="font-lora text-5xl font-bold text-brand-yellow">
              {iWon ? "VICTORY" : "DEFEATED"}
            </h2>
            <p className="font-mono text-sm text-[#A3A3A3]">
              {iWon
                ? "All enemy units destroyed. Mission complete."
                : "Your fleet has been eliminated. Mission failed."}
            </p>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 border border-[#1a1a1a] px-6 py-3">
                <StatusText>YOUR HITS</StatusText>
                <span className="font-mono text-2xl text-center text-brand-yellow">
                  {myHits}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 border border-[#1a1a1a] px-6 py-3">
                <StatusText>ENEMY HITS</StatusText>
                <span className="font-mono text-2xl text-brand-yellow">
                  {enemyHits}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(AppPathsEnum.LANDING)}
              className="border border-brand-yellow bg-brand-yellow px-8 py-3 font-mono text-sm font-bold tracking-widest text-brand-black hover:bg-yellow-300"
            >
              RETURN TO LOBBY
            </button>
          </div>
        </div>
      )}
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

export default GamePage;
