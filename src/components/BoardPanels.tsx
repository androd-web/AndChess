import type { CSSProperties } from "react";
import type { BoardTheme } from "../theme/boardTheme";

interface StatusInfo {
  text: string;
  color: string;
}

interface LeftPanelProps {
  status: StatusInfo;
  turn: "w" | "b";
  panelStyle: CSSProperties;
}

interface RightPanelProps {
  theme: BoardTheme;
  history: string[];
  panelStyle: CSSProperties;
}

export function LeftBoardPanel({ status, turn, panelStyle }: LeftPanelProps) {
  return (
    <div className="board-side-panel">
      <div className="board-card" style={panelStyle}>
        <div className="board-card-title">Statut</div>
        <div className="board-status-text" style={{ color: status.color }}>
          {status.text}
        </div>
      </div>

      <div className="board-card board-turn-card" style={panelStyle}>
        <div
          className={`board-turn-dot ${turn === "w" ? "board-turn-white" : "board-turn-black"}`}
        />
        <div>
          <div className="board-card-subtitle">Au tour de</div>
          <div className="board-turn-text">{turn === "w" ? "Blancs" : "Noirs"}</div>
        </div>
      </div>
    </div>
  );
}

export function RightBoardPanel({
  theme,
  history,
  panelStyle,
}: RightPanelProps) {
  return (
    <div className="board-side-panel">
      <div className="board-card" style={panelStyle}>
        <div className="board-card-title board-spaced-title">Légende</div>
        {[
          { color: theme.legalMove, label: "<=> Coup possible" },
          { color: theme.lastMoveLight, label: "<=> Dernier coup" },
          { color: theme.capture, label: "<=> Capture possible" },
        ].map((item, i) => (
          <div key={i} className="board-legend-item">
            <div className="board-legend-color" style={{ background: item.color }} />
            <span className="board-legend-text">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="board-card board-history-card" style={panelStyle}>
        <div className="board-card-title board-spaced-title">Historique</div>
        <div className="board-history-grid">
          {history.length === 0 && (
            <span className="board-history-empty">Aucun coup joué</span>
          )}
          {history.map(
            (move, i) =>
              i % 2 === 0 && (
                <div key={`move-${i}`} className="board-history-row">
                  <span className="board-history-index">{Math.floor(i / 2) + 1}.</span>
                  <span className="board-history-move">{move}</span>
                  <span className="board-history-move">{history[i + 1] ?? ""}</span>
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  );
}
