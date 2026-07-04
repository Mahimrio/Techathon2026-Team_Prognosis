import type { Device } from '../types'
import { fetchDevices } from '../services/backend'
import { humanize } from '../services/llm'

const ROOM_LABELS: Record<string, string> = {
  drawing: 'Drawing Room',
  work1: 'Work Room 1',
  work2: 'Work Room 2',
}

const groupByRoom = (devices: Device[]): Record<string, Device[]> => {
  const groups: Record<string, Device[]> = {}
  for (const d of devices) {
    ;(groups[d.room] ??= []).push(d)
  }
  return groups
}

const countByTypeAndStatus = (devices: Device[], type: string, status: string): number =>
  devices.filter((d) => d.type === type && d.status === status).length

const formatRoomLine = (room: string, devices: Device[]): string => {
  const label = ROOM_LABELS[room] ?? room
  const fansOn = countByTypeAndStatus(devices, 'fan', 'on')
  const lightsOn = countByTypeAndStatus(devices, 'light', 'on')

  if (fansOn === 0 && lightsOn === 0) return `${label}: all off.`

  const parts: string[] = []
  if (fansOn > 0) parts.push(`${fansOn} fan${fansOn > 1 ? 's' : ''} ON`)
  if (lightsOn > 0) parts.push(`${lightsOn} light${lightsOn > 1 ? 's' : ''} ON`)
  return `${label}: ${parts.join(', ')}.`
}

export const handleStatus = async (): Promise<string> => {
  const devices: Device[] = await fetchDevices()
  const byRoom = groupByRoom(devices)
  const lines = Object.keys(byRoom).map((room) => formatRoomLine(room, byRoom[room]))
  return await humanize(lines.join(' '))
}
