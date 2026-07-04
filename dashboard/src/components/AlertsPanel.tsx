import { useState } from 'react'
import { useAlerts } from '../hooks/useAlerts'
import AlertCard from './AlertCard'

const AlertsPanel = () => {
  const { activeAlerts, resolvedAlerts } = useAlerts()
  const [showResolved, setShowResolved] = useState(false)

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-white">Alerts</h2>

      {activeAlerts.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/30 p-6 text-sm text-gray-500">
          <span>✓</span>
          <span>No active alerts — all devices within normal parameters</span>
        </div>
      ) : (
        <div className="space-y-2">
          {activeAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {resolvedAlerts.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            <span className={`inline-block transition-transform ${showResolved ? 'rotate-90' : ''}`}>
              ▶
            </span>
            Recently resolved ({resolvedAlerts.length})
          </button>

          {showResolved && (
            <div className="mt-2 space-y-2">
              {resolvedAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} resolved />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default AlertsPanel
