export interface BoardTheme {
  bg: string;
  bgHeader: string;
  colorBorder: string;
  borderShadow: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  border: string;
  button: string;
  buttonHover: string;
  accent: string;
  lightSquare: string;
  darkSquare: string;
  lastMoveLight: string;
  lastMoveDark: string;
  selectedSquare: string;
  legalMove: string;
  capture: string;
  check: string;
}

export const THEMES: Record<"dark" | "light", BoardTheme> = {
  dark: {
    bg: "radial-gradient(circle at 15% 20%, #2a145f 0%,rgb(13, 13, 45) 48%,rgb(1, 1, 17) 100%)",
    bgHeader: "linear-gradient(135deg,#121f56,#13043d)",
    colorBorder: "#00d4ff",
    borderShadow: " #121f56",
    surface: "rgba(14, 19, 43, 0.82)",
    surface2: "linear-gradient(135deg, #1c2f76, #4a1e88)",
    text: "#ecf3ff",
    muted: "#9db2d7",
    border: "rgba(0, 212, 255, 0.45)",
    button: "linear-gradient(135deg,rgb(14, 43, 159), #8b3dff)",
    buttonHover: "linear-gradient(135deg,rgb(86, 122, 253),rgb(159, 85, 254))",
    accent: "#68f5ff",
    lightSquare: "#f0d9b5",
    darkSquare: "#b58863",
    lastMoveLight: "rgba(228, 82, 165, 0.58)",
    lastMoveDark: "rgba(71, 232, 31, 0.79)",
    selectedSquare: "rgba(57, 228, 42, 0.8)",
    legalMove:
      "radial-gradient(circle, rgba(19, 243, 15, 0.55) 25%, transparent 25%)",
    capture:
      "radial-gradient(circle, transparent 60%, rgba(251, 210, 6, 0.9) 60%)",
    check: "rgba(255,0,0,0.6)",
  },
  light: {
    bg: "radial-gradient(circle at 10% 20%, #d9e3ff 0%, #eff3ff 45%, #f8fbff 100%)",
    bgHeader: "linear-gradient(135deg, #d9e2ff, #eed9ff)",
    colorBorder: "#6366f1",
    borderShadow: "rgba(99, 102, 241, 0.35)",
    surface: "rgba(255, 255, 255, 0.88)",
    surface2: "linear-gradient(135deg, #dbe5ff, #eddcff)",
    text: "#1f2654",
    muted: "#57618f",
    border: "rgba(99, 102, 241, 0.3)",
    button: "linear-gradient(135deg, #5e73ff, #8a4dff)",
    buttonHover: "linear-gradient(135deg, #485fed, #7741eb)",
    accent: "#3b49d7",
    lightSquare: "#f0d9b5",
    darkSquare: "#b58863",
    lastMoveLight: "rgba(228, 82, 165, 0.58)",
    lastMoveDark: "rgba(71, 232, 31, 0.79)",
    selectedSquare: "rgba(57, 228, 42, 0.8)",
    legalMove:
      "radial-gradient(circle, rgba(19, 243, 15, 0.55) 25%, transparent 25%)",
    capture:
      "radial-gradient(circle, transparent 60%, rgba(251, 210, 6, 0.9)60%)",
    check: "rgba(255,0,0,0.6)",
  },
};
