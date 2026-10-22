import { Server } from 'socket.io'
import JWT from 'jsonwebtoken'
import { parseCookie } from 'cookie'
import config from '../config/config.js'

function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.FRONTEND_URL,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const cookies = parseCookie(socket.handshake.headers.cookie || '')
    const token = cookies.token
    if (!token) return next(new Error('Authentication error: Token not found'))

    try {
      const decoded = JWT.verify(token, config.JWT_SECRET)
      const userId = decoded.id || decoded.userid
      if (!userId) return next(new Error('Authentication error: User id not found'))
      socket.data.userId = String(userId)
      next()
    } catch {
      next(new Error('Authentication error: Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId
    socket.join(userId)

    const relayTrack = (eventName) => ({ musicId, position } = {}) => {
      if (typeof musicId !== 'string' || !musicId) return
      const event = { musicId }
      if (typeof position === 'number' && Number.isFinite(position)) event.position = position
      socket.to(userId).emit(eventName, event)
    }

    socket.on('play', relayTrack('play'))
    socket.on('change-song', relayTrack('change-song'))
    socket.on('pause', ({ musicId, position } = {}) => {
      if (typeof musicId !== 'string' || !musicId || typeof position !== 'number' || !Number.isFinite(position)) return
      socket.to(userId).emit('pause', { musicId, position })
    })
  })

  return io
}

export default initializeSocketServer
