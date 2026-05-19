import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { Chess } from 'chess.js'
import { RoomManager } from './roomManager'

const app        = express()
const httpServer = createServer(app)

const allowedOrigin = process.env.FRONTEND_URL || '*'

const io         = new Server(httpServer, {
  cors: { 
    origin: allowedOrigin, 
    methods: ['GET', 'POST'],
    credentials: true
  }
})

const rooms = new RoomManager()

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}))
app.use(express.json())

// Route REST — vérifie si une salle existe
app.get('/room/:id', (req, res) => {
  const room = rooms.getRoom(req.params.id)
  res.json({ exists: !!room, isFull: room?.players.length === 2 })
})

io.on('connection', (socket) => {
  console.log(`[+] Connexion : ${socket.id}`)

  // Joueur 1 crée une salle
  socket.on('create_room', () => {
    const room = rooms.createRoom(socket.id)
    socket.join(room.id)
    socket.emit('room_created', { roomId: room.id, color: 'w' })
  })

  // Joueur 2 rejoint une salle
  socket.on('join_room', ({ roomId }: { roomId: string }) => {
    const result = rooms.joinRoom(roomId, socket.id)
    if (!result.success) {
      socket.emit('error', { message: result.error })
      return
    }
    socket.join(roomId)
    socket.emit('room_joined', { color: 'b', fen: result.fen, roomId })
    io.to(roomId).emit('game_start', { roomId })
  })

  // Un joueur envoie un coup
  socket.on('make_move', ({ roomId, from, to, promotion }) => {
    const result = rooms.applyMove(roomId, socket.id, { from, to, promotion })
    if (!result.success) {
      socket.emit('invalid_move', { message: result.error })
      return
    }
    io.to(roomId).emit('move_made', {
      from, to, fen: result.fen, history: result.history
    })
    if (result.isGameOver) {
      io.to(roomId).emit('game_over', { reason: result.reason, winner: result.winner })
    }
  })

  // Abandon
  socket.on('player_resigned', ({ roomId }) => {
    const result = rooms.resignPlayer(roomId, socket.id)
    if (result.success) {
      io.to(roomId).emit('game_over', { reason: result.reason, winner: result.winner })
    }
  })

  // Demande de revanche
  socket.on('rematch_request', ({ roomId }) => {
    socket.to(roomId).emit('rematch_requested', { from: socket.id })
  })

  // Acceptation de revanche
  socket.on('rematch_accept', ({ roomId }) => {
    const room = rooms.getRoom(roomId)
    if (room) {
      room.game = new Chess()
      room.isOver = false
      // On peut inverser les couleurs pour la revanche si on veut, 
      // mais restons simple : on reset juste le board.
      io.to(roomId).emit('rematch_started', { fen: room.game.fen() })
    }
  })

  // Refus de revanche
  socket.on('rematch_decline', ({ roomId }) => {
    io.to(roomId).emit('rematch_declined')
    rooms.deleteRoom(roomId)
  })

  // Quitter la salle (retour au menu)
  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId)
    socket.to(roomId).emit('player_disconnected')
    rooms.deleteRoom(roomId)
  })

  // Déconnexion
  socket.on('disconnect', () => {
    const roomId = rooms.getRoomByPlayer(socket.id)
    if (roomId) {
      io.to(roomId).emit('player_disconnected')
      rooms.removePlayer(socket.id)
      
      // Si la salle est vide, on la supprime
      const room = rooms.getRoom(roomId)
      if (!room || room.players.length === 0) {
        rooms.deleteRoom(roomId)
      }
    }
    console.log(`[-] Déconnexion : ${socket.id}`)
  })
})

// Nettoyage automatique toutes les heures
setInterval(() => {
  rooms.cleanOldRooms()
}, 60 * 60 * 1000)

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => console.log(`Serveur sur le port ${PORT}`))