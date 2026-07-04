import { Server as SocketIOServer } from 'socket.io'
import { getAllDevices, getTotalPowerNow, getRoomPower } from '../store/deviceStore'
import { getEstimatedKWhToday } from '../store/powerHistory'
import type { Device } from '../models/device'
import type { Alert } from '../alerts/types'

export const registerSocketHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log(`[sockets] client connected: ${socket.id}`)
  })

  return {
    onDeviceChange: (device: Device) => {
      io.emit('deviceUpdate', device)
    },
    onUsageUpdate: () => {
      io.emit('usageUpdate', {
        totalPowerNow: getTotalPowerNow(),
        roomPower: {
          drawing: getRoomPower('drawing'),
          work1: getRoomPower('work1'),
          work2: getRoomPower('work2'),
        },
        estimatedKWhToday: getEstimatedKWhToday(),
      })
    },
    onAlertTriggered: (alert: Alert) => {
      io.emit('alertTriggered', alert)
    },
    onAlertResolved: (alert: Alert) => {
      io.emit('alertResolved', alert)
    },
  }
}
