import { fetchUsage } from '../services/backend'
import { humanize } from '../services/llm'

export const handleUsage = async (): Promise<string> => {
  const data = await fetchUsage()
  const text = `Total power right now: ${data.totalPowerNow}W. Today's estimated usage: ${data.estimatedKWhToday.toFixed(1)} kWh.`
  try {
    return await humanize(text)
  } catch (err) {
    console.error('[usage] humanize failed:', err)
    return text
  }
}
