const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001'

export const fetchDevices = async (): Promise<any> => {
  const res = await fetch(`${BACKEND_URL}/api/devices`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const fetchRoom = async (room: string): Promise<any> => {
  const res = await fetch(`${BACKEND_URL}/api/rooms/${encodeURIComponent(room)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    throw new Error(typeof body.error === 'string' ? body.error : `API error: ${res.status}`)
  }
  return res.json()
}

export const fetchUsage = async (): Promise<any> => {
  const res = await fetch(`${BACKEND_URL}/api/usage`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
