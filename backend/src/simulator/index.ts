import type { Device } from '../models/device'
import { getAllDevices, flipDeviceStatus } from '../store/deviceStore'
import { recordSnapshot } from '../store/powerHistory'
import { evaluateAlerts } from '../alerts'
import type { Alert } from '../alerts/types'
import { getClock } from '../lib/clock'

const TICK_INTERVAL_MS = parseInt(process.env.SIM_TICK_INTERVAL_MS ?? '10000', 10)

let tickTimer: ReturnType<typeof setInterval> | null = null
let currentAlerts: Alert[] = []

export const startSimulator = (
  onDeviceChange?: (device: Device) => void,
  onUsageUpdate?: () => void,
  onAlertTriggered?: (alert: Alert) => void,
  onAlertResolved?: (alert: Alert) => void,
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

    const { activeAlerts, newlyTriggered, newlyResolved } = evaluateAlerts({
      devices: getAllDevices(),
      previousAlerts: currentAlerts,
      now: getClock()(),
    })

    currentAlerts = activeAlerts

    for (const alert of newlyTriggered) {
      if (onAlertTriggered) onAlertTriggered(alert)
    }
    for (const alert of newlyResolved) {
      if (onAlertResolved) onAlertResolved(alert)
    }
  }, TICK_INTERVAL_MS)

  console.log(`[simulator] tick engine started (interval=${TICK_INTERVAL_MS}ms)`)
}

export const stopSimulator = (): void => {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
    currentAlerts = []
    console.log('[simulator] tick engine stopped')
  }
}
