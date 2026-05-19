import { useState, useCallback, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { LoadingScreen } from "./components/LoadingScreen";
import { GameWizard, type AIGameOptions } from "./components/GameWizard";
import { Board } from "./components/Board";
import { useSocket } from "./hooks/useSocket";
import "./index.css";

type AppScreen = "loading" | "wizard" | "game-ai" | "game-multi";

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  // ═══════════════════════════════════════════════════════════════════════════
  // HOOKS — TOUJOURS EN PREMIER, JAMAIS DANS UN IF
  // ═══════════════════════════════════════════════════════════════════════════
  const [screen, setScreen] = useState<AppScreen>("loading");
  const [aiOptions, setAiOptions] = useState<AIGameOptions | null>(null);
  const socket = useSocket(); // ← TOUJOURS appelé, même si non utilisé

  // Extrait les valeurs du socket
  const {
    roomId,
    playerColor,
    isConnected,
    gameStarted,
    createRoom,
    joinRoom,
  } = socket;

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Quand gameStarted passe à true → passe en mode game-multi
  useEffect(() => {
    if (gameStarted && screen !== "game-multi") { 
      setTimeout(() => setScreen("game-multi"), 0);
    }
  }, [gameStarted, screen]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLBACKS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleLoadingFinish = useCallback(() => { 
    setScreen("wizard");
  }, []);

  const handleStartVsAI = useCallback((opts: AIGameOptions) => { 
    const finalColor =
      opts.playerColor === "random"
        ? Math.random() > 0.5
          ? "w"
          : "b"
        : opts.playerColor;

    setAiOptions({ ...opts, playerColor: finalColor });
    setScreen("game-ai");
  }, []);

  const handleBackToWizard = useCallback(() => { 
    setAiOptions(null);
    setScreen("wizard");
  }, []);

  const handleCreateRoom = useCallback(() => { 
    createRoom();
  }, [createRoom]);

  const handleJoinRoom = useCallback(
    (code: string) => { 
      joinRoom(code);
    },
    [joinRoom],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  console.log("🔍 AppContent render:", {
    screen,
    roomId,
    gameStarted,
    isConnected,
  });

  const renderContent = () => {
    if (screen === "loading") {
      return <LoadingScreen onFinish={handleLoadingFinish} />;
    }

    if (screen === "game-ai" && aiOptions) {
      return (
        <Board
          isAIMode={true}
          difficulty={aiOptions.difficulty}
          initialPlayerColor={aiOptions.playerColor as "w" | "b"}
          onBackToMenu={handleBackToWizard}
        />
      );
    }

    if (screen === "game-multi" && gameStarted) {
      return (
        <Board
          isAIMode={false}
          initialPlayerColor={playerColor ?? "w"}
          roomId={roomId ?? undefined}
          onBackToMenu={handleBackToWizard}
          socket={socket}
        />
      );
    }

    // Par défaut (wizard ou attente)
    return (
      <GameWizard
        onStartVsAI={handleStartVsAI}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={socket.leaveRoom}
        roomId={roomId}
        isConnected={isConnected}
        isWaiting={roomId !== null && !gameStarted}
        playerColor={playerColor}
      />
    );
  };

  return renderContent();
}
