import type { FC } from "react"
// import type { Square } from "chess.js"
import type { PromotionPiece } from "../types/chess.types"

interface PromotionModalProps {
  isOpen: boolean
  color: "w" | "b"
  onSelect: (piece: PromotionPiece) => void
  theme: {
    bg: string
    surface: string
    border: string
    text: string
    muted: string
  }
}

// Pièces disponibles à la promotion
const PIECES: { symbol: PromotionPiece; label: string; white: string; black: string }[] = [
  { symbol: "q", label: "Dame",    white: "♕", black: "♛" },
  { symbol: "r", label: "Tour",    white: "♖", black: "♜" },
  { symbol: "b", label: "Fou",     white: "♗", black: "♝" },
  { symbol: "n", label: "Cavalier",white: "♘", black: "♞" },
]

export const PromotionModal: FC<PromotionModalProps> = ({
  isOpen,
  color,
  onSelect,
  theme: t,
}) => {
  if (!isOpen) return null

  return (
    // Overlay sombre
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)",
    }}>

      {/* Modal */}
      <div style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: "16px",
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
        minWidth: "300px",
      }}>

        {/* Titre */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: t.muted,
            marginBottom: "6px",
          }}>
            Promotion du pion
          </div>
          <div style={{
            fontSize: "18px",
            fontWeight: 700,
            color: t.text,
          }}>
            Choisissez une pièce
          </div>
        </div>

        {/* Grille des pièces */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          width: "100%",
        }}>
          {PIECES.map((piece) => (
            <button
              key={piece.symbol}
              onClick={() => onSelect(piece.symbol)}
              style={{
                background: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: "12px",
                padding: "16px 12px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s",
                color: t.text,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#b58863"
                e.currentTarget.style.background = "rgba(181,136,99,0.15)"
                e.currentTarget.style.transform = "scale(1.05)"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = t.border
                e.currentTarget.style.background = t.bg
                e.currentTarget.style.transform = "scale(1)"
              }}
            >
              {/* Symbole de la pièce */}
              <span style={{ fontSize: "40px", lineHeight: 1 }}>
                {color === "w" ? piece.white : piece.black}
              </span>
              {/* Nom de la pièce */}
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                color: t.muted,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                {piece.label}
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
