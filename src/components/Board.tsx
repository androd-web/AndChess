import { useState, useCallback } from "react"
import { Chessboard } from "react-chessboard"
import type { Square } from "chess.js"
import { useChessGame } from "../hooks/useChessGame"

type Theme = "dark" | "light"

const THEMES = {
  dark: {
    bg: "#1a1a2e",
    surface: "#16213e",
    surface2: "#0f3460",
    text: "#e2e8f0",
    muted: "#94a3b8",
    border: "#334155",
    button: "#0f3460",
    buttonHover: "#1e4d8c",
    accent: "#e2b96f",
    lightSquare: "#f0d9b5",
    darkSquare:  "#b58863",
    lastMoveLight: "rgba(205, 210, 106, 0.5)",
    lastMoveDark:  "rgba(170, 162, 58, 0.5)",
    selectedSquare: "rgba(20, 85, 30, 0.5)",
    legalMove: "radial-gradient(circle, rgba(20,85,30,0.5) 25%, transparent 25%)",
    capture: "radial-gradient(circle, transparent 60%, rgba(20,85,30,0.5) 60%)",
  },
  light: {
    bg: "#f0f4f8",
    surface: "#ffffff",
    surface2: "#e2e8f0",
    text: "#1e293b",
    muted: "#64748b",
    border: "#cbd5e1",
    button: "#3b82f6",
    buttonHover: "#2563eb",
    accent: "#b45309",
    lightSquare: "#f0d9b5",
    darkSquare:  "#b58863",
    lastMoveLight: "rgba(205, 210, 106, 0.6)",
    lastMoveDark:  "rgba(170, 162, 58, 0.6)",
    selectedSquare: "rgba(20, 85, 30, 0.5)",
    legalMove: "radial-gradient(circle, rgba(20,85,30,0.5) 25%, transparent 25%)",
    capture: "radial-gradient(circle, transparent 60%, rgba(20,85,30,0.5) 60%)",
  },
}

export function Board() {
  const { gameState, makeMove, resetGame, getLegalMoves } = useChessGame()
  const [theme, setTheme] = useState<Theme>("dark")
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [legalSquares, setLegalSquares] = useState<Square[]>([])
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)

  const t = THEMES[theme]

  // ── Drag & drop ──────────────────────────────────────────────────────────
  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    const success = makeMove({
      from: sourceSquare as Square,
      to: targetSquare as Square,
      promotion: "q",
    })
    if (success) {
      setLastMove({ from: sourceSquare as Square, to: targetSquare as Square })
      setSelectedSquare(null)
      setLegalSquares([])
    }
    return success
  }

  // ── Clic sur une case ─────────────────────────────────────────────────────
  const onSquareClick = useCallback((square: Square) => {
    // Si une pièce est déjà sélectionnée et on clique sur une case légale → joue le coup
    if (selectedSquare && legalSquares.includes(square)) {
      const success = makeMove({
        from: selectedSquare,
        to: square,
        promotion: "q",
      })
      if (success) {
        setLastMove({ from: selectedSquare, to: square })
      }
      setSelectedSquare(null)
      setLegalSquares([])
      return
    }

    // Sinon → sélectionne la pièce et affiche ses coups légaux
    const moves = getLegalMoves(square)
    if (moves.length > 0) {
      setSelectedSquare(square)
      setLegalSquares(moves)
    } else {
      setSelectedSquare(null)
      setLegalSquares([])
    }
  }, [selectedSquare, legalSquares, makeMove, getLegalMoves])

  // ── Styles des cases ──────────────────────────────────────────────────────
  const customSquareStyles: Record<string, React.CSSProperties> = {}

  // Dernier coup joué — surbrillance jaune
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: t.lastMoveLight }
    customSquareStyles[lastMove.to]   = { backgroundColor: t.lastMoveDark }
  }

  // Case sélectionnée — vert foncé
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = { backgroundColor: t.selectedSquare }
  }

  // Coups légaux — point vert (case vide) ou anneau vert (capture)
  legalSquares.forEach((sq) => {
    const isCapture = gameState.fen.includes(" ") // vérification simplifiée
    // Détecte si la case cible contient une pièce adverse
    const fenBoard = gameState.fen.split(" ")[0]
    const files = "abcdefgh"
    const file = files.indexOf(sq[0])
    const rank = 8 - parseInt(sq[1])
    const rows = fenBoard.split("/")
    let col = 0
    let hasEnemy = false
    for (const char of rows[rank]) {
      if (col === file) {
        hasEnemy = /[a-zA-Z]/.test(char)
        break
      }
      if (/\d/.test(char)) col += parseInt(char)
      else col++
    }

    customSquareStyles[sq] = hasEnemy
      ? { background: t.capture, borderRadius: "50%" }
      : { background: t.legalMove }
  })

  // ── Statut de la partie ───────────────────────────────────────────────────
  const getStatus = (): { text: string; color: string } => {
    const { isCheckmate, isStalemate, isDraw, isCheck, turn } = gameState
    const player = turn === "w" ? "Blancs" : "Noirs"
    if (isCheckmate) return { text: `♛ Échec et mat — ${turn === "w" ? "Noirs" : "Blancs"} gagnent !`, color: "#ef4444" }
    if (isStalemate)  return { text: "🤝 Pat — Partie nulle", color: "#f59e0b" }
    if (isDraw)       return { text: "🤝 Partie nulle", color: "#f59e0b" }
    if (isCheck)      return { text: `⚠️ Échec ! Tour des ${player}`, color: "#f59e0b" }
    return { text: `Tour des ${player}`, color: t.muted }
  }

  const status = getStatus()

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100px",
      background: t.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Segoe UI', sans-serif",
      transition: "all 0.3s ease",
    }}>

      {/* ── Header ── */}
      <div style={{
        width: "100%",
        maxWidth: "900px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
      }}>
        <div>
          <h1 style={{ color: t.accent, fontSize: "26px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
            AndChess
          </h1> 
        </div>

        {/* Bouton Dark / Light */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            background: t.surface2,
            color: t.text,
            border: `1px solid ${t.border}`,
            borderRadius: "8px",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      {/* ── Contenu principal ── */}
      <div style={{
        display: "flex",
        gap: "24px",
        alignItems: "flex-start",
        width: "100%",
        maxWidth: "520px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}>

        {/* ── Plateau ── */}
        <div style={{
          background: t.surface,
          borderRadius: "12px",
          padding: "10px",
          border: `1px solid ${t.border}`,
          boxShadow: "0 20px 60px rgba(181, 135, 99, 0.64)",
        }}>
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

        {/* ── Panneau droit ── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          minWidth: "220px",
          flex: 1,
          maxWidth: "280px",
        }}>

          {/* Statut */}
          <div style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "10px",
            padding: "16px 20px",
          }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.muted, marginBottom: "8px" }}>
              Statut
            </div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: status.color }}>
              {status.text}
            </div>
          </div>

          {/* Indicateur de tour */}
          <div style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "10px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              width: "28px", height: "28px",
              borderRadius: "50%",
              background: gameState.turn === "w" ? "#f5f5f5" : "#1a1a1a",
              border: "2px solid " + t.border,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }} />
            <div>
              <div style={{ fontSize: "10px", color: t.muted, textTransform: "uppercase", letterSpacing: "0.15em" }}>Au tour de</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: t.text }}>
                {gameState.turn === "w" ? "Blancs" : "Noirs"}
              </div>
            </div>
          </div>

          {/* Légende */}
          <div style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "10px",
            padding: "16px 20px",
          }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.muted, marginBottom: "12px" }}>
              Légende
            </div>
            {[
              { color: "rgba(20,85,30,0.6)", label: "· Coup possible" },
              { color: "rgba(205,210,106,0.7)", label: "□ Dernier coup" },
              { color: "rgba(20,85,30,0.5)", label: "○ Capture possible" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "18px", height: "18px", background: item.color, borderRadius: "3px", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: t.text }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Historique des coups */}
          <div style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "10px",
            padding: "16px 20px",
            flex: 1,
          }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.muted, marginBottom: "12px" }}>
              Historique
            </div>
            <div style={{
              maxHeight: "180px",
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "24px 1fr 1fr",
              gap: "4px",
              fontSize: "13px",
            }}>
              {gameState.history.length === 0 && (
                <span style={{ color: t.muted, fontSize: "12px", gridColumn: "1 / -1" }}>Aucun coup joué</span>
              )}
              {gameState.history.map((move, i) => (
                i % 2 === 0 && (
                  <>
                    <span key={`n${i}`} style={{ color: t.muted, fontSize: "11px" }}>{Math.floor(i / 2) + 1}.</span>
                    <span key={`w${i}`} style={{ color: t.text, fontWeight: 500 }}>{move}</span>
                    <span key={`b${i}`} style={{ color: t.text, fontWeight: 500 }}>
                      {gameState.history[i + 1] ?? ""}
                    </span>
                  </>
                )
              ))}
            </div>
          </div>

          {/* Bouton Nouvelle partie */}
          <button
            onClick={() => {
              resetGame()
              setLastMove(null)
              setSelectedSquare(null)
              setLegalSquares([])
            }}
            style={{
              background: t.button,
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              transition: "background 0.2s",
              width: "100%",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = t.buttonHover)}
            onMouseOut={(e) => (e.currentTarget.style.background = t.button)}
          >
            ↺ Nouvelle partie
          </button>

        </div>
      </div>
    </div>
  )
}
