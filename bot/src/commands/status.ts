import type { Device } from '../types'
import { fetchDevices } from '../services/backend'
import { humanize } from '../services/llm'

const ROOM_LABELS: Record<string, string> = {
  drawing: 'Drawing Room',
  work1: 'Work Room 1',
  work2: 'Work Room 2',
}

const ROOM_SHORT: Record<string, string> = {
  drawing: 'Drawing',
  work1: 'Work 1',
  work2: 'Work 2',
}

const ROOM_ORDER = ['drawing', 'work1', 'work2']

const EMOJI_SET = new Set(['⚪', '🟢'])

const visualWidth = (s: string): number => {
  let w = 0
  for (const ch of s) {
    w += EMOJI_SET.has(ch) ? 2 : 1
  }
  return w
}

const padVis = (s: string, width: number): string => {
  const pad = width - visualWidth(s)
  return pad > 0 ? s + ' '.repeat(pad) : s
}

const COL_LABEL = 8
const COL_DATA = 9

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

const buildGrid = (byRoom: Record<string, Device[]>): string[][] => {
  const rows: string[][] = []

  rows.push([
    padVis('Room', COL_LABEL),
    padVis('Drawing', COL_DATA),
    padVis('Work 1', COL_DATA),
    padVis('Work 2', COL_DATA),
  ])

  const sep = (n: number) => '─'.repeat(n)
  rows.push([sep(COL_LABEL), sep(COL_DATA), sep(COL_DATA), sep(COL_DATA)])

  const fanRow: string[] = [padVis('Fan', COL_LABEL)]
  for (const room of ROOM_ORDER) {
    const roomDevices = byRoom[room] ?? []
    const fans = roomDevices.filter((d) => d.type === 'fan').sort((a, b) => a.id.localeCompare(b.id))
    fanRow.push(padVis(fans.map((d) => (d.status === 'on' ? '🟢' : '⚪')).join(''), COL_DATA))
  }
  rows.push(fanRow)

  const lightRow: string[] = [padVis('Light', COL_LABEL)]
  for (const room of ROOM_ORDER) {
    const roomDevices = byRoom[room] ?? []
    const lights = roomDevices.filter((d) => d.type === 'light').sort((a, b) => a.id.localeCompare(b.id))
    lightRow.push(padVis(lights.map((d) => (d.status === 'on' ? '🟢' : '⚪')).join(''), COL_DATA))
  }
  rows.push(lightRow)

  return rows
}

export const handleStatus = async (): Promise<string> => {
  const devices: Device[] = await fetchDevices()
  const byRoom = groupByRoom(devices)

  const lines = ROOM_ORDER.map((room) => formatRoomLine(room, byRoom[room] ?? []))
  const grid = buildGrid(byRoom)
  const gridStr = '```\n' + grid.map((row) => row.join(' ')).join('\n') + '\n```'

  return await humanize(lines.join(' ') + ' ' + gridStr)
}
