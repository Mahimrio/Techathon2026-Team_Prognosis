import { io as SocketIOClient } from 'socket.io-client'
import type { Alert } from '../types'
import { Client, TextChannel } from 'discord.js'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001'
const ALERT_CHANNEL_ID = process.env.DISCORD_ALERT_CHANNEL_ID

export const startAlertListener = (client: Client): void => {
  if (!ALERT_CHANNEL_ID) {
    console.log('[alertPusher] DISCORD_ALERT_CHANNEL_ID not set — skipping alert push')
    return
  }

  const socket = SocketIOClient(BACKEND_URL)

  socket.on('connect', () => {
    console.log('[alertPusher] connected to backend Socket.IO')
  })

  socket.on('alertTriggered', (alert: Alert) => {
    const channel = client.channels.cache.get(ALERT_CHANNEL_ID)
    if (!channel || !(channel instanceof TextChannel)) return

    const message = formatAlertMessage(alert)
    channel.send(message).catch((err) => {
      console.error('[alertPusher] failed to send message:', err)
    })
  })

  socket.on('disconnect', () => {
    console.log('[alertPusher] disconnected from backend Socket.IO')
  })
}

const formatAlertMessage = (alert: Alert): string => {
  if (alert.type === 'after-hours') {
    return `⚠️ Hey! ${alert.message}. Did someone forget to leave?`
  }
  return `⚠️ ${alert.message}.`
}
