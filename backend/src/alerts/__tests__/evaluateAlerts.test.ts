import { describe, it, expect } from 'vitest'
import type { Device } from '../../models/device'
import { evaluateAlerts } from '../evaluateAlerts'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const makeDevice = (
  id: string,
  room: string,
  status: 'on' | 'off',
  lastChanged: string,
): Device => ({
  id,
  name: `Fake ${id}`,
  type: 'light',
  room: room as Device['room'],
  status,
  powerDrawWatts: status === 'on' ? 15 : 0,
  lastChanged,
})

const makeDeviceSet = (
  overrides?: Partial<{
    roomCount: number
    devicesPerRoom: number
    status: 'on' | 'off'
    lastChanged: string
  }>,
): Device[] => {
  const {
    roomCount = 3,
    devicesPerRoom = 5,
    status = 'on',
    lastChanged = '2026-07-05T10:00:00.000Z',
  } = overrides ?? {}

  const rooms = ['drawing', 'work1', 'work2']
  const devices: Device[] = []

  for (let r = 0; r < roomCount; r++) {
    for (let d = 0; d < devicesPerRoom; d++) {
      devices.push(makeDevice(`dev-${r}-${d}`, rooms[r], status, lastChanged))
    }
  }
  return devices
}

/* ------------------------------------------------------------------ */
/*  Tests — after-hours                                               */
/* ------------------------------------------------------------------ */

describe('evaluateAlerts — after-hours', () => {
  /* Use a RECENT lastChanged so prolonged-room-usage does NOT also trigger. */
  const recent = '2026-07-05T13:55:00.000Z' // 5 min before now

  it('triggers when devices are ON outside office hours', () => {
    const now = new Date('2026-07-05T14:00:00.000Z') // 20:00 BDT = after hours
    const devices = makeDeviceSet({ status: 'on', lastChanged: recent })

    const { activeAlerts, newlyTriggered } = evaluateAlerts({ devices, now, previousAlerts: [] })

    const afterHours = newlyTriggered.filter((a) => a.type === 'after-hours')
    expect(afterHours).toHaveLength(3) // one per room
    expect(activeAlerts.filter((a) => a.type === 'after-hours')).toHaveLength(3)
    for (const alert of afterHours) {
      expect(alert.resolvedAt).toBeNull()
    }
  })

  it('does NOT trigger during office hours', () => {
    const now = new Date('2026-07-05T08:00:00.000Z') // 14:00 BDT = office hours
    const devices = makeDeviceSet({ status: 'on', lastChanged: recent })

    const { activeAlerts, newlyTriggered } = evaluateAlerts({ devices, now, previousAlerts: [] })

    expect(newlyTriggered.filter((a) => a.type === 'after-hours')).toHaveLength(0)
    expect(activeAlerts.filter((a) => a.type === 'after-hours')).toHaveLength(0)
  })

  it('does NOT trigger when all devices are OFF after hours', () => {
    const now = new Date('2026-07-05T14:00:00.000Z')
    const devices = makeDeviceSet({ status: 'off', lastChanged: recent })

    const { newlyTriggered } = evaluateAlerts({ devices, now, previousAlerts: [] })

    expect(newlyTriggered.filter((a) => a.type === 'after-hours')).toHaveLength(0)
  })

  it('marks after-hours alert as resolved when the offending devices turn OFF', () => {
    const now = new Date('2026-07-05T14:00:00.000Z')
    const devices = makeDeviceSet({ status: 'on', lastChanged: recent })

    const first = evaluateAlerts({ devices, now, previousAlerts: [] })
    const previousAlerts = first.activeAlerts

    const devicesOff = makeDeviceSet({ status: 'off', lastChanged: recent })
    const second = evaluateAlerts({ devices: devicesOff, now, previousAlerts })

    const resolvedAfterHours = second.newlyResolved.filter(
      (a) => a.type === 'after-hours',
    )
    expect(resolvedAfterHours).toHaveLength(3)
    for (const r of resolvedAfterHours) {
      expect(r.resolvedAt).not.toBeNull()
    }
    expect(
      second.activeAlerts.filter((a) => a.type === 'after-hours'),
    ).toHaveLength(0)
  })

  it('does NOT re-trigger an already-active after-hours alert', () => {
    const now = new Date('2026-07-05T14:00:00.000Z')
    const devices = makeDeviceSet({ status: 'on', lastChanged: recent })

    const first = evaluateAlerts({ devices, now, previousAlerts: [] })
    const second = evaluateAlerts({
      devices,
      now,
      previousAlerts: first.activeAlerts,
    })

    expect(second.newlyTriggered.filter((a) => a.type === 'after-hours')).toHaveLength(0)
  })
})

/* ------------------------------------------------------------------ */
/*  Tests — prolonged-room-usage                                      */
/* ------------------------------------------------------------------ */

describe('evaluateAlerts — prolonged-room-usage', () => {
  /* Use an OFFICE-HOURS time so after-hours does NOT also trigger. */
  const now = new Date('2026-07-05T08:00:00.000Z') // 14:00 BDT = office hours
  const oldTimestamp = '2026-07-05T05:00:00.000Z' // 3 hours before now
  const recentTimestamp = '2026-07-05T07:30:00.000Z' // 30 min before now

  it('triggers when a whole room has been ON >2 hours', () => {
    const devices = makeDeviceSet({
      status: 'on',
      lastChanged: oldTimestamp,
      roomCount: 3,
      devicesPerRoom: 5,
    })

    const { activeAlerts, newlyTriggered } = evaluateAlerts({ devices, now, previousAlerts: [] })

    const prolonged = newlyTriggered.filter((a) => a.type === 'prolonged-room-usage')
    expect(prolonged).toHaveLength(3)
    for (const alert of prolonged) {
      expect(alert.message).toMatch(/all 5 devices have been on for over 2 hours/)
    }
    expect(activeAlerts.filter((a) => a.type === 'prolonged-room-usage')).toHaveLength(3)
  })

  it('does NOT trigger when one device in the room is OFF', () => {
    const devices = makeDeviceSet({
      status: 'on',
      lastChanged: oldTimestamp,
      roomCount: 1,
      devicesPerRoom: 5,
    })
    devices[0] = { ...devices[0], status: 'off', powerDrawWatts: 0 }

    const { newlyTriggered } = evaluateAlerts({ devices, now, previousAlerts: [] })

    expect(
      newlyTriggered.filter((a) => a.type === 'prolonged-room-usage'),
    ).toHaveLength(0)
  })

  it('does NOT trigger when devices have been ON for <2 hours', () => {
    const devices = makeDeviceSet({
      status: 'on',
      lastChanged: recentTimestamp,
      roomCount: 1,
      devicesPerRoom: 5,
    })

    const { newlyTriggered } = evaluateAlerts({ devices, now, previousAlerts: [] })

    expect(
      newlyTriggered.filter((a) => a.type === 'prolonged-room-usage'),
    ).toHaveLength(0)
  })

  it('resolves when a device in the room turns OFF', () => {
    const devices = makeDeviceSet({
      status: 'on',
      lastChanged: oldTimestamp,
      roomCount: 1,
      devicesPerRoom: 5,
    })

    const first = evaluateAlerts({ devices, now, previousAlerts: [] })
    expect(
      first.activeAlerts.filter((a) => a.type === 'prolonged-room-usage'),
    ).toHaveLength(1)

    devices[0] = { ...devices[0], status: 'off', powerDrawWatts: 0 }
    const second = evaluateAlerts({
      devices,
      now,
      previousAlerts: first.activeAlerts,
    })

    expect(
      second.newlyResolved.filter((a) => a.type === 'prolonged-room-usage'),
    ).toHaveLength(1)
    expect(
      second.activeAlerts.filter((a) => a.type === 'prolonged-room-usage'),
    ).toHaveLength(0)
  })

  it('resolves when the clock advances but devices were recently toggled', () => {
    const triggerTime = new Date('2026-07-05T08:00:00.000Z')
    const devices = makeDeviceSet({
      status: 'on',
      lastChanged: '2026-07-05T05:00:00.000Z',
      roomCount: 1,
      devicesPerRoom: 5,
    })

    const first = evaluateAlerts({ devices, now: triggerTime, previousAlerts: [] })
    expect(
      first.newlyTriggered.filter((a) => a.type === 'prolonged-room-usage'),
    ).toHaveLength(1)

    const laterTime = new Date('2026-07-05T09:30:00.000Z')
    const updatedDevices = makeDeviceSet({
      status: 'on',
      lastChanged: '2026-07-05T09:00:00.000Z', // only 30 min ago
      roomCount: 1,
      devicesPerRoom: 5,
    })

    const second = evaluateAlerts({
      devices: updatedDevices,
      now: laterTime,
      previousAlerts: first.activeAlerts,
    })

    expect(
      second.newlyResolved.filter((a) => a.type === 'prolonged-room-usage'),
    ).toHaveLength(1)
  })

  it('preserves original triggeredAt when a prolonged alert persists', () => {
    const devices = makeDeviceSet({
      status: 'on',
      lastChanged: oldTimestamp,
      roomCount: 1,
      devicesPerRoom: 5,
    })

    const first = evaluateAlerts({ devices, now, previousAlerts: [] })
    const later = new Date('2026-07-05T09:00:00.000Z')
    const second = evaluateAlerts({
      devices,
      now: later,
      previousAlerts: first.activeAlerts,
    })

    const persistent = second.activeAlerts.find(
      (a) => a.type === 'prolonged-room-usage',
    )
    expect(persistent).toBeDefined()
    expect(persistent!.triggeredAt).toBe(first.activeAlerts[0].triggeredAt)
  })
})

/* ------------------------------------------------------------------ */
/*  Tests — mixed / edge cases                                        */
/* ------------------------------------------------------------------ */

describe('evaluateAlerts — mixed', () => {
  it('does NOT return duplicate newlyResolved for the same alert across calls', () => {
    const recent = '2026-07-05T13:55:00.000Z'
    const now = new Date('2026-07-05T14:00:00.000Z')
    const devices = makeDeviceSet({ status: 'on', lastChanged: recent })

    // First pass: triggers 3 after-hours alerts
    const first = evaluateAlerts({ devices, now, previousAlerts: [] })
    expect(first.newlyTriggered.filter((a) => a.type === 'after-hours')).toHaveLength(3)

    // Second pass: all devices OFF → all 3 resolve
    const devicesOff = makeDeviceSet({ status: 'off', lastChanged: recent })
    const second = evaluateAlerts({
      devices: devicesOff,
      now,
      previousAlerts: first.activeAlerts,
    })
    expect(second.newlyResolved.filter((a) => a.type === 'after-hours')).toHaveLength(3)

    // Third pass: still OFF, feed resolved set — no new resolutions
    const third = evaluateAlerts({
      devices: devicesOff,
      now,
      previousAlerts: second.activeAlerts,
    })
    expect(third.newlyResolved).toHaveLength(0)
  })
})
