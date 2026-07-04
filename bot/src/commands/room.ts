import { fetchRoom } from '../services/backend'
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

export const handleRoom = async (roomName: string): Promise<string> => {
  try {
    const data = await fetchRoom(roomName)
    const label = ROOM_LABELS[data.room] ?? data.room
    const shortLabel = ROOM_SHORT[data.room] ?? data.room

    const fansOn = data.devices.filter(
      (d: any) => d.type === 'fan' && d.status === 'on',
    ).length
    const lightsOn = data.devices.filter(
      (d: any) => d.type === 'light' && d.status === 'on',
    ).length
    const totalOn = fansOn + lightsOn

    const fans = data.devices
      .filter((d: any) => d.type === 'fan')
      .sort((a: any, b: any) => a.id.localeCompare(b.id))
    const lights = data.devices
      .filter((d: any) => d.type === 'light')
      .sort((a: any, b: any) => a.id.localeCompare(b.id))

    const rows: string[][] = []
    rows.push([padVis('Type', COL_LABEL), padVis(shortLabel, COL_DATA)])
    rows.push([padVis('─'.repeat(COL_LABEL), COL_LABEL), padVis('─'.repeat(COL_DATA), COL_DATA)])
    rows.push([padVis('Fan', COL_LABEL), padVis(fans.map((d: any) => (d.status === 'on' ? '🟢' : '⚪')).join(''), COL_DATA)])
    rows.push([padVis('Light', COL_LABEL), padVis(lights.map((d: any) => (d.status === 'on' ? '🟢' : '⚪')).join(''), COL_DATA)])

    const gridStr = '```\n' + rows.map((r) => r.join(' ')).join('\n') + '\n```'

    let summary: string
    if (totalOn === 0) {
      summary = `${label}: all ${data.devices.length} devices off.`
    } else {
      const parts: string[] = []
      if (fansOn > 0) parts.push(`${fansOn} fan${fansOn > 1 ? 's' : ''} ON`)
      if (lightsOn > 0) parts.push(`${lightsOn} light${lightsOn > 1 ? 's' : ''} ON`)
      summary = `${label}: ${parts.join(', ')}. Total: ${data.totalPower}W.`
    }

    return await humanize(summary + ' ' + gridStr)
  } catch (err) {
    return `❌ ${(err as Error).message}`
  }
}
