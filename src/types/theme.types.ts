// ── Types ─────────────────────────────────────────────────────────────────────
export type AppTheme   = "dark" | "light"
export type BoardThemeId = "classic" | "blue" | "green" | "purple" | "midnight"

export interface BoardThemeConfig {
  id:         BoardThemeId
  name:       string
  lightSquare: string
  darkSquare:  string
  preview:    [string, string, string, string] // 4 couleurs pour le mini-preview
}

export const BOARD_THEMES: BoardThemeConfig[] = [
  {
    id: "classic",
    name: "Classique",
    lightSquare: "#f0d9b5",
    darkSquare:  "#b58863",
    preview: ["#f0d9b5", "#b58863", "#f0d9b5", "#b58863"],
  },
  {
    id: "blue",
    name: "Océan",
    lightSquare: "#dee3e6",
    darkSquare:  "#8ca2ad",
    preview: ["#dee3e6", "#8ca2ad", "#dee3e6", "#8ca2ad"],
  },
  {
    id: "green",
    name: "Tournoi",
    lightSquare: "#ffffdd",
    darkSquare:  "#86a666",
    preview: ["#ffffdd", "#86a666", "#ffffdd", "#86a666"],
  },
  {
    id: "purple",
    name: "Violet",
    lightSquare: "#e8daf5",
    darkSquare:  "#9771b5",
    preview: ["#e8daf5", "#9771b5", "#e8daf5", "#9771b5"],
  },
  {
    id: "midnight",
    name: "Nuit",
    lightSquare: "#c5d5e8",
    darkSquare:  "#4a6fa5",
    preview: ["#c5d5e8", "#4a6fa5", "#c5d5e8", "#4a6fa5"],
  },
]
