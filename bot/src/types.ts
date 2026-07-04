export interface Device {
  id: string
  name: string
  type: 'fan' | 'light'
  room: string
  status: 'on' | 'off'
  powerDrawWatts: number
  lastChanged: string
}

export interface RoomResponse {
  room: string
  devices: Device[]
  totalPower: number
}

export interface UsageResponse {
  totalPowerNow: number
  roomPower: Record<string, number>
  estimatedKWhToday: number
}

export interface Alert {
  id: string
  type: 'after-hours' | 'prolonged-room-usage'
  message: string
  room: string
  deviceIds: string[]
  triggeredAt: string
  resolvedAt: string | null
}
