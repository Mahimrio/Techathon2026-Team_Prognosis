import { ROOMS } from '../models/roomFixture'
import { WATTAGES } from '../models/device'
import { getClock } from '../lib/clock'
import { getTotalPowerNow } from './deviceStore'

interface PowerSnapshot {
  timestamp: number
  totalWatts: number
}

const history: PowerSnapshot[] = []

const BACKFILL_INTERVAL_MS = 5 * 60 * 1000

const getMaxPossibleWatts = (): number => {
  let total = 0
  for (const room of ROOMS) {
    for (const { type, count } of room.devices) {
      total += WATTAGES[type] * count
    }
  }
  return total
}

const backfill = (): void => {
  const now = getClock()
  const todayStart = new Date(
    now().getFullYear(),
    now().getMonth(),
    now().getDate(),
  ).getTime()
  const nowMs = now().getTime()
  const maxWatts = getMaxPossibleWatts()

  let time = todayStart
  while (time < nowMs) {
    const factor = 0.1 + Math.random() * 0.7
    history.push({ timestamp: time, totalWatts: Math.round(maxWatts * factor) })
    time += BACKFILL_INTERVAL_MS
  }
}

backfill()

export const recordSnapshot = (): void => {
  history.push({ timestamp: getClock()().getTime(), totalWatts: getTotalPowerNow() })
}

export const getEstimatedKWhToday = (): number => {
  if (history.length < 2) return 0

  const now = getClock()
  const todayStart = new Date(
    now().getFullYear(),
    now().getMonth(),
    now().getDate(),
  ).getTime()
  const nowMs = now().getTime()
  const relevant = history.filter(
    (s) => s.timestamp >= todayStart && s.timestamp <= nowMs,
  )
  if (relevant.length < 2) return 0

  let totalKWh = 0
  for (let i = 0; i < relevant.length - 1; i++) {
    const avgWatts = (relevant[i].totalWatts + relevant[i + 1].totalWatts) / 2
    const deltaHours =
      (relevant[i + 1].timestamp - relevant[i].timestamp) / 3_600_000
    totalKWh += (avgWatts * deltaHours) / 1000
  }
  return totalKWh
}

export const resetHistory = (): void => {
  history.length = 0
  backfill()
}
