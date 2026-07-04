import type { UsageData } from '../lib/types'

const ROOM_LABELS: Record<string, string> = {
  drawing: 'Drawing Room',
  work1: 'Work Room 1',
  work2: 'Work Room 2',
}

interface PowerMeterProps {
  usage: UsageData | null
}

const PowerMeter = ({ usage }: PowerMeterProps) => {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-white">Power Consumption</h2>

      {usage ? (
        <>
          {/* Total — big prominent number */}
          <div className="mb-4 rounded-xl border border-gray-700 bg-gray-800/60 p-6 text-center">
            <p className="text-sm text-gray-400">Total Power Now</p>
            <p className="text-5xl font-bold text-white">
              {usage.totalPowerNow}
              <span className="ml-1 text-2xl font-normal text-gray-400">W</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              ~{usage.estimatedKWhToday.toFixed(2)} kWh today
            </p>
          </div>

          {/* Per-room sub-meters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Object.entries(usage.roomPower).map(([room, watts]) => {
              const pct = usage.totalPowerNow > 0
                ? Math.round((watts / usage.totalPowerNow) * 100)
                : 0

              return (
                <div
                  key={room}
                  className="rounded-lg border border-gray-700 bg-gray-800/30 p-3"
                >
                  <p className="truncate text-sm text-gray-400">
                    {ROOM_LABELS[room] ?? room}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {watts}
                    <span className="ml-1 text-sm font-normal text-gray-400">W</span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-700">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-xs text-gray-500">{pct}%</p>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-gray-700 bg-gray-800/30 p-12">
          <p className="text-sm text-gray-500">Waiting for data...</p>
        </div>
      )}
    </section>
  )
}

export default PowerMeter
