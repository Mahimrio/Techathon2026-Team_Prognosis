import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import routes from './routes'
import { registerSocketHandlers } from './sockets'

const PORT = process.env.PORT ?? 3001

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
})

app.use(cors())
app.use(express.json())
app.use('/api', routes)

registerSocketHandlers(io)

httpServer.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`)
})
