import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import routes from './routes'
import { registerSocketHandlers } from './sockets'
import { startSimulator } from './simulator'
import { requestLogger } from './middleware/logger'
import { errorHandler } from './middleware/errorHandler'

const PORT = process.env.PORT ?? 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: CORS_ORIGIN },
})

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())
app.use(requestLogger)
app.use('/api', routes)
app.use(errorHandler)

const socketHandlers = registerSocketHandlers(io)

startSimulator(
  socketHandlers.onDeviceChange,
  socketHandlers.onUsageUpdate,
  socketHandlers.onAlertTriggered,
  socketHandlers.onAlertResolved,
)

httpServer.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`)
})
