import type { Device } from '../models/device'
import { getAllDevices, flipDeviceStatus } from '../store/deviceStore'
import { recordSnapshot } from '../store/powerHistory'

const TICK_INTERVAL_MS = parseInt(process.env.SIM_TICK_INTERVAL_MS ?? '10000', 10)

let tickTimer: ReturnType<typeof setInterval> | null = null

export const startSimulator = (
  onDeviceChange?: (device: Device) => void,
  onUsageUpdate?: () => void,
): void => {
  if (tickTimer) return

  tickTimer = setInterval(() => {
    const devices = getAllDevices()
    const flipsCount = 1 + Math.floor(Math.random() * Math.min(3, devices.length))
    const indices = new Set<number>()

    while (indices.size < flipsCount) {
      indices.add(Math.floor(Math.random() * devices.length))
    }

    for (const idx of indices) {
      const updated = flipDeviceStatus(devices[idx].id)
      if (updated && onDeviceChange) onDeviceChange(updated)
    }

    recordSnapshot()
    if (onUsageUpdate) onUsageUpdate()
  }, TICK_INTERVAL_MS)

  console.log(`[simulator] tick engine started (interval=${TICK_INTERVAL_MS}ms)`)
}

export const stopSimulator = (): void => {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
    console.log('[simulator] tick engine stopped')
  }
}
