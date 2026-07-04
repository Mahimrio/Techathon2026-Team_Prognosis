export type DeviceStatus = 'on' | 'off'
export type DeviceType = 'fan' | 'light'
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

export interface UsageData {
  totalPowerNow: number
  roomPower: Record<RoomName, number>
  estimatedKWhToday: number
}
