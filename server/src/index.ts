import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { RoomManager } from './roomManager'

const app        = express()
const httpServer = createServer(app)
const io         = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

const rooms = new RoomManager()

app.use(cors())
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
    io.to(roomId).emit('game_over', { reason: 'resign', winner: 'opponent' })
    rooms.deleteRoom(roomId)
  })

  // Déconnexion
  socket.on('disconnect', () => {
    const roomId = rooms.getRoomByPlayer(socket.id)
    if (roomId) io.to(roomId).emit('player_disconnected')
  })
})

httpServer.listen(3001, () => console.log('Serveur sur le port 3001'))