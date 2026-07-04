import 'dotenv/config'
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Events,
} from 'discord.js'
import { handleStatus } from './commands/status'
import { handleRoom } from './commands/room'
import { handleUsage } from './commands/usage'
import { startAlertListener } from './services/alertPusher'

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const GUILD_ID = process.env.DISCORD_GUILD_ID

if (!DISCORD_TOKEN) {
  console.error('[bot] DISCORD_TOKEN is required')
  process.exit(1)
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

const commands = [
  {
    name: 'status',
    description: 'Show device status for all rooms',
  },
  {
    name: 'room',
    description: 'Show device status for a specific room',
    options: [
      {
        name: 'name',
        description: 'Room name (drawing, work1, work2)',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'usage',
    description: 'Show current power usage and estimated kWh today',
  },
]

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)

client.once('ready', async () => {
  try {
    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(client.user!.id, GUILD_ID),
        { body: commands },
      )
      console.log(`[bot] registered guild commands for guild ${GUILD_ID}`)
    } else {
      await rest.put(Routes.applicationCommands(client.user!.id), {
        body: commands,
      })
      console.log('[bot] registered global commands (may take ~1h to propagate)')
    }
  } catch (err) {
    console.error('[bot] failed to register slash commands:', err)
  }

  console.log(`[bot] logged in as ${client.user?.tag}`)
  startAlertListener(client)
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  try {
    let reply: string
    switch (interaction.commandName) {
      case 'status':
        reply = await handleStatus()
        break
      case 'room':
        reply = await handleRoom(
          interaction.options.getString('name', true),
        )
        break
      case 'usage':
        reply = await handleUsage()
        break
      default:
        reply = 'Unknown command.'
    }
    await interaction.reply(reply)
  } catch (err) {
    console.error('[slash] handler error:', err)
    await interaction.reply({
      content: '❌ Something went wrong. Please try again.',
      ephemeral: true,
    })
  }
})

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return

  const content = message.content.trim()
  if (!content.startsWith('!')) return

  const [cmd, ...args] = content.slice(1).split(/\s+/)

  try {
    let reply: string
    switch (cmd) {
      case 'status':
        reply = await handleStatus()
        break
      case 'room':
        if (args.length === 0) {
          reply = '❌ Usage: !room <name> (e.g. !room drawing)'
          break
        }
        reply = await handleRoom(args.join(' '))
        break
      case 'usage':
        reply = await handleUsage()
        break
      default:
        return
    }
    await message.reply(reply)
  } catch (err) {
    console.error('[prefix] handler error:', err)
    await message.reply('❌ Something went wrong. Please try again.')
  }
})

client.login(DISCORD_TOKEN)
