import { fetchRoom } from '../services/backend'
import { humanize } from '../services/llm'

const ROOM_LABELS: Record<string, string> = {
  drawing: 'Drawing Room',
  work1: 'Work Room 1',
  work2: 'Work Room 2',
}

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

export const handleRoom = async (roomName: string): Promise<string> => {
  try {
    const data = await fetchRoom(roomName)
    const label = ROOM_LABELS[data.room] ?? data.room
    const shortLabel = ROOM_SHORT[data.room] ?? data.room

    const devices = [...data.devices].sort((a: any, b: any) =>
      a.id.localeCompare(b.id),
    )

    const onDevices = devices.filter((d: any) => d.status === 'on')
    const onFans = onDevices.filter((d: any) => d.type === 'fan').length
    const onLights = onDevices.filter((d: any) => d.type === 'light').length
    const totalOn = onDevices.length

    const summary = `🏢 ${label}: ${totalOn} of ${devices.length} devices ON (${onFans} fans, ${onLights} lights) — ${data.totalPower}W`

    const rows: string[][] = []

    rows.push([padVis('', COL_LABEL), padVis(shortLabel, COL_DATA)])
    rows.push([sep(COL_LABEL), sep(COL_DATA)])

    for (const rowLabel of DEVICE_ROWS) {
      const type = rowLabel.startsWith('fan') ? 'fan' : 'light'
      const idx = parseInt(rowLabel.replace(type, ''), 10) - 1
      const typed = devices.filter((d: any) => d.type === type)
      const cell = typed[idx]?.status === 'on' ? '🟢 ON' : '⚪ OFF'
      rows.push([padVis(rowLabel, COL_LABEL), padVis(cell, COL_DATA)])
    }

    const grid = '```\n' + rows.map((r) => r.join(' ')).join('\n') + '\n```'

    return await humanize(summary + '\n' + grid)
  } catch (err) {
    return `❌ ${(err as Error).message}`
  }
}
