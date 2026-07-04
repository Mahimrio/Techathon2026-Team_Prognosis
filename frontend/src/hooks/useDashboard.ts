import { useState, useEffect } from 'react'
import { useSocket } from '../lib/socket'
import type { Device, UsageData } from '../lib/types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

interface UseDashboardReturn {
  devices: Device[]
  usage: UsageData | null
  loading: boolean
}

export const useDashboard = (): UseDashboardReturn => {
  const { socket, connected } = useSocket()
  const [devices, setDevices] = useState<Device[]>([])
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  /* ── Initial load from REST ── */
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [devRes, usageRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/devices`),
          fetch(`${BACKEND_URL}/api/usage`),
        ])
        if (cancelled) return
        if (devRes.ok) setDevices(await devRes.json())
        if (usageRes.ok) setUsage(await usageRes.json())
      } catch {
        /* socket will fill in when connected */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  /* ── Live socket updates ── */
  useEffect(() => {
    if (!socket) return

    const onDeviceUpdate = (updated: Device) => {
      setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    }

    const onUsageUpdate = (data: UsageData) => {
      setUsage(data)
    }

    socket.on('deviceUpdate', onDeviceUpdate)
    socket.on('usageUpdate', onUsageUpdate)

    return () => {
      socket.off('deviceUpdate', onDeviceUpdate)
      socket.off('usageUpdate', onUsageUpdate)
    }
  }, [socket])

  /* ── Stop loading once socket delivers data (fallback if REST failed) ── */
  useEffect(() => {
    if (!loading || !connected || !socket) return
    const onAny = () => setLoading(false)
    socket.on('deviceUpdate', onAny)
    socket.on('usageUpdate', onAny)
    return () => {
      socket.off('deviceUpdate', onAny)
      socket.off('usageUpdate', onAny)
    }
  }, [loading, connected, socket])

  return { devices, usage, loading }
}
