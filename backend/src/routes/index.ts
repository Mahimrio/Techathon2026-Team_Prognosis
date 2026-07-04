import { Router } from 'express'
import { ROOMS } from '../models/roomFixture'
import { getAllDevices, getDevicesByRoom, getTotalPowerNow, getRoomPower } from '../store/deviceStore'
import { getEstimatedKWhToday } from '../store/powerHistory'
import { getCurrentAlerts } from '../simulator'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.get('/devices', (_req, res) => {
  res.json(getAllDevices())
})

router.get('/rooms/:room', (req, res) => {
  const { room } = req.params
  const valid = ROOMS.some((r) => r.name === room)
  if (!valid) {
    res.status(404).json({ error: `Unknown room: "${room}". Valid rooms: ${ROOMS.map((r) => r.name).join(', ')}` })
    return
  }
  res.json({
    room,
    devices: getDevicesByRoom(room),
    totalPower: getRoomPower(room),
  })
})

router.get('/usage', (_req, res) => {
  const roomPower: Record<string, number> = {}
  for (const room of ROOMS) {
    roomPower[room.name] = getRoomPower(room.name)
  }
  res.json({
    totalPowerNow: getTotalPowerNow(),
    roomPower,
    estimatedKWhToday: getEstimatedKWhToday(),
  })
})

router.get('/alerts', (_req, res) => {
  res.json(getCurrentAlerts())
})

export default router
