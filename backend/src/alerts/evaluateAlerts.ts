import type { Device } from '../models/device'
import { ROOMS } from '../models/roomFixture'
import type { Alert, EvaluateAlertsInput, EvaluateAlertsOutput } from './types'

/* ------------------------------------------------------------------ */
/*  Office-hours helpers (Bangladesh Standard Time, UTC+6)            */
/*  Thresholds configurable via env vars for testing.                  */
/* ------------------------------------------------------------------ */

const BDT_OFFSET_MS = 6 * 60 * 60 * 1000
const OFFICE_START = parseInt(process.env.ALERT_OFFICE_START ?? '9', 10)
const OFFICE_END = parseInt(process.env.ALERT_OFFICE_END ?? '17', 10)

const isWithinOfficeHours = (date: Date): boolean => {
  const bdtHour = new Date(date.getTime() + BDT_OFFSET_MS).getUTCHours()
  return bdtHour >= OFFICE_START && bdtHour < OFFICE_END
}

/* ------------------------------------------------------------------ */
/*  Room-label resolver                                               */
/* ------------------------------------------------------------------ */

const getRoomLabel = (roomName: string): string =>
  ROOMS.find((r) => r.name === roomName)?.label ?? roomName

/* ------------------------------------------------------------------ */
/*  Device grouping helper                                            */
/* ------------------------------------------------------------------ */

const groupByRoom = (devices: Device[]): Map<string, Device[]> => {
  const groups = new Map<string, Device[]>()
  for (const d of devices) {
    const list = groups.get(d.room) ?? []
    list.push(d)
    groups.set(d.room, list)
  }
  return groups
}

/* ------------------------------------------------------------------ */
/*  Per-condition evaluators                                          */
/* ------------------------------------------------------------------ */

const evaluateAfterHours = (devices: Device[], now: Date): Alert[] => {
  if (isWithinOfficeHours(now)) return []

  const alerts: Alert[] = []
  const onDevices = devices.filter((d) => d.status === 'on')
  const byRoom = groupByRoom(onDevices)

  for (const [room, roomDevices] of byRoom) {
    alerts.push({
      id: `after-hours-${room}`,
      type: 'after-hours',
      message: `${getRoomLabel(room)}: ${roomDevices.length} device(s) are ON outside office hours (${String(OFFICE_START).padStart(2, '0')}:00-${String(OFFICE_END).padStart(2, '0')}:00 BDT)`,
      room,
      deviceIds: roomDevices.map((d) => d.id),
      triggeredAt: now.toISOString(),
      resolvedAt: null,
    })
  }

  return alerts
}

const evaluateProlongedUsage = (devices: Device[], now: Date): Alert[] => {
  const prolongedHours = parseFloat(process.env.ALERT_PROLONGED_HOURS ?? '2')
  const twoHoursAgo = now.getTime() - prolongedHours * 60 * 60 * 1000
  const alerts: Alert[] = []
  const byRoom = groupByRoom(devices)

  for (const [room, roomDevices] of byRoom) {
    const allOn = roomDevices.every((d) => d.status === 'on')
    const allOnLongEnough = roomDevices.every(
      (d) => new Date(d.lastChanged).getTime() <= twoHoursAgo,
    )

    if (allOn && allOnLongEnough) {
      alerts.push({
        id: `prolonged-room-usage-${room}`,
        type: 'prolonged-room-usage',
        message: `${getRoomLabel(room)}: all ${roomDevices.length} devices have been on for over ${prolongedHours} hour${prolongedHours !== 1 ? 's' : ''}`,
        room,
        deviceIds: roomDevices.map((d) => d.id),
        triggeredAt: now.toISOString(),
        resolvedAt: null,
      })
    }
  }

  return alerts
}

/* ------------------------------------------------------------------ */
/*  Public entry point                                                */
/* ------------------------------------------------------------------ */

export const evaluateAlerts = (input: EvaluateAlertsInput): EvaluateAlertsOutput => {
  const { devices, previousAlerts, now } = input

  const desiredAlerts = [...evaluateAfterHours(devices, now), ...evaluateProlongedUsage(devices, now)]

  const unresolvedPrevious = previousAlerts.filter((a) => a.resolvedAt === null)

  const desiredIds = new Set(desiredAlerts.map((a) => a.id))
  const previousIds = new Set(unresolvedPrevious.map((a) => a.id))

  const newlyTriggered = desiredAlerts.filter((a) => !previousIds.has(a.id))

  const newlyResolved = unresolvedPrevious
    .filter((a) => !desiredIds.has(a.id))
    .map((a) => ({ ...a, resolvedAt: now.toISOString() }))

  const activeAlerts = desiredAlerts.map((desired) => {
    const prev = unresolvedPrevious.find((p) => p.id === desired.id)
    return prev ? { ...desired, triggeredAt: prev.triggeredAt } : desired
  })

  return { activeAlerts, newlyTriggered, newlyResolved }
}
