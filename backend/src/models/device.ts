export type DeviceType = 'fan' | 'light'
export type DeviceStatus = 'on' | 'off'
export type RoomName = 'drawing' | 'work1' | 'work2'

export interface Device {
  id: string
  name: string
  type: DeviceType
  room: RoomName
  status: DeviceStatus
  powerDrawWatts: number
  lastChanged: string
}

export const WATTAGES: Record<DeviceType, number> = {
  fan: 60,
  light: 15,
}

export const computePowerDraw = (type: DeviceType, status: DeviceStatus): number =>
  status === 'on' ? WATTAGES[type] : 0
