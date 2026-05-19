import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useTheme } from "../hooks/useTheme";
import { BOARD_THEMES, type BoardThemeId, type BoardThemeConfig } from "../types/theme.types";
import { ThemeToggle } from "./ThemeToggle";
import type { Difficulty } from "../types/chess.types";
import {
  FaRobot, 
  FaClipboardList,
  FaChessKing
} from "react-icons/fa";
import { HiLink } from "react-icons/hi2";
import { BsStars } from "react-icons/bs";
import { PiHourglassLowBold } from "react-icons/pi";
import { GoRocket } from "react-icons/go";

// ── Types ─────────────────────────────────────────────────────────────────────
type WizardScreen = "mode" | "ai-config" | "multi-config" | "waiting";

interface GameWizardProps {
  // Callbacks vers App.tsx
  onStartVsAI: (opts: AIGameOptions) => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
  // État socket
  roomId: string | null;
  isConnected: boolean;
  isWaiting: boolean;
  playerColor: "w" | "b" | null;
}

export interface AIGameOptions {
  difficulty: Difficulty;
  playerColor: "w" | "b" | "random";
  boardTheme: BoardThemeId;
}

// ── Canvas particules ─────────────────────────────────────────────────────────
const SYMBOLS = ["♟", "♞", "♝", "♜", "♛", "♚", "♙", "♘", "♗", "♖", "♕", "♔"];

function ParticleBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const pts = Array.from({ length: 48 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      sz: Math.random() * 20 + 10,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      op: Math.random() * 0.8 + 0.2,
      sym: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      rot: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.004,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rv;
        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50;
        if (p.y > canvas.height + 50) p.y = -50;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.op;
        ctx.fillStyle = "#0f9dda";
        ctx.font = `${p.sz}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.sym, 0, 0);
        ctx.restore();
      });
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}

// ── Composant Wizard ──────────────────────────────────────────────────────────
export function GameWizard({
  onStartVsAI,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  roomId,
  isConnected,
  isWaiting,
  playerColor,
}: GameWizardProps) {
  const { appTheme, boardTheme, setBoardTheme } = useTheme();

  const [screen, setScreen] = useState<WizardScreen>("mode");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [color, setColor] = useState<"w" | "b" | "random">("random");
  const [joinCode, setJoinCode] = useState("");
  const [joinMode, setJoinMode] = useState<"create" | "join">("create");
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 40);
  }, [screen]);

  useEffect(() => {
    if (isWaiting) setTimeout(() => setScreen("waiting"), 0);
  }, [isWaiting]);

  function copyLink() {
    if (!roomId) return;
    navigator.clipboard
      .writeText(`${location.origin}?room=${roomId}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
  }

  // ── Styles ──────────────────────────────────────────────────────────────
  const page: CSSProperties = {
    minHeight: "100vh",
    width: "100vw",
    background:
      appTheme === "dark"
        ? "radial-gradient(ellipse at 25% 15%,#0c2340 0%,#05101f 55%,#020810 100%)"
        : "radial-gradient(ellipse at 25% 15%,#dbeafe 0%,#f0f6ff 60%,#e4edf8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  };

  const grid: CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundImage:
      `linear-gradient(var(--border) 1px,transparent 1px),` +
      `linear-gradient(90deg,var(--border) 1px,transparent 1px)`,
    backgroundSize: "44px 44px",
    pointerEvents: "none",
    zIndex: 0,
  };

  const card: CSSProperties = {
    position: "relative",
    zIndex: 2,
    background: "var(--card-bg)",
    border: "1px solid var(--border2)",
    borderRadius: "28px",
    padding: "52px 48px",
    width: "100%",
    maxWidth: "520px",
    backdropFilter: "blur(24px)",
    boxShadow: "var(--card-shadow)",
    transform: visible
      ? "translateY(0) scale(1)"
      : "translateY(24px) scale(0.97)",
    opacity: visible ? 1 : 0,
    transition:
      "transform 0.5s cubic-bezier(0.34,1.4,0.64,1), opacity 0.4s ease",
  };

  const topGlow: CSSProperties = {
    position: "absolute",
    top: 0,
    left: "15%",
    width: "70%",
    height: "1px",
    background: "var(--glow-top)",
  };

  const wizTitle = (text: string, sub?: string) => (
    <div style={{ marginBottom: "36px" }}>
      <h2
        style={{
          fontSize: "28px",
          fontWeight: 900,
          background:
            "linear-gradient(135deg,var(--accent) 0%,var(--accent2) 50%,var(--accent) 100%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "shimmer 4s linear infinite",
          letterSpacing: "-0.3px",
          marginBottom: sub ? "6px" : 0,
        }}
      >
        {text}
      </h2>
      {sub && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--text3)",
            letterSpacing: "0.03em",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );

  const btnFill = (grad: string, sh: string): CSSProperties => ({
    width: "100%",
    padding: "17px 24px",
    background: grad,
    border: "none",
    borderRadius: "14px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: sh,
    letterSpacing: "0.02em",
    transition: "opacity 0.18s, transform 0.18s",
  });

  const btnGhost: CSSProperties = {
    width: "100%",
    padding: "16px 24px",
    background: "transparent",
    border: "1px solid var(--border2)",
    borderRadius: "14px",
    color: "var(--text2)",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "border-color 0.18s, color 0.18s",
  };

  const back = () => {
    setVisible(false);
    setTimeout(() => {
      setScreen("mode");
      setVisible(false);
      setTimeout(() => setVisible(true), 40);
    }, 150);
  };

  const sectionLabel: CSSProperties = {
    fontSize: "9px",
    fontFamily: "'Fira Code',monospace",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "var(--text3)",
    marginBottom: "10px",
    display: "block",
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: MODE
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "mode") {
    return (
      <div style={page}>
        <ParticleBg />
        <div style={grid} />
        <ThemeToggle />
        <div style={card}>
          <div style={topGlow} />

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <div
              style={{
                fontSize: "64px",
                animation: "floatY 3s ease-in-out infinite",
                filter: "drop-shadow(0 0 24px rgba(56,189,248,0.45))",
                display: "block",
                marginBottom: "14px",
                lineHeight: 1,
              }}
            >
              <FaChessKing size={50} color="#0556a7" />
            </div>
            <h1
              style={{
                fontSize: "38px",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                background:
                  "linear-gradient(135deg,#38bdf8 0%,#818cf8 50%,#38bdf8 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer 4s linear infinite",
              }}
            >
              AndChess
            </h1>
            <p
              style={{
                color: "var(--text3)",
                fontSize: "13px",
                marginTop: "6px",
                letterSpacing: "0.04em",
              }}
            >
              Comment veux-tu jouer ?
            </p>
          </div>

          {/* Bouton IA */}
          <div
            style={{
              background: "rgba(129,140,248,0.06)",
              border: "1px solid rgba(129,140,248,0.18)",
              borderRadius: "18px",
              padding: "20px",
              marginBottom: "14px",
            }}
          >
            <span style={{ ...sectionLabel, color: "rgba(129,140,248,0.8)" }}>
              Solo
            </span>
            <button
              onClick={() => {
                setVisible(false);
                setTimeout(() => {
                  setScreen("ai-config");
                  setVisible(false);
                  setTimeout(() => setVisible(true), 40);
                }, 150);
              }}
              style={btnFill(
                "linear-gradient(135deg,#818cf8,#6366f1)",
                "0 4px 24px rgba(129,140,248,0.35)",
              )}
            >
              <FaRobot size={20} color="#ff0303" /> Jouer contre l'IA
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "4px 0 14px",
            }}
          >
            <div
              style={{ flex: 1, height: "1px", background: "var(--border)" }}
            />
            <span
              style={{
                fontSize: "10px",
                color: "var(--text3)",
                fontFamily: "monospace",
                letterSpacing: "0.15em",
              }}
            >
              OU
            </span>
            <div
              style={{ flex: 1, height: "1px", background: "var(--border)" }}
            />
          </div>

          {/* Bouton Multijoueur */}
          <div
            style={{
              background: "rgba(56,189,248,0.04)",
              border: "1px solid rgba(56,189,248,0.15)",
              borderRadius: "18px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <span style={{ ...sectionLabel, color: "rgba(56,189,248,0.7)" }}>
              Multijoueur en ligne
            </span>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <button
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => {
                    setJoinMode("create");
                    setScreen("multi-config");
                    setVisible(false);
                    setTimeout(() => setVisible(true), 40);
                  }, 150);
                }}
                style={btnFill(
                  "linear-gradient(135deg,#0ea5e9,#0284c7)",
                  "0 4px 24px rgba(14,165,233,0.35)",
                )}
              >
                <BsStars size={20} color="#f5b11d" /> Créer une partie
              </button>
              <button
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => {
                    setJoinMode("join");
                    setScreen("multi-config");
                    setVisible(false);
                    setTimeout(() => setVisible(true), 40);
                  }, 150);
                }}
                style={btnGhost}
              >
                <HiLink size={20} color="#7e7a7a" /> Rejoindre une partie
              </button>
            </div>
          </div>

          {/* Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: isConnected ? "var(--green)" : "var(--red)",
                boxShadow: isConnected
                  ? "0 0 8px var(--green)"
                  : "0 0 8px var(--red)",
                animation: isConnected ? "pulseGlow 2s infinite" : "none",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: "var(--text3)",
                fontFamily: "monospace",
              }}
            >
              {isConnected ? "Connecté au serveur" : "Déconnecté"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: AI CONFIG
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "ai-config") {
    const difficulties: {
      value: Difficulty;
      label: string;
      icon: string;
      desc: string;
    }[] = [
      {
        value: "easy",
        label: "Facile",
        icon: "🟢",
        desc: "Parfait pour apprendre",
      },
      { value: "medium", label: "Moyen", icon: "🟡", desc: "Bon challenge" },
      {
        value: "hard",
        label: "Difficile",
        icon: "🔴",
        desc: "Quasi imbattable",
      },
    ];

    const colors: {
      value: "w" | "b" | "random";
      label: string;
      icon: string;
    }[] = [
      { value: "w", label: "Blancs", icon: "♔" },
      { value: "b", label: "Noirs", icon: "♚" },
      { value: "random", label: "Aléatoire", icon: "🎲" },
    ];

    return (
      <div style={page}>
        <ParticleBg />
        <div style={grid} />
        <ThemeToggle />
        <div style={{ ...card, maxWidth: "560px" }}>
          <div style={topGlow} />

          <button
            onClick={back}
            style={{
              background: "none",
              border: "none",
              color: "var(--text3)",
              cursor: "pointer",
              fontSize: "13px",
              marginBottom: "24px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Retour
          </button>

          {wizTitle("Configuration IA", "Personnalise ta partie contre l'IA")}

          {/* Difficulté */}
          <span style={sectionLabel}>Niveau de difficulté</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {difficulties.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                style={{
                  padding: "14px 10px",
                  background:
                    difficulty === d.value
                      ? "rgba(56,189,248,0.1)"
                      : "var(--surface2)",
                  border: `1px solid ${difficulty === d.value ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.18s",
                }}
              >
                <span style={{ fontSize: "22px" }}>{d.icon}</span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color:
                      difficulty === d.value ? "var(--accent)" : "var(--text2)",
                  }}
                >
                  {d.label}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text3)",
                    textAlign: "center",
                  }}
                >
                  {d.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Couleur */}
          <span style={sectionLabel}>Ta couleur</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                style={{
                  padding: "14px 10px",
                  background:
                    color === c.value
                      ? "rgba(56,189,248,0.1)"
                      : "var(--surface2)",
                  border: `1px solid ${color === c.value ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.18s",
                }}
              >
                <span
                  style={{
                    fontSize: "28px",
                    filter:
                      c.value === "w"
                        ? "none"
                        : c.value === "b"
                          ? "invert(1)"
                          : "none",
                  }}
                >
                  {c.icon}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: color === c.value ? "var(--accent)" : "var(--text2)",
                  }}
                >
                  {c.label}
                </span>
              </button>
            ))}
          </div>

          {/* Thème plateau */}
          <span style={sectionLabel}>Couleur du plateau</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5,1fr)",
              gap: "8px",
              marginBottom: "32px",
            }}
          >
            {BOARD_THEMES.map((t: BoardThemeConfig) => (
              <button
                key={t.id}
                onClick={() => setBoardTheme(t.id)}
                title={t.name}
                style={{
                  padding: "8px 6px",
                  background:
                    boardTheme === t.id
                      ? "rgba(56,189,248,0.1)"
                      : "var(--surface2)",
                  border: `2px solid ${boardTheme === t.id ? "var(--accent)" : "transparent"}`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.18s",
                }}
              >
                {/* Mini échiquier 2x2 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1px",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  {t.preview.map((col: string, i: number) => (
                    <div
                      key={i}
                      style={{ width: "14px", height: "14px", background: col }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    color:
                      boardTheme === t.id ? "var(--accent)" : "var(--text3)",
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {t.name}
                </span>
              </button>
            ))}
          </div>

          {/* Lancer */}
          <button
            onClick={() =>
              onStartVsAI({ difficulty, playerColor: color, boardTheme })
            }
            style={btnFill(
              "linear-gradient(135deg,#818cf8,#6366f1)",
              "0 4px 28px rgba(129,140,248,0.4)",
            )}
          >
            < GoRocket  size={20} color="#f41111"/> Lancer la partie
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: MULTI CONFIG
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "multi-config") {
    return (
      <div style={page}>
        <ParticleBg />
        <div style={grid} />
        <ThemeToggle />
        <div style={card}>
          <div style={topGlow} />
          <button
            onClick={back}
            style={{
              background: "none",
              border: "none",
              color: "var(--text3)",
              cursor: "pointer",
              fontSize: "13px",
              marginBottom: "24px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Retour
          </button>

          {wizTitle(
            joinMode === "create" ? "Créer une partie" : "Rejoindre une partie",
            joinMode === "create"
              ? "Partage le lien avec ton adversaire"
              : "Entre le code de ton adversaire",
          )}

          {joinMode === "create" ? (
            <button
              onClick={onCreateRoom}
              style={btnFill(
                "linear-gradient(135deg,#0ea5e9,#0284c7)",
                "0 4px 24px rgba(14,165,233,0.35)",
              )}
            >
              <BsStars size={20} color="#f5b11d" /> Générer le lien
            </button>
          ) : (
            <>
              <span style={sectionLabel}>Code de la salle</span>
              <input
                type="text"
                placeholder="Colle le code ici..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.trim())}
                style={{
                  width: "100%",
                  background: "var(--surface2)",
                  border: "1px solid var(--border2)",
                  borderRadius: "13px",
                  padding: "16px",
                  color: "var(--text)",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  outline: "none",
                  marginBottom: "20px",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
              />
              <button
                onClick={() => joinCode && onJoinRoom(joinCode)
              
                }
                disabled={!joinCode}
                style={{
                  ...btnFill(
                    "linear-gradient(135deg,#0ea5e9,#0284c7)",
                    "0 4px 24px rgba(14,165,233,0.35)",
                  ),
                  opacity: !joinCode ? 0.45 : 1, 
                }}
              >
                < GoRocket  size={20} color="#f41111"/> Rejoindre
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: WAITING
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "waiting" && roomId) {
    return (
      <div style={page}>
        <ParticleBg />
        <div style={grid} />
        <ThemeToggle />
        <div style={card}>
          <div style={topGlow} />

          <button
            onClick={() => {
              onLeaveRoom();
              setScreen("mode");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text3)",
              cursor: "pointer",
              fontSize: "13px",
              marginBottom: "24px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Annuler
          </button>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                fontSize: "52px",
                animation: "floatY 2.5s ease-in-out infinite",
                marginBottom: "14px"
              }}
            >
              <PiHourglassLowBold  color="#cc6e0a"/>
            </div>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "var(--text)",
                marginBottom: "6px",
              }}
            >
              Partie créée !
            </h2>
            <p style={{ color: "var(--text3)", fontSize: "13px" }}>
              Tu joues les{" "}
              <strong style={{ color: "var(--accent)" }}>
                {playerColor === "w" ? "Blancs ♔" : "Noirs ♚"}
              </strong>
            </p>
          </div>

          <span style={sectionLabel}>Code de la salle</span>
          <div
            style={{
              background: "rgba(56,189,248,0.06)",
              border: "1px solid var(--border2)",
              borderRadius: "10px",
              padding: "12px 16px",
              fontFamily: "monospace",
              fontSize: "12px",
              color: "var(--accent)",
              wordBreak: "break-all",
              letterSpacing: "0.04em",
              marginBottom: "14px",
            }}
          >
            {roomId}
          </div>

          <span style={sectionLabel}>Lien à partager</span>
          <div
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "12px 16px",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "var(--text3)",
              wordBreak: "break-all",
              marginBottom: "20px",
            }}
          >
            {`${location.origin}?room=${roomId}`}
          </div>

          <button
            onClick={copyLink}
            style={{
              ...btnFill(
                copied
                  ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : "linear-gradient(135deg,#0ea5e9,#6366f1)",
                copied
                  ? "0 4px 20px rgba(34,197,94,0.35)"
                  : "0 4px 20px rgba(14,165,233,0.35)",
              ),
              marginBottom: "16px",
            }}
          >
            <FaClipboardList size={20} color="#5c3b01" />{copied ? "✓ Lien copié !" : ` Copier le lien`}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "16px",
              background: "rgba(56,189,248,0.04)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "5px" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    animation: `dotBounce 1.3s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <span style={{ color: "var(--text3)", fontSize: "13px" }}>
              En attente de l'adversaire...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
