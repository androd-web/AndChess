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
  createRoom: () => void;
  joinRoom: (id: string) => void;
  sendMove: (payload: MovePayload) => void;
  resign: () => void;
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

  useEffect(() => {
    // FIX 2 & 3 : suppression de `socket = socket` (auto-affectation sur const).
    // On stocke directement dans socketRef.current.
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("room_created", ({ roomId, color }: { roomId: string; color: "w" | "b" }) => {
      setRoomId(roomId);
      setPlayerColor(color);
    });

    socket.on("room_joined", ({ color, roomId: rId }: { color: "w" | "b", roomId?: string }) => {
      setPlayerColor(color);
      if (rId) setRoomId(rId);
    });
    socket.on("game_start", ({ roomId: rId }: { roomId: string }) => {
      setGameStarted(true);
      if (rId) setRoomId(rId);
    });
    socket.on("move_made", (data: MoveReceived) => setLastMoveNet(data));
    socket.on("player_disconnected", () => setOpponentLeft(true));
    socket.on("game_over", (data: { reason: string; winner: string }) => setGameOver(data));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // FIX 4 : les useCallback utilisent socketRef.current au lieu de `socket`
  // (qui n'existe pas dans leur portée). socketRef est stable entre les rendus,
  // donc pas besoin de l'ajouter aux dépendances.
  const createRoom = useCallback(() => {
    socketRef.current?.emit("create_room");
  }, []);

  const joinRoom = useCallback((id: string) => {
    setRoomId(id);
    socketRef.current?.emit("join_room", { roomId: id });
  }, []);

  const sendMove = useCallback((payload: MovePayload) => {
    socketRef.current?.emit("make_move", payload);
  }, []);

  const resign = useCallback(() => {
    socketRef.current?.emit("player_resigned", { roomId });
  }, [roomId]);

  return {
    roomId,
    playerColor,
    isConnected,
    gameStarted,
    opponentLeft,
    lastMove,
    gameOver,
    createRoom,
    joinRoom,
    sendMove,
    resign,
  };
}
