import type { Device } from '../types'
import { fetchDevices } from '../services/backend'
import { humanize } from '../services/llm'

const ROOM_ORDER = ['drawing', 'work1', 'work2']

const ROOM_SHORT: Record<string, string> = {
  drawing: 'Drawing',
  work1: 'WR1',
  work2: 'WR2',
}

const DEVICE_ROWS = ['fan1', 'fan2', 'light1', 'light2', 'light3']

const COL_LABEL = 8
const COL_DATA = 9

const visualWidth = (s: string): number => {
  let w = 0
  for (const ch of s) {
    w += (ch === '⚪' || ch === '🟢') ? 2 : 1
  }
  return w
}

const padVis = (s: string, width: number): string => {
  const pad = width - visualWidth(s)
  return pad > 0 ? s + ' '.repeat(pad) : s
}

const sep = (n: number): string => '─'.repeat(n)

export const handleStatus = async (): Promise<string> => {
  const devices: Device[] = await fetchDevices()

  const total = devices.length
  const onDevices = devices.filter((d) => d.status === 'on')
  const onFans = onDevices.filter((d) => d.type === 'fan').length
  const onLights = onDevices.filter((d) => d.type === 'light').length

  const summary = `🏢 Office Status: ${onDevices.length} of ${total} devices ON (${onFans} fans, ${onLights} lights)`

  const byRoom: Record<string, Device[]> = {}
  for (const d of devices) {
    (byRoom[d.room] ??= []).push(d)
  }

  const rows: string[][] = []

  rows.push([padVis('', COL_LABEL), ...ROOM_ORDER.map((r) => padVis(ROOM_SHORT[r], COL_DATA))])
  rows.push([sep(COL_LABEL), ...ROOM_ORDER.map(() => sep(COL_DATA))])

  for (const rowLabel of DEVICE_ROWS) {
    const type = rowLabel.startsWith('fan') ? 'fan' : 'light'
    const idx = parseInt(rowLabel.replace(type, ''), 10) - 1
    const row: string[] = [padVis(rowLabel, COL_LABEL)]
    for (const room of ROOM_ORDER) {
      const roomDevices = byRoom[room] ?? []
      const typed = roomDevices.filter((d) => d.type === type)
      const cell = typed[idx]?.status === 'on' ? '🟢 ON' : '⚪ OFF'
      row.push(padVis(cell, COL_DATA))
    }
    rows.push(row)
  }

  const grid = '```\n' + rows.map((r) => r.join(' ')).join('\n') + '\n```'

  const raw = summary + '\n' + grid
  try {
    return await humanize(raw)
  } catch (err) {
    console.error('[status] humanize failed:', err)
    return raw
  }
}
