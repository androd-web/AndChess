 import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { Square } from "chess.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

interface MovePayload {
  from: Square;
  to: Square;
  promotion?: string;
  roomId: string;
}

interface MoveReceived {
  from: Square;
  to: Square;
  fen: string;
  history: string[];
}

export interface UseSocketReturn {
  roomId: string | null;
  playerColor: "w" | "b" | null;
  isConnected: boolean;
  gameStarted: boolean;
  opponentLeft: boolean;
  lastMove: MoveReceived | null;
  gameOver: { reason: string; winner: string } | null;
  rematchRequested: boolean;
  rematchStarted: { fen: string } | null;
  rematchDeclined: boolean;
  createRoom: () => void;
  joinRoom: (id: string) => void;
  sendMove: (payload: MovePayload) => void;
  resign: () => void;
  requestRematch: () => void;
  acceptRematch: () => void;
  declineRematch: () => void;
  leaveRoom: () => void;
}

export function useSocket(): UseSocketReturn {
  // FIX 1 : socketRef est maintenant réellement utilisé pour stocker le socket
  // et le rendre accessible dans les useCallback hors du useEffect.
  const socketRef = useRef<Socket | null>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<"w" | "b" | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [lastMove, setLastMoveNet] = useState<MoveReceived | null>(null);
  const [gameOver, setGameOver] = useState<{ reason: string; winner: string } | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchStarted, setRematchStarted] = useState<{ fen: string } | null>(null);
  const [rematchDeclined, setRematchDeclined] = useState(false);

  // Helper pour réinitialiser tout l'état lié à une partie
  const resetSocketState = useCallback(() => {
    setGameStarted(false);
    setOpponentLeft(false);
    setLastMoveNet(null);
    setGameOver(null);
    setRematchRequested(false);
    setRematchStarted(null);
    setRematchDeclined(false);
  }, []);

  useEffect(() => {
    // FIX 2 & 3 : suppression de `socket = socket` (auto-affectation sur const).
    // On stocke directement dans socketRef.current.
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("room_created", ({ roomId, color }: { roomId: string; color: "w" | "b" }) => {
      resetSocketState();
      setRoomId(roomId);
      setPlayerColor(color);
    });

    socket.on("room_joined", ({ color, roomId: rId }: { color: "w" | "b", roomId?: string }) => {
      resetSocketState();
      setPlayerColor(color);
      if (rId) setRoomId(rId);
    });
    socket.on("game_start", ({ roomId: rId }: { roomId: string }) => {
      setGameStarted(true);
      if (rId) setRoomId(rId);
      setGameOver(null);
    });
    socket.on("move_made", (data: MoveReceived) => setLastMoveNet(data));
    socket.on("player_disconnected", () => setOpponentLeft(true));
    socket.on("game_over", (data: { reason: string; winner: string }) => setGameOver(data));

    socket.on("rematch_requested", () => setRematchRequested(true));
    socket.on("rematch_started", (data) => {
      setRematchStarted(data);
      setGameOver(null);
      setRematchRequested(false);
      setRematchDeclined(false);
    });
    socket.on("rematch_declined", () => {
      setRematchRequested(false);
      setRematchDeclined(true);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [resetSocketState]);

  // FIX 4 : les useCallback utilisent socketRef.current au lieu de `socket`
  // (qui n'existe pas dans leur portée). socketRef est stable entre les rendus,
  // donc pas besoin de l'ajouter aux dépendances.
  const createRoom = useCallback(() => {
    socketRef.current?.emit("create_room");
  }, []);

  const joinRoom = useCallback((id: string) => {
    resetSocketState();
    setRoomId(id);
    socketRef.current?.emit("join_room", { roomId: id });
  }, [resetSocketState]);

  const sendMove = useCallback((payload: MovePayload) => {
    socketRef.current?.emit("make_move", payload);
  }, []);

  const resign = useCallback(() => {
    socketRef.current?.emit("player_resigned", { roomId });
  }, [roomId]);

  const requestRematch = useCallback(() => {
    setRematchDeclined(false);
    socketRef.current?.emit("rematch_request", { roomId });
  }, [roomId]);

  const acceptRematch = useCallback(() => {
    socketRef.current?.emit("rematch_accept", { roomId });
  }, [roomId]);

  const declineRematch = useCallback(() => {
    setRematchRequested(false);
    socketRef.current?.emit("rematch_decline", { roomId });
  }, [roomId]);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit("leave_room", { roomId });
    setRoomId(null);
    resetSocketState();
  }, [roomId, resetSocketState]);

  return {
    roomId,
    playerColor,
    isConnected,
    gameStarted,
    opponentLeft,
    lastMove,
    gameOver,
    rematchRequested,
    rematchStarted,
    rematchDeclined,
    createRoom,
    joinRoom,
    sendMove,
    resign,
    requestRematch,
    acceptRematch,
    declineRematch,
    leaveRoom,
  };
}
