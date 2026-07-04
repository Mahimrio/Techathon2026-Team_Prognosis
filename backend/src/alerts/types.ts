import type { Device } from '../models/device'

export type AlertType = 'after-hours' | 'prolonged-room-usage'

export interface Alert {
  id: string
  type: AlertType
  message: string
  room: string
  deviceIds: string[]
  triggeredAt: string
  resolvedAt: string | null
}

export interface EvaluateAlertsInput {
  devices: Device[]
  previousAlerts: Alert[]
  now: Date
}

export interface EvaluateAlertsOutput {
  activeAlerts: Alert[]
  newlyTriggered: Alert[]
  newlyResolved: Alert[]
}
