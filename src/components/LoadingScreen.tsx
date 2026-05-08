import { useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { FaChessKing } from "react-icons/fa";

const PIECES = ["♔", "♕", "♖", "♗", "♘", "♙", "♚", "♛", "♜", "♝", "♞", "♟"];

interface LoadingScreenProps {
  onFinish: () => void;
}

export function LoadingScreen({ onFinish }: LoadingScreenProps) {
  const { appTheme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [randomStyles] = useState(() =>
    PIECES.map(() => ({
      fontSize: `${Math.random() * 32 + 20}px`,
      top: `${Math.random() * 80 + 10}%`,
    })),
  );

  useEffect(() => {
    // Barre de progression simulée
    const steps = [
      { target: 30, delay: 100 },
      { target: 55, delay: 400 },
      { target: 75, delay: 700 },
      { target: 90, delay: 1000 },
      { target: 100, delay: 1400 },
    ];

    steps.forEach(({ target, delay }) => {
      setTimeout(() => setProgress(target), delay);
    });

    // Fade out puis appel onFinish
    setTimeout(() => setFadeOut(true), 1900);
    setTimeout(() => onFinish(), 2300);
  }, [onFinish]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          appTheme === "dark"
            ? "radial-gradient(ellipse at 30% 20%, #0c2340 0%, #05101f 60%, #020810 100%)"
            : "radial-gradient(ellipse at 30% 20%, #dbeafe 0%, #f0f6ff 60%, #e4edf8 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s ease",
        overflow: "hidden",
      }}
    >
      <ThemeToggle />

      {/* Grille de fond */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            `linear-gradient(rgba(56,189,248,0.03) 1px,transparent 1px),` +
            `linear-gradient(90deg,rgba(56,189,248,0.03) 1px,transparent 1px)`,
          backgroundSize: "44px 44px",
          pointerEvents: "none",
        }}
      />

      {/* Pièces flottantes en arrière-plan */}
      {PIECES.map((piece, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            fontSize: randomStyles[i].fontSize,
            color:
              appTheme === "dark"
                ? "rgba(56,189,248,0.08)"
                : "rgba(2,132,199,0.08)",
            left: `${(i / PIECES.length) * 90 + 5}%`,
            top: randomStyles[i].top,
            animation: `pieceFloat ${3 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {piece}
        </div>
      ))}

      {/* Contenu central */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
          animation: "fadeUp 0.6s ease both",
        }}
      >
        {/* Logo animé */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "80px",
              animation: "floatY 2s ease-in-out infinite",
              filter: `drop-shadow(0 0 28px ${
                appTheme === "dark"
                  ? "rgba(56,189,248,0.5)"
                  : "rgba(2,132,199,0.4)"
              })`,
              display: "block",
              marginBottom: "20px",
              lineHeight: 1,
            }}
          >
            <FaChessKing size={50} color="#0556a7" />
          </div>

          <h1
            style={{
              fontSize: "48px",
              fontWeight: 900,
              background:
                "linear-gradient(135deg,#38bdf8 0%,#818cf8 50%,#38bdf8 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 3s linear infinite",
              letterSpacing: "-1px",
              marginBottom: "8px",
            }}
          >
            AndChess
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "var(--text3)",
              fontFamily: "'Fira Code', monospace",
              letterSpacing: "0.15em",
            }}
          >
            Chargement en cours...
          </p>
        </div>

        {/* Barre de progression */}
        <div style={{ width: "280px" }}>
          <div
            style={{
              height: "3px",
              background:
                appTheme === "dark"
                  ? "rgba(56,189,248,0.1)"
                  : "rgba(2,132,199,0.1)",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg,#38bdf8,#818cf8)",
                borderRadius: "4px",
                transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: "0 0 12px rgba(56,189,248,0.6)",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--text3)",
                fontFamily: "'Fira Code', monospace",
              }}
            >
              {progress < 50
                ? "Initialisation..."
                : progress < 90
                  ? "Connexion au serveur..."
                  : "Prêt !"}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--accent)",
                fontFamily: "'Fira Code', monospace",
                fontWeight: 700,
              }}
            >
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
