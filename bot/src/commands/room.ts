import { fetchRoom } from '../services/backend'
import { humanize } from '../services/llm'

const ROOM_LABELS: Record<string, string> = {
  drawing: 'Drawing Room',
  work1: 'Work Room 1',
  work2: 'Work Room 2',
}

export const handleRoom = async (roomName: string): Promise<string> => {
  try {
    const data = await fetchRoom(roomName)

    const fansOn = data.devices.filter(
      (d: any) => d.type === 'fan' && d.status === 'on',
    ).length
    const lightsOn = data.devices.filter(
      (d: any) => d.type === 'light' && d.status === 'on',
    ).length
    const totalOn = fansOn + lightsOn
    const total = data.devices.length
    const label = ROOM_LABELS[data.room] ?? data.room

    let text: string
    if (totalOn === 0) {
      text = `${label}: all ${total} devices off.`
    } else {
      const parts: string[] = []
      if (fansOn > 0) parts.push(`${fansOn} fan${fansOn > 1 ? 's' : ''} ON`)
      if (lightsOn > 0) parts.push(`${lightsOn} light${lightsOn > 1 ? 's' : ''} ON`)
      text = `${label}: ${parts.join(', ')}. Total: ${data.totalPower}W.`
    }

    return await humanize(text)
  } catch (err) {
    return `❌ ${(err as Error).message}`
  }
}
