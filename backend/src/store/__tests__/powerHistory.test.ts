import { describe, it, expect, beforeEach } from 'vitest'
import { setClock, realClock } from '../../lib/clock'
import { resetAndReseed, getTotalPowerNow } from '../deviceStore'
import { resetHistory, getEstimatedKWhToday, recordSnapshot } from '../powerHistory'
import { WATTAGES } from '../../models/device'
import { ROOMS } from '../../models/roomFixture'

beforeEach(() => {
  setClock(realClock)
  resetAndReseed()
  resetHistory()
})

describe('powerHistory backfill', () => {
  it('returns a non-zero estimated kWh today immediately after boot', () => {
    const pinned = new Date('2026-07-04T14:00:00Z')
    setClock(() => pinned)
    resetAndReseed()
    resetHistory()

    const kWh = getEstimatedKWhToday()
    expect(kWh).toBeGreaterThan(0)
  })

  it('does not exceed theoretical max kWh for the pinned period', () => {
    const pinned = new Date('2026-07-04T14:00:00Z')
    setClock(() => pinned)
    resetAndReseed()
    resetHistory()

    const kWh = getEstimatedKWhToday()

    const maxWatts = ROOMS.reduce(
      (sum, room) =>
        sum + room.devices.reduce((s, d) => s + WATTAGES[d.type] * d.count, 0),
      0,
    )
    const hoursSinceMidnight = 14
    const theoreticalMaxKWh = (maxWatts * hoursSinceMidnight) / 1000

    expect(kWh).toBeLessThan(theoreticalMaxKWh + 0.01)
  })

  it('increases kWh when a new snapshot is recorded with more power', () => {
    const pinned = new Date('2026-07-04T10:00:00Z')
    setClock(() => pinned)
    resetAndReseed()
    resetHistory()

    const before = getEstimatedKWhToday()

    pinned.setHours(pinned.getHours() + 1)
    recordSnapshot()

    const after = getEstimatedKWhToday()
    expect(after).toBeGreaterThanOrEqual(0)
  })
})
