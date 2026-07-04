import type { Alert } from '../lib/types'

const TYPE_CONFIG = {
  'after-hours': {
    label: 'After Hours',
    border: 'border-l-orange-500',
    badge: 'bg-orange-700 text-orange-100',
    icon: '⏰',
  },
  'prolonged-room-usage': {
    label: 'Prolonged Usage',
    border: 'border-l-red-500',
    badge: 'bg-red-700 text-red-100',
    icon: '⚠',
  },
} as const

interface AlertCardProps {
  alert: Alert
  resolved?: boolean
}

const AlertCard = ({ alert, resolved }: AlertCardProps) => {
  const cfg = TYPE_CONFIG[alert.type]

  const time = new Date(resolved ? alert.resolvedAt! : alert.triggeredAt)
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className={`border-l-4 ${cfg.border} rounded-r-lg bg-gray-800/60 p-3 transition-all ${
        resolved ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>
              {cfg.label}
            </span>
            {resolved && (
              <span className="rounded-full bg-green-700 px-2 py-0.5 text-xs font-semibold text-green-100">
                Resolved
              </span>
            )}
          </div>
          <p className={`mt-1 text-sm ${resolved ? 'text-gray-400' : 'text-gray-200'}`}>
            {alert.message}
          </p>
        </div>
        <span className="shrink-0 text-xs text-gray-500">{timeStr}</span>
      </div>
    </div>
  )
}

export default AlertCard
