import type { CSSProperties } from "react"
import { useTheme } from "../hooks/useTheme"
import { IoMdRefresh , IoMdCloseCircle} from "react-icons/io";
import { FaTrophy,FaFlagCheckered } from "react-icons/fa"; 
import { FaHandshake } from "react-icons/fa6";



interface GameOverModalProps {
  isOpen:    boolean
  type:      "win" | "lose" | "draw" | "resign"
  reason?:   string
  onReplay:  () => void   // retour au wizard
}

export function GameOverModal({ isOpen, type, reason, onReplay }: GameOverModalProps) {
  const { appTheme } = useTheme()

  if (!isOpen) return null

  const configs = {
    win: {
      icon:  <FaTrophy fontSize={40} color="gold"/>,
      title: "Félicitations !",
      sub: reason ?? "Tu as gagné la partie !",
      color: "#22c55e",
      grad: "linear-gradient(135deg,#22c55e,#16a34a)",
    },
    lose: {
      icon: <IoMdCloseCircle color="#ef4444"/>,
      title: "Partie terminée",
      sub: reason ?? " Malheuresement vous avez perdu !",
      color: "#ef4444",
      grad: "linear-gradient(135deg,#ef4444,#dc2626)",
    },
    draw: {
      icon: <FaHandshake color="#f59e0b"/>,
      title: "Match nul",
      sub: reason ?? "La partie se termine sur un match nul.",
      color: "#f59e0b",
      grad: "linear-gradient(135deg,#f59e0b,#d97706)",
    },
    resign: {
      icon: <FaFlagCheckered/>,
      title: "Abandon",
      sub: "Tu as abandonné la partie.",
      color: "#94a3b8",
      grad: "linear-gradient(135deg,#64748b,#475569)",
    },
  }

  const cfg = configs[type]

  const overlay: CSSProperties = {
    position: "fixed", inset: 0,
    background: appTheme === "dark"
      ? "rgba(2,8,20,0.82)"
      : "rgba(240,246,255,0.85)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9000,
    backdropFilter: "blur(8px)",
    animation: "fadeIn 0.25s ease both",
  }

  const box: CSSProperties = {
    background: "var(--card-bg)",
    border: "1px solid var(--border2)",
    borderRadius: "24px",
    padding: "48px 44px",
    maxWidth: "400px",
    width: "90%",
    textAlign: "center",
    boxShadow: `var(--card-shadow), 0 0 0 1px ${cfg.color}22`,
    animation: "scaleIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both",
    position: "relative",
    overflow: "hidden",
  }

  const topBar: CSSProperties = {
    position: "absolute", top: 0, left: 0, right: 0,
    height: "3px",
    background: cfg.grad,
  }

  return (
    <div style={overlay}>
      <div style={box}>
        <div style={topBar} />

        <div style={{
          fontSize: "64px",
          marginBottom: "16px",
          animation: "floatY 2.5s ease-in-out infinite",
          display: "block",
          lineHeight: 1,
        }}>
          {cfg.icon}
        </div>

        <h2 style={{
          fontSize: "28px", fontWeight: 900,
          color: cfg.color,
          marginBottom: "10px",
          letterSpacing: "-0.3px",
        }}>
          {cfg.title}
        </h2>

        <p style={{
          fontSize: "15px",
          color: "var(--text2)",
          marginBottom: "36px",
          lineHeight: 1.6,
        }}>
          {cfg.sub}
        </p>

        <button
          onClick={onReplay}
          style={{
            width: "100%",
            padding: "16px 24px",
            background: cfg.grad,
            border: "none",
            borderRadius: "14px",
            color: "#fff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.02em",
            boxShadow: `0 4px 24px ${cfg.color}44`,
            transition: "opacity 0.18s, transform 0.18s",
            textAlign: "center",
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          <IoMdRefresh size={25}/> Nouvelle partie
        </button>
      </div>
    </div>
  )
}
