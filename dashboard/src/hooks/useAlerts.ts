import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../lib/socket'
import type { Alert } from '../lib/types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

const MAX_RESOLVED = 5

interface UseAlertsReturn {
  activeAlerts: Alert[]
  resolvedAlerts: Alert[]
}

export const useAlerts = (): UseAlertsReturn => {
  const { socket } = useSocket()
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([])
  const [resolvedAlerts, setResolvedAlerts] = useState<Alert[]>([])
  const knownIds = useRef(new Set<string>())

  /* ── Initial load from REST ── */
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/alerts`)
      .then((res) => res.json())
      .then((alerts: Alert[]) => {
        setActiveAlerts(alerts)
        for (const a of alerts) knownIds.current.add(a.id)
      })
      .catch(() => {})
  }, [])

  /* ── Socket events ── */
  useEffect(() => {
    if (!socket) return

    const onTriggered = (alert: Alert) => {
      if (knownIds.current.has(alert.id)) return
      knownIds.current.add(alert.id)
      setActiveAlerts((prev) => [alert, ...prev])
    }

    const onResolved = (alert: Alert) => {
      setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id))
      setResolvedAlerts((prev) => [alert, ...prev].slice(0, MAX_RESOLVED))
    }

    socket.on('alertTriggered', onTriggered)
    socket.on('alertResolved', onResolved)

    return () => {
      socket.off('alertTriggered', onTriggered)
      socket.off('alertResolved', onResolved)
    }
  }, [socket])

  return { activeAlerts, resolvedAlerts }
}
