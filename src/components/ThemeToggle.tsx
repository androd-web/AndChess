import { useTheme } from "../hooks/useTheme"
import { FaSun, FaMoon } from "react-icons/fa"

interface ThemeToggleProps {
  position?: "fixed" | "relative"
}

export function ThemeToggle({ position = "fixed" }: ThemeToggleProps) {
  const { appTheme, toggleAppTheme } = useTheme()

  return (
    <button
      onClick={toggleAppTheme}
      title={appTheme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      style={{
        position,
        top: position === "fixed" ? "20px" : undefined,
        right: position === "fixed" ? "20px" : undefined,
        zIndex: 9999,
        width: "42px",
        height: "42px",
        borderRadius: "12px",
        background: "var(--surface2)",
        border: "1px solid var(--border2)",
        color: "var(--text2)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        transition: "all 0.2s ease",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
      onMouseOver={e => {
        e.currentTarget.style.background = "var(--surface3)"
        e.currentTarget.style.borderColor = "var(--accent)"
        e.currentTarget.style.color = "var(--accent)"
      }}
      onMouseOut={e => {
        e.currentTarget.style.background = "var(--surface2)"
        e.currentTarget.style.borderColor = "var(--border2)"
        e.currentTarget.style.color = "var(--text2)"
      }}
    >
      {appTheme === "dark" ? <FaSun /> : <FaMoon />}
    </button>
  )
}
