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
import { useStockfish } from '../hooks/useStockfish'
import { DifficultySelector } from './DifficultySelector'
import type { Difficulty } from '../types/chess.types'

export function Board() {
  const { gameState, makeMove, resetGame, getLegalMoves } = useChessGame();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalSquares, setLegalSquares] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  );

  const { playMove, playIllegal, playCheck, isMuted, toggleMute } = useSounds();
  // ── IA utilisation ───────────────────────────────────────────────────────────────────
  const [isAIMode, setIsAIMode]     = useState<boolean>(true)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
  const { getBestMove, bestMove, isThinking, isReady } = useStockfish()


  const [promotionMove, setPromotionMove] = useState<{
    from: Square;
    to: Square;
    color: "w" | "b";
  } | null>(null);

  const t = THEMES[theme ?? "dark"];
  const isHumanTurn = !isAIMode || gameState.turn === playerColor;

  const getMoveSound = useCallback(
    (from: Square, to: Square, promotion: PromotionPiece | "q" = "q") => {
      const simulation = new Chess(gameState.fen);
      try {
        const result = simulation.move({ from, to, promotion });
        if (!result) return "illegal" as const;
        return simulation.inCheck() ? ("check" as const) : ("move" as const);
      } catch {
        return "illegal" as const;
      }
    },
    [gameState.fen],
  );

  // 3. Déclenche l'IA après chaque coup du joueur
  useEffect(() => {
    if (!isReady) return;
    if (!isAIMode) return;
    if (gameState.isGameOver) return;
    if (gameState.turn === playerColor) return; // C'est le tour du joueur
    getBestMove(gameState.fen, difficulty);
  }, [
    difficulty,
    gameState.fen,
    gameState.isGameOver,
    gameState.turn,
    getBestMove,
    isAIMode,
    isReady,
    playerColor,
  ]);

  // 4. Joue le coup quand Stockfish répond
  useEffect(() => {
    if (!bestMove || bestMove === "(none)") return;
    const from = bestMove.slice(0, 2) as Square;
    const to = bestMove.slice(2, 4) as Square;
    const promo = bestMove[4] as PromotionPiece | undefined;
    makeMove({ from, to, promotion: promo ?? "q" });
    setTimeout(() => setLastMove({ from, to }), 0);
  }, [bestMove, makeMove]);
  // Fonction pour trouver la case du roi en échec_______________________________________________________

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

      let fileIndex = 0;

      for (const char of row) {
        if (/\d/.test(char)) {
          fileIndex += parseInt(char);
        } else {
          if (char === kingChar) {
            return `${files[fileIndex]}${8 - rank}` as Square;
          }
          fileIndex++;
        }
      }
    }

    return null;
  }

  const customSquareStyles: Record<string, CSSProperties> = {};

  const kingSquare = getKingSquare();

  if (kingSquare) {
    customSquareStyles[kingSquare] = {
      backgroundColor: t.check,
      boxShadow: "inset 0 0 20px rgba(255,0,0,0.8)",
    };
  }

  // ── Drag & drop ──────────────────────────────────────────────────────────

  function onDrop(
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ): boolean {
    if (!isHumanTurn || isThinking) {
      playIllegal();
      return false;
    }

    // Vérifie que c'est un pion ET qu'il atteint la dernière rangée
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

    const success = makeMove({
      from: sourceSquare as Square,
      to: targetSquare as Square,
      promotion: "q",
    });
    const moveSound = getMoveSound(
      sourceSquare as Square,
      targetSquare as Square,
      "q",
    );

    if (success) {
      setLastMove({
        from: sourceSquare as Square,
        to: targetSquare as Square,
      });
      setSelectedSquare(null);
      setLegalSquares([]);
      if (moveSound === "check") {
        playCheck();
      } else {
        playMove();
      }
    }
    if (!success) {
      playIllegal();
      return false;
    }

    return true;
  }

  //  la fonction de sélection handlePromotion
  function handlePromotion(piece: PromotionPiece) {
    if (!promotionMove) return;

    const success = makeMove({
      from: promotionMove.from,
      to: promotionMove.to,
      promotion: piece,
    });
    const moveSound = getMoveSound(promotionMove.from, promotionMove.to, piece);

    if (success) {
      setLastMove({
        from: promotionMove.from,
        to: promotionMove.to,
      });
      if (moveSound === "check") {
        playCheck();
      } else {
        playMove();
      }
    } else {
      playIllegal();
    }

    setPromotionMove(null);
  }
  // ── Clic sur une case ─────────────────────────────────────────────────────
  const onSquareClick = useCallback(
    (square: Square) => {
      if (!isHumanTurn || isThinking) {
        return;
      }

      if (selectedSquare && legalSquares.includes(square)) {
        const isPromotion =
          (gameState.turn === "w" &&
            selectedSquare[1] === "7" &&
            square[1] === "8") ||
          (gameState.turn === "b" &&
            selectedSquare[1] === "2" &&
            square[1] === "1");

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
          if (moveSound === "check") {
            playCheck();
          } else {
            playMove();
          }
        } else {
          playIllegal();
        }

        setSelectedSquare(null);
        setLegalSquares([]);
        return;
      }

      // Sélection pièce
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
      gameState.turn,
      isHumanTurn,
      isThinking,
      getMoveSound,
      playCheck,
      playMove,
      playIllegal,
    ],
  );

  // ── Styles des cases ──────────────────────────────────────────────────────
  // Dernier coup joué — surbrillance
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: t.lastMoveLight };
    customSquareStyles[lastMove.to] = { backgroundColor: t.lastMoveDark };
  }

  // Case sélectionnée — vert foncé
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = { backgroundColor: t.selectedSquare };
  }

  // Coups légaux — point vert (case vide) ou anneau vert (capture)
  legalSquares.forEach((sq) => {
    // Détecte si la case cible contient une pièce adverse
    const fenBoard = gameState.fen.split(" ")[0];
    const files = "abcdefgh";
    const file = files.indexOf(sq[0]);
    const rank = 8 - parseInt(sq[1]);
    const rows = fenBoard.split("/");
    let col = 0;
    let hasEnemy = false;
    for (const char of rows[rank]) {
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

  // roi en echec couleur
  //  if (gameState.isCheck) {
  //     const kingSquare = getKingSquare(gameState.turn)

  //     if (kingSquare && typeof kingSquare === "string") {
  //       customSquareStyles[kingSquare] = {
  //         ...customSquareStyles[kingSquare],
  //         backgroundColor: "red",
  //       }
  //     }
  //  }

  // ── Statut de la partie ───────────────────────────────────────────────────
  const getStatus = (): { text: string; color: string } => {
    const { isCheckmate, isStalemate, isDraw, isCheck, turn } = gameState;
    const player = turn === "w" ? "Blancs" : "Noirs";
    if (isCheckmate)
      return {
        text: `♛ Échec et mat — ${turn === "w" ? "Noirs" : "Blancs"} gagnent !`,
        color: "#ef4444",
      };
    if (isStalemate) return { text: "🤝 Pat — Partie nulle", color: "#f59e0b" };
    if (isDraw) return { text: "🤝 Partie nulle", color: "#f59e0b" };
    if (isCheck)
      return { text: `⚠️ Échec ! Tour des ${player}`, color: "#f59e0b" };
    return { text: `Tour des ${player}`, color: t.muted };
  };

  const status = getStatus();
  const panel3dStyle: CSSProperties = {
    boxShadow: `0 8px 22px -14px ${t.borderShadow}, 0 14px 28px -24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)`,
    backdropFilter: "blur(6px)",
  };

  const cssVars: CSSProperties = {
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

  return (
    <div className="board-page" style={cssVars}>
      <Header
        themeMode={theme}
        theme={t}
        isMuted={isMuted}
        isGameOver={gameState.isGameOver}
        onToggleTheme={() =>
          setTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
        onToggleMute={toggleMute}
        onReset={resetGame}
      />

      <div className="board-card board-ai-controls" style={{ color: t.text }}>
        <button
          onClick={() => setIsAIMode((prev) => !prev)}
          style={{
            background: t.surface2,
            color: t.text,
            border: `1px solid ${t.border}`,
            borderRadius: "8px",
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {isAIMode ? "IA activée" : "IA désactivée"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: t.muted, fontSize: "12px" }}>Camp joueur:</span>
          <button
            onClick={() => setPlayerColor((prev) => (prev === "w" ? "b" : "w"))}
            style={{
              background: t.surface2,
              color: t.text,
              border: `1px solid ${t.border}`,
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            {playerColor === "w" ? "Blancs" : "Noirs"}
          </button>
        </div>

        <DifficultySelector
          value={difficulty}
          onChange={setDifficulty}
          disabled={!isAIMode || isThinking}
          theme={t}
        />
      </div>

      <div className="board-layout">

        <LeftBoardPanel
          status={status}
          turn={gameState.turn}
          panelStyle={panel3dStyle}
        />

        {/* ── Plateau  Centrale── */}
        <div className="board-wrapper">
          <Chessboard
            position={gameState.fen}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            customSquareStyles={customSquareStyles}
            boardWidth={480}
            customDarkSquareStyle={{ backgroundColor: t.darkSquare }}
            customLightSquareStyle={{ backgroundColor: t.lightSquare }}
            areArrowsAllowed={true}
          />
        </div>

        <RightBoardPanel
          theme={t}
          history={gameState.history}
          panelStyle={panel3dStyle}
        />
      </div>
      <PromotionModal
        isOpen={promotionMove !== null}
        color={promotionMove?.color ?? "w"}
        onSelect={handlePromotion}
        theme={t}
      />
    </div>
  );
}
