import { FaMoon, FaSun, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import type { BoardTheme } from "../theme/boardTheme";
import { GameControls } from "./GameControls";

interface HeaderProps {
  themeMode: "dark" | "light";
  theme: BoardTheme;
  isMuted: boolean;
  isGameOver: boolean;
  onToggleTheme: () => void;
  onToggleMute: () => void;
  onReset: () => void;
}

export function Header({
  themeMode,
  theme,
  isMuted,
  isGameOver,
  onToggleTheme,
  onToggleMute,
  onReset,
}: HeaderProps) {
  return (
    <header className="board-header">
      <h1 className="board-title">AndChess</h1>

      <GameControls
        onReset={onReset}
        onResign={() => {}}
        isGameOver={isGameOver}
        theme={theme}
      />

      <button
        onClick={onToggleMute}
        title={isMuted ? "Activer le son" : "Couper le son"}
        className="header-icon-button"
      >
        {isMuted ? <FaVolumeMute color="#ef4444" /> : <FaVolumeUp />}
      </button>

      <button
        onClick={onToggleTheme}
        translate="no"
        lang="fr"
        className="header-theme-button"
      >
        {themeMode === "dark" ? <FaSun /> : <FaMoon />}
        <span translate="no">{themeMode === "dark" ? " Light" : " Dark"}</span>
      </button>
    </header>
  );
}
