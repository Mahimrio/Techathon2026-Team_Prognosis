import { describe, it, expect, beforeEach } from 'vitest'
import { ROOMS } from '../../models/roomFixture'
import { WATTAGES } from '../../models/device'
import { resetAndReseed, getAllDevices, getDevicesByRoom, getTotalPowerNow, getRoomPower } from '../deviceStore'

beforeEach(() => {
  resetAndReseed()
})

describe('deviceStore seed', () => {
  it('derives total device count from fixture, not a hardcoded number', () => {
    const devices = getAllDevices()
    const expectedFromFixture = ROOMS.reduce(
      (sum, room) => sum + room.devices.reduce((s, d) => s + d.count, 0),
      0,
    )
    expect(devices.length).toBe(expectedFromFixture)
  })

  it('gives each room the correct number of devices', () => {
    for (const room of ROOMS) {
      const roomDevices = getDevicesByRoom(room.name)
      const expectedCount = room.devices.reduce((s, d) => s + d.count, 0)
      expect(roomDevices.length).toBe(expectedCount)
    }
  })

  it('assigns the right type counts per room', () => {
    for (const room of ROOMS) {
      const roomDevices = getDevicesByRoom(room.name)
      for (const { type, count } of room.devices) {
        const matches = roomDevices.filter((d) => d.type === type)
        expect(matches.length).toBe(count)
      }
    }
  })

  it('computes powerDrawWatts correctly for each device', () => {
    const devices = getAllDevices()
    for (const d of devices) {
      const expectedWatts = d.status === 'on' ? WATTAGES[d.type] : 0
      expect(d.powerDrawWatts).toBe(expectedWatts)
    }
  })

  it('getTotalPowerNow matches sum of all device power', () => {
    const devices = getAllDevices()
    const manualSum = devices.reduce((s, d) => s + d.powerDrawWatts, 0)
    expect(getTotalPowerNow()).toBe(manualSum)
  })

  it('getRoomPower matches sum of that room', () => {
    for (const room of ROOMS) {
      const roomDevices = getDevicesByRoom(room.name)
      const manualSum = roomDevices.reduce((s, d) => s + d.powerDrawWatts, 0)
      expect(getRoomPower(room.name)).toBe(manualSum)
    }
  })

  it('returns copies of devices (immutable accessor)', () => {
    const devices = getAllDevices()
    const origLength = devices.length
    devices.pop()
    expect(getAllDevices().length).toBe(origLength)
  })
})
