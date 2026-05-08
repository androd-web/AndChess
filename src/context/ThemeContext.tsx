import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import {
  type AppTheme,
  type BoardThemeId,
  type BoardThemeConfig,
  BOARD_THEMES,
} from "../types/theme.types"

// ── Context ───────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  appTheme:       AppTheme
  boardTheme:     BoardThemeId
  boardConfig:    BoardThemeConfig
  toggleAppTheme: () => void
  setBoardTheme:  (t: BoardThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
export { ThemeContext }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appTheme, setAppTheme]     = useState<AppTheme>("dark")
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>("classic")

  // Applique le data-theme sur <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", appTheme)
  }, [appTheme])

  const toggleAppTheme = () =>
    setAppTheme(prev => (prev === "dark" ? "light" : "dark"))

  const boardConfig =
    BOARD_THEMES.find(t => t.id === boardTheme) ?? BOARD_THEMES[0]

  return (
    <ThemeContext.Provider
      value={{ appTheme, boardTheme, boardConfig, toggleAppTheme, setBoardTheme }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
