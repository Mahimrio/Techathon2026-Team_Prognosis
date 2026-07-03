import { Client, GatewayIntentBits } from 'discord.js'

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once('ready', () => {
  console.log(`[bot] logged in as ${client.user?.tag}`)
})

client.login(process.env.DISCORD_TOKEN)
