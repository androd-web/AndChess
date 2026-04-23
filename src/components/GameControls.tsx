import type { FC } from "react"

interface GameControlsProps {
  onReset: () => void
  onResign: () => void
  isGameOver: boolean
  theme: {
    surface: string
    border: string
    text: string
    muted: string
    button: string
    buttonHover: string
  }
}

export const GameControls: FC<GameControlsProps> = ({
  onReset,
  onResign,
  isGameOver,
  theme: t,
}) => {
  return (
    <div style={{
      display: "flex",
      // flexDirection: "column",
      gap: "10px",
      width: "50%",
      height: "80%"
    }}>

      {/* Bouton Nouvelle partie */}
      <button
        onClick={onReset}
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
          transition: "background 0.2s, transform 0.1s",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = t.buttonHover)}
        onMouseOut={(e) => (e.currentTarget.style.background = t.button)}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        ↺ Nouvelle partie
      </button>

      {/* Bouton Abandonner — désactivé si partie terminée */}
      <button
        onClick={onResign}
        disabled={isGameOver}
        style={{
          background: isGameOver ? t.surface : "transparent",
          color: isGameOver ? t.muted : "#ef4444",
          border: `1px solid ${isGameOver ? t.border : "#ef4444"}`,
          borderRadius: "10px",
          padding: "14px",
          cursor: isGameOver ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "0.05em",
          transition: "all 0.2s",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          opacity: isGameOver ? 0.5 : 1,
        }}
        onMouseOver={(e) => {
          if (!isGameOver) {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)"
          }
        }}
        onMouseOut={(e) => {
          if (!isGameOver) {
            e.currentTarget.style.background = "transparent"
          }
        }}
      >
        🏳 Abandonner
      </button>

    </div>
  )
}
