import { ROOMS } from '../models/roomFixture'
import {
  type Device,
  type DeviceType,
  type RoomName,
  computePowerDraw,
} from '../models/device'
import { getClock } from '../lib/clock'

let devices: Device[] = []

const seed = (): void => {
  const now = getClock()
  let idCounter = 1

  for (const room of ROOMS) {
    for (const { type, count } of room.devices) {
      for (let i = 0; i < count; i++) {
        const status = Math.random() < 0.4 ? 'on' : 'off'
        const offsetMs = Math.random() * 4 * 3_600_000
        const lastChanged = new Date(now().getTime() - offsetMs)

        devices.push({
          id: `dev-${String(idCounter).padStart(2, '0')}`,
          name: `${room.label} ${type === 'fan' ? 'Fan' : 'Light'} ${i + 1}`,
          type: type as DeviceType,
          room: room.name as RoomName,
          status: status as 'on' | 'off',
          powerDrawWatts: computePowerDraw(type as DeviceType, status as 'on' | 'off'),
          lastChanged: lastChanged.toISOString(),
        })
        idCounter++
      }
    }
  }
}

seed()

export const getAllDevices = (): Device[] =>
  devices.map((d) => ({ ...d }))

export const getDevicesByRoom = (room: string): Device[] =>
  devices.filter((d) => d.room === room).map((d) => ({ ...d }))

export const getTotalPowerNow = (): number =>
  devices.reduce((sum, d) => sum + d.powerDrawWatts, 0)

export const getRoomPower = (room: string): number =>
  devices.filter((d) => d.room === room).reduce((sum, d) => sum + d.powerDrawWatts, 0)

export const flipDeviceStatus = (deviceId: string): Device | null => {
  const device = devices.find((d) => d.id === deviceId)
  if (!device) return null

  device.status = device.status === 'on' ? 'off' : 'on'
  device.powerDrawWatts = computePowerDraw(device.type, device.status)
  device.lastChanged = getClock()().toISOString()

  return { ...device }
}

export const resetAndReseed = (): void => {
  devices = []
  seed()
}
