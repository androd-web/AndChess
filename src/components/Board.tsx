import { useState, useCallback, type CSSProperties, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, type Square } from "chess.js";
import { useSounds } from "../hooks/useSounds";
import { useChessGame } from "../hooks/useChessGame";
import type { PromotionPiece } from "../types/chess.types";
import { PromotionModal } from "./PromotionModal";
import { Header } from "./Header";
import { LeftBoardPanel, RightBoardPanel } from "./BoardPanels";
import { THEMES } from "../theme/boardTheme";
import "../assets/styles/board.css";
import { useStockfish } from "../hooks/useStockfish";
import { DifficultySelector } from "./DifficultySelector";
import type { Difficulty, DifficultyConfig } from "../types/chess.types";
import { DIFFICULTY_CONFIG } from "../types/chess.types";
import { type UseSocketReturn } from "../hooks/useSocket";
import { GameOverModal } from "./GameOverModal";
import { useTheme } from "../hooks/useTheme";

// ── Props ─────────────────────────────────────────────────────────────────────
interface BoardProps {
  isAIMode?: boolean;
  difficulty?: Difficulty;
  initialPlayerColor?: "w" | "b";
  roomId?: string;
  onBackToMenu: () => void;
  socket?: UseSocketReturn;
}

export function Board({
  isAIMode: isAIModeProp = true,
  difficulty: difficultyProp = "medium",
  initialPlayerColor = "w",
  roomId: roomIdProp,
  onBackToMenu,
  socket,
}: BoardProps) {
  // ── Thème ─────────────────────────────────────────────────────────────────
  const { appTheme, toggleAppTheme, boardConfig } = useTheme();
  const theme = appTheme as "dark" | "light";
  const t = THEMES[theme ?? "dark"];

  // Surcharge les couleurs du plateau avec le thème sélectionné dans le wizard
  const effectiveLightSquare = boardConfig.lightSquare;
  const effectiveDarkSquare = boardConfig.darkSquare;

  // ── État jeu ──────────────────────────────────────────────────────────────
  const { gameState, makeMove, resetGame, getLegalMoves, updateFen, getPiece } =
    useChessGame();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalSquares, setLegalSquares] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [isResigned, setIsResigned] = useState(false);

  // ── IA ────────────────────────────────────────────────────────────────────
  const [isAIMode] = useState<boolean>(isAIModeProp);
  const [difficulty, setDifficulty] = useState<Difficulty>(difficultyProp);
  const [isAIGameStarted, setIsAIGameStarted] = useState<boolean>(false);
  const [playerColor] = useState<"w" | "b">(initialPlayerColor);
  const { getBestMove, bestMove, isThinking, isReady } = useStockfish();

  // ── Sons ──────────────────────────────────────────────────────────────────
  const { playMove, playIllegal, playCheck, isMuted, toggleMute } = useSounds();

  // ── Promotion ─────────────────────────────────────────────────────────────
  const [promotionMove, setPromotionMove] = useState<{
    from: Square;
    to: Square;
    color: "w" | "b";
  } | null>(null);

  // ── Socket (multijoueur) ──────────────────────────────────────────────────
  // En mode multijoueur, on utilise le socket passé par App.tsx
  const socketLastMove = socket?.lastMove;
  const socketRoomId = socket?.roomId;
  const socketPlayerColor = socket?.playerColor;
  const sendMove = socket?.sendMove;
  const socketGameOver = socket?.gameOver;

  // En mode multijoueur, on utilise le roomId du socket ou celui passé en prop
  const activeRoomId = socketRoomId ?? roomIdProp ?? null;
  const activeColor = isAIMode ? playerColor : (socketPlayerColor ?? "w");
  const canPlayAgainstAI = !isAIMode || isAIGameStarted;
  const isHumanTurn = gameState.turn === activeColor;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    if (isAIMode) {
      resetGame();
      setIsAIGameStarted(false);
      setIsResigned(false);
    } else {
      socket?.requestRematch();
    }
  }, [isAIMode, resetGame, socket]);

  const handleResign = useCallback(() => {
    if (isAIMode) {
      setIsResigned(true);
    } else {
      socket?.resign();
    }
  }, [isAIMode, socket]);

  const handleBackToMenu = useCallback(() => {
    if (!isAIMode) {
      socket?.leaveRoom();
    }
    onBackToMenu();
  }, [isAIMode, onBackToMenu, socket]);

  const getMoveSound = useCallback(
    (from: Square, to: Square, promotion: PromotionPiece | "q" = "q") => {
      const sim = new Chess(gameState.fen);
      try {
        const res = sim.move({ from, to, promotion });
        if (!res) return "illegal" as const;
        return sim.inCheck() ? ("check" as const) : ("move" as const);
      } catch {
        return "illegal" as const;
      }
    },
    [gameState.fen],
  );

  // ── Effets ────────────────────────────────────────────────────────────────

  // Applique le coup reçu du socket (mode multijoueur)
  useEffect(() => {
    if (!socketLastMove) return;
    
    // Si le coup vient de l'adversaire (FEN différent)
    if (socketLastMove.fen !== gameState.fen) {
      updateFen(socketLastMove.fen);
      setTimeout(() => setLastMove({ from: socketLastMove.from, to: socketLastMove.to }), 0);
      
      // On vérifie si c'est un échec pour le son
      const tempGame = new Chess(socketLastMove.fen);
      if (tempGame.inCheck()) playCheck();
      else playMove();
    }
  }, [socketLastMove, updateFen, playCheck, playMove, gameState.fen]);

  // Rematch (mode multijoueur)
  useEffect(() => {
    if (socket?.rematchStarted && socket.rematchStarted.fen !== gameState.fen) {
      updateFen(socket.rematchStarted.fen);
      setTimeout(() => {
        setLastMove(null);
        setIsResigned(false);
      }, 0);
    }
  }, [socket?.rematchStarted, updateFen, gameState.fen]);

  // IA — déclenche getBestMove après chaque coup du joueur
  useEffect(() => {
    if (!canPlayAgainstAI || !isReady || !isAIMode) return;
    if (gameState.isGameOver) return;
    if (gameState.turn === playerColor) return;
    getBestMove(gameState.fen, difficulty);
  }, [
    canPlayAgainstAI,
    difficulty,
    gameState.fen,
    gameState.isGameOver,
    gameState.turn,
    getBestMove,
    isAIMode,
    isReady,
    playerColor,
  ]);

  // IA — joue le coup quand Stockfish répond
  useEffect(() => {
    if (!bestMove || bestMove === "(none)") return;
    
    // On récupère la config pour le délai (ex: 3000ms)
    // On peut utiliser une fraction de ce temps ou un délai fixe basé sur la difficulté
    const config: DifficultyConfig = DIFFICULTY_CONFIG[difficulty];
    
    const timer = setTimeout(() => {
      const from = bestMove.slice(0, 2) as Square;
      const to = bestMove.slice(2, 4) as Square;
      const promo = bestMove[4] as PromotionPiece | undefined;
      
      const moveSound = getMoveSound(from, to, promo ?? "q");
      const success = makeMove({ from, to, promotion: promo ?? "q" });
      
      if (success) {
        setTimeout(() => setLastMove({ from, to }), 0);
        if (moveSound === "check") playCheck();
        else playMove();
      }
    }, config.moveTime > 1000 ? 1000 : 500); // On plafonne le délai visuel pour ne pas être trop lent, tout en respectant l'idée de config

    return () => clearTimeout(timer);
  }, [bestMove, makeMove, playCheck, playMove, getMoveSound, difficulty]);

  // Trouve la case du roi en échec
  function getKingSquare(): Square | null {
    if (!gameState?.fen || !gameState.isCheck) return null;
    const fenBoard = gameState.fen.split(" ")[0];
    const rows = fenBoard.split("/");
    if (rows.length !== 8) return null;
    const kingChar = gameState.turn === "w" ? "K" : "k";
    const files = "abcdefgh";
    for (let rank = 0; rank < 8; rank++) {
      const row = rows[rank];
      if (!row) continue;
      let fi = 0;
      for (const char of row) {
        if (/\d/.test(char)) {
          fi += parseInt(char);
        } else {
          if (char === kingChar) return `${files[fi]}${8 - rank}` as Square;
          fi++;
        }
      }
    }
    return null;
  }

  // ── Styles des cases ──────────────────────────────────────────────────────
  const customSquareStyles: Record<string, CSSProperties> = {};

  const kingSquare = getKingSquare();
  if (kingSquare) {
    customSquareStyles[kingSquare] = {
      backgroundColor: t.check,
      boxShadow: "inset 0 0 20px rgba(255,0,0,0.8)",
    };
  }

  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: t.lastMoveLight };
    customSquareStyles[lastMove.to] = { backgroundColor: t.lastMoveDark };
  }

  if (selectedSquare) {
    customSquareStyles[selectedSquare] = { backgroundColor: t.selectedSquare };
  }

  legalSquares.forEach((sq) => {
    const fenBoard = gameState.fen.split(" ")[0];
    const files = "abcdefgh";
    const file = files.indexOf(sq[0]);
    const rank = 8 - parseInt(sq[1]);
    const rows = fenBoard.split("/");
    let col = 0;
    let hasEnemy = false;
    for (const char of rows[rank] ?? "") {
      if (col === file) {
        hasEnemy = /[a-zA-Z]/.test(char);
        break;
      }
      if (/\d/.test(char)) col += parseInt(char);
      else col++;
    }
    customSquareStyles[sq] = hasEnemy
      ? { background: t.capture, borderRadius: "50%" }
      : { background: t.legalMove };
  });

  // ── Drag & drop ───────────────────────────────────────────────────────────
  function onDrop(
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ): boolean {
    if (!isHumanTurn || isThinking) {
      playIllegal();
      return false;
    }

    const isPawn = piece === "wP" || piece === "bP";
    const isPromotion =
      isPawn &&
      ((targetSquare[1] === "8" && gameState.turn === "w") ||
        (targetSquare[1] === "1" && gameState.turn === "b"));

    if (isPromotion) {
      setPromotionMove({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        color: gameState.turn,
      });
      return false;
    }

    const moveSound = getMoveSound(
      sourceSquare as Square,
      targetSquare as Square,
      "q",
    );
    const success = makeMove({
      from: sourceSquare as Square,
      to: targetSquare as Square,
      promotion: "q",
    });

    if (!success) {
      playIllegal();
      return false;
    }

    setLastMove({ from: sourceSquare as Square, to: targetSquare as Square });
    setSelectedSquare(null);
    setLegalSquares([]);
    if (moveSound === "check") playCheck();
    else playMove();

    if (activeRoomId && sendMove) {
      sendMove({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion: "q",
        roomId: activeRoomId,
      });
    }
    return true;
  }

  // ── Promotion ─────────────────────────────────────────────────────────────
  function handlePromotion(piece: PromotionPiece) {
    if (!promotionMove) return;
    const success = makeMove({
      from: promotionMove.from,
      to: promotionMove.to,
      promotion: piece,
    });
    const moveSound = getMoveSound(promotionMove.from, promotionMove.to, piece);
    if (success) {
      setLastMove({ from: promotionMove.from, to: promotionMove.to });
      if (moveSound === "check") playCheck();
      else playMove();
      if (activeRoomId && sendMove) {
        sendMove({
          from: promotionMove.from,
          to: promotionMove.to,
          promotion: piece,
          roomId: activeRoomId,
        });
      }
    } else {
      playIllegal();
    }
    setPromotionMove(null);
  }

  // ── Clic sur une case ─────────────────────────────────────────────────────
  const onSquareClick = useCallback(
    (square: Square) => {
      if (!isHumanTurn || isThinking) return;

      if (selectedSquare && legalSquares.includes(square)) {
        const piece = getPiece(selectedSquare);
        const isPawn = piece?.type === "p";
        const isPromotion =
          isPawn &&
          ((gameState.turn === "w" &&
            selectedSquare[1] === "7" &&
            square[1] === "8") ||
            (gameState.turn === "b" &&
              selectedSquare[1] === "2" &&
              square[1] === "1"));

        if (isPromotion) {
          setPromotionMove({
            from: selectedSquare,
            to: square,
            color: gameState.turn,
          });
          setSelectedSquare(null);
          setLegalSquares([]);
          return;
        }

        const success = makeMove({
          from: selectedSquare,
          to: square,
          promotion: "q",
        });
        const moveSound = getMoveSound(selectedSquare, square, "q");
        if (success) {
          setLastMove({ from: selectedSquare, to: square });
          if (moveSound === "check") playCheck();
          else playMove();
          if (activeRoomId && sendMove) {
            sendMove({
              from: selectedSquare,
              to: square,
              promotion: "q",
              roomId: activeRoomId,
            });
          }
        } else {
          playIllegal();
        }
        setSelectedSquare(null);
        setLegalSquares([]);
        return;
      }

      const moves = getLegalMoves(square);
      if (moves.length > 0) {
        setSelectedSquare(square);
        setLegalSquares(moves);
      } else {
        setSelectedSquare(null);
        setLegalSquares([]);
      }
    },
    [
      selectedSquare,
      legalSquares,
      makeMove,
      getLegalMoves,
      getPiece,
      gameState.turn,
      isHumanTurn,
      isThinking,
      getMoveSound,
      playCheck,
      playMove,
      playIllegal,
      activeRoomId,
      sendMove,
    ],
  );

  // ── Statut ────────────────────────────────────────────────────────────────
  const getStatus = (): { text: string; color: string } => {
    const { isCheckmate, isStalemate, isDraw, isCheck, turn } = gameState;

    if (!isAIMode && socket?.opponentLeft) {
      return { text: "L'adversaire a quitté la partie", color: "#ef4444" };
    }

    if (!isAIMode && socketGameOver) {
      if (socketGameOver.reason === "resign") {
        return { text: "Partie terminée par abandon", color: "#ef4444" };
      }
      return { text: "Partie terminée", color: "#ef4444" };
    }

    const player = turn === "w" ? "Blancs" : "Noirs";
    if (isCheckmate)
      return {
        text: `♛ Échec et mat — ${turn === "w" ? "Noirs" : "Blancs"} gagnent !`,
        color: "#ef4444",
      };
    if (isStalemate) return { text: "Pat — Partie nulle", color: "#f59e0b" };
    if (isDraw) return { text: " Partie nulle", color: "#f59e0b" };
    if (isCheck)
      return { text: `Échec ! Tour des ${player}`, color: "#f59e0b" };
    return { text: `Tour des ${player}`, color: t.muted };
  };

  const status = getStatus();

  const panel3dStyle: CSSProperties = {
    boxShadow: `0 8px 22px -14px ${t.borderShadow}, 0 14px 28px -24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)`,
    backdropFilter: "blur(6px)",
  };

  const cssVars = {
    "--board-bg": t.bg,
    "--board-header-bg": t.bgHeader,
    "--board-color-border": t.colorBorder,
    "--board-border-shadow": t.borderShadow,
    "--board-surface": t.surface,
    "--board-surface-2": t.surface2,
    "--board-text": t.text,
    "--board-muted": t.muted,
    "--board-border": t.border,
    "--board-accent": t.accent,
  } as CSSProperties;

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="board-page" style={cssVars}>
      {/* Header */}
      <Header
        themeMode={theme}
        theme={t}
        isMuted={isMuted}
        isGameOver={isAIMode ? gameState.isGameOver : !!socketGameOver}
        onToggleTheme={toggleAppTheme}
        onToggleMute={toggleMute}
        onReset={handleReset}
        onBackToMenu={handleBackToMenu}
        onResign={handleResign}
      />

      {/* Notification Rematch */}
      {!isAIMode && socket?.rematchRequested && (
        <div
          className="board-card"
          style={{
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            borderColor: t.accent,
            background: "rgba(56,189,248,0.1)",
            padding: "12px 20px",
            borderRadius: "12px",
            border: `1px solid ${t.accent}`,
            zIndex: 10,
          }}
        >
          <span style={{ fontWeight: 600, color: t.text }}>
            L'adversaire demande une revanche !
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => socket.acceptRematch()}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: t.accent,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Accepter
            </button>
            <button
              onClick={() => socket.declineRematch()}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "transparent",
                color: "#ef4444",
                border: "1px solid #ef4444",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Refuser
            </button>
          </div>
        </div>
      )}

      {!isAIMode && socket?.rematchDeclined && (
        <div
          className="board-card"
          style={{
            marginBottom: "16px",
            borderColor: "#ef4444",
            background: "rgba(239,68,68,0.1)",
            padding: "12px 20px",
            borderRadius: "12px",
            border: "1px solid #ef4444",
          }}
        >
          <span style={{ color: t.text }}>L'adversaire a refusé la revanche.</span>
        </div>
      )}

      {/* Barre IA (seulement si mode IA) */}
      {isAIMode && (
        <div className="board-card board-ai-controls" style={{ color: t.text }}>
          <DifficultySelector
            value={difficulty}
            onChange={(value) => {
              setDifficulty(value);
              setIsAIGameStarted(false);
            }}
            disabled={isThinking}
            theme={t}
          />

          <button
            onClick={() => setIsAIGameStarted(true)}
            disabled={!isReady || isThinking}
            style={{
              background: t.button,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              cursor: !isReady || isThinking ? "not-allowed" : "pointer",
              fontWeight: 700,
              opacity: !isReady || isThinking ? 0.6 : 1,
            }}
          >
            {isAIGameStarted ? "En cours..." : "Lancer la partie"}
          </button>
        </div>
      )}

      {/* Layout principal */}
      <div className="board-layout">
        <LeftBoardPanel
          status={status}
          turn={gameState.turn}
          panelStyle={panel3dStyle}
          playerColor={activeColor}
        />

        <div className="board-wrapper">
          <Chessboard
            position={gameState.fen}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            customSquareStyles={customSquareStyles}
            boardWidth={480}
            boardOrientation={activeColor === "w" ? "white" : "black"}
            customDarkSquareStyle={{ backgroundColor: effectiveDarkSquare }}
            customLightSquareStyle={{ backgroundColor: effectiveLightSquare }}
            areArrowsAllowed={true}
          />
        </div>

        <RightBoardPanel
          theme={t}
          history={gameState.history}
          panelStyle={panel3dStyle}
        />
      </div>

      {/* Modal promotion */}
      <PromotionModal
        isOpen={promotionMove !== null}
        color={promotionMove?.color ?? "w"}
        onSelect={handlePromotion}
        theme={t}
      />

      {/* Modal fin de partie */}
      <GameOverModal
        isOpen={
          (isAIMode ? gameState.isGameOver : !!socketGameOver) || isResigned
        }
        type={(() => {
          if (isResigned) return "lose";
          if (isAIMode) {
            if (gameState.isCheckmate) return gameState.turn !== playerColor ? "win" : "lose";
            return "draw";
          }
          if (socketGameOver) {
            if (socketGameOver.winner === "draw") return "draw";
            const winColor = socketGameOver.winner === "white" ? "w" : "b";
            return winColor === activeColor ? "win" : "lose";
          }
          return "draw";
        })()}
        reason={
          isResigned || socketGameOver?.reason === "resign"
            ? "Partie terminée par abandon."
            : gameState.isCheckmate
              ? isAIMode
                ? `${gameState.turn !== playerColor ? "Tu as gagné" : "L'IA a gagné"} par échec et mat !`
                : `${gameState.turn !== activeColor ? "Tu as gagné" : "L'adversaire a gagné"} par échec et mat !`
              : gameState.isStalemate
                ? "Pat — aucun coup légal possible."
                : undefined
        }
        onReplay={handleReset}
      />
    </div>
  );
}
