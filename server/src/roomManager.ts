 import { Chess } from 'chess.js'
import { v4 as uuidv4 } from 'uuid'
import { applyMove } from './gameLogic'
import type { MoveInput, MoveResult } from './gameLogic'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Player {
  socketId: string
  color:    'w' | 'b'
}

export interface Room {
  id:        string
  players:   Player[]
  game:      Chess
  createdAt: Date
  isStarted: boolean
  isOver:    boolean
}

export interface JoinResult {
  success: boolean
  error?:  string
  fen?:    string
  color?:  'w' | 'b'
}

// ── RoomManager ────────────────────────────────────────────────────────────

export class RoomManager {
  private rooms = new Map<string, Room>()

  // ── Créer une salle ──────────────────────────────────────────────────────
  createRoom(socketId: string): Room {
    const room: Room = {
      id:        uuidv4(),
      players:   [{ socketId, color: 'w' }],  // Joueur 1 = blancs
      game:      new Chess(),
      createdAt: new Date(),
      isStarted: false,
      isOver:    false,
    }
    this.rooms.set(room.id, room)
    console.log(`[Room] Créée : ${room.id} par ${socketId}`)
    return room
  }

  // ── Rejoindre une salle ──────────────────────────────────────────────────
  joinRoom(roomId: string, socketId: string): JoinResult {
    const room = this.rooms.get(roomId)

    if (!room) {
      return { success: false, error: 'Salle introuvable' }
    }

    if (room.players.length >= 2) {
      return { success: false, error: 'Salle complète — 2 joueurs déjà connectés' }
    }

    if (room.isOver) {
      return { success: false, error: 'Cette partie est terminée' }
    }

    // Joueur 2 = noirs
    room.players.push({ socketId, color: 'b' })
    room.isStarted = true

    console.log(`[Room] ${socketId} a rejoint la salle ${roomId}`)

    return {
      success: true,
      fen:     room.game.fen(),
      color:   'b',
    }
  }

  // ── Appliquer un coup ────────────────────────────────────────────────────
  applyMove(roomId: string, socketId: string, move: MoveInput): MoveResult {
    const room = this.rooms.get(roomId)

    // Salle introuvable
    if (!room) {
      return { success: false, error: 'Salle introuvable' }
    }

    // Partie pas encore commencée
    if (!room.isStarted) {
      return { success: false, error: 'La partie n\'a pas encore commencé' }
    }

    // Partie déjà terminée
    if (room.isOver) {
      return { success: false, error: 'La partie est terminée' }
    }

    // Vérifie que c'est bien ce joueur qui doit jouer
    const player = room.players.find(p => p.socketId === socketId)
    if (!player) {
      return { success: false, error: 'Joueur non reconnu dans cette salle' }
    }

    // Vérifie que c'est son tour
    const currentTurn = room.game.turn() // 'w' ou 'b'
    if (player.color !== currentTurn) {
      return { success: false, error: 'Ce n\'est pas ton tour' }
    }

    // ✅ Délègue la validation à gameLogic.ts
    const result = applyMove(room.game, move)

    if (!result.success) {
      return result // Coup illégal — gameLogic a déjà mis l'erreur
    }

    // Marque la partie comme terminée si nécessaire
    if (result.isGameOver) {
      room.isOver = true
      console.log(`[Room] Partie ${roomId} terminée — raison: ${result.reason}`)
    }

    return result
  }

  // ── Abandon ──────────────────────────────────────────────────────────────
  resignPlayer(roomId: string, socketId: string): MoveResult {
    const room = this.rooms.get(roomId)
    if (!room) return { success: false, error: 'Salle introuvable' }

    const player = room.players.find(p => p.socketId === socketId)
    if (!player) return { success: false, error: 'Joueur non reconnu' }

    room.isOver = true

    const winner = player.color === 'w' ? 'black' : 'white'
    console.log(`[Room] ${socketId} a abandonné dans la salle ${roomId}`)

    return {
      success:    true,
      isGameOver: true,
      winner,
      reason:     'resign',
    }
  }

  // ── Utilitaires ──────────────────────────────────────────────────────────

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  // Trouve la salle d'un joueur par son socketId
  getRoomByPlayer(socketId: string): string | null {
    for (const [id, room] of this.rooms) {
      if (room.players.some(p => p.socketId === socketId)) {
        return id
      }
    }
    return null
  }

  // Récupère la couleur d'un joueur dans une salle
  getPlayerColor(roomId: string, socketId: string): 'w' | 'b' | null {
    const room = this.rooms.get(roomId)
    if (!room) return null
    return room.players.find(p => p.socketId === socketId)?.color ?? null
  }

  // Supprime un joueur déconnecté de sa salle
  removePlayer(socketId: string): { roomId: string; room: Room } | null {
    for (const [id, room] of this.rooms) {
      const idx = room.players.findIndex(p => p.socketId === socketId)
      if (idx !== -1) {
        room.players.splice(idx, 1)
        room.isStarted = false
        console.log(`[Room] ${socketId} retiré de la salle ${id}`)
        return { roomId: id, room }
      }
    }
    return null
  }

  // Supprime une salle
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId)
    console.log(`[Room] Salle ${roomId} supprimée`)
  }

  // Nettoyage des vieilles salles (> 2h)
  cleanOldRooms(): void {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    for (const [id, room] of this.rooms) {
      if (room.createdAt.getTime() < twoHoursAgo) {
        this.rooms.delete(id)
        console.log(`[Room] Salle ${id} supprimée (expirée)`)
      }
    }
  }

  // Stats pour debug
  getRoomCount(): number {
    return this.rooms.size
  }
}
