 import { FaMoon, FaSun, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import type { BoardTheme } from "../theme/boardTheme";
import { GameControls } from "./GameControls";

interface HeaderProps {
  themeMode:     "dark" | "light";
  theme:         BoardTheme;
  isMuted:       boolean;
  isGameOver:    boolean;
  onToggleTheme: () => void;
  onToggleMute:  () => void;
  onReset:       () => void;
  onBackToMenu:  () => void;   // ← nouveau
}

export function Header({
  themeMode,
  theme,
  isMuted,
  isGameOver,
  onToggleTheme,
  onToggleMute,
  onReset,
  onBackToMenu,
}: HeaderProps) {
  return (
    <header className="board-header">

      {/* Logo + bouton retour menu */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={onBackToMenu}
          title="Retour au menu"
          className="header-icon-button"
          style={{ fontSize: "13px", gap: "5px", display: "flex", alignItems: "center" }}
        >
          ← Menu
        </button>
        <h1 className="board-title">AndChess</h1>
      </div>

      {/* Contrôles (Nouvelle partie + Abandonner) */}
      <GameControls
        onReset={onReset}
        onResign={onBackToMenu}   // Abandonner → retour menu
        isGameOver={isGameOver}
        theme={theme}
      />

      {/* Son */}
      <button
        onClick={onToggleMute}
        title={isMuted ? "Activer le son" : "Couper le son"}
        className="header-icon-button"
      >
        {isMuted ? <FaVolumeMute color="#ef4444" /> : <FaVolumeUp />}
      </button>

      {/* Thème Dark / Light */}
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
