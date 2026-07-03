import { Router } from 'express'

const router = Router()

// TODO: GET /api/devices, GET /api/rooms/:room, GET /api/usage, GET /api/alerts
router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export default router
