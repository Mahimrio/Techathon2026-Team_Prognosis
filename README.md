# OfficeVolt

**Team manties** — IUT Techathon 2026

> A real-time office energy monitoring system with live device simulation, power usage tracking, intelligent alerts, and a Discord bot companion.

[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-000?logo=vercel)](https://officevolt.vercel.app)
[![Live Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://officevolt-backend.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Live Deployment

| Service | URL | Tech |
|---------|-----|------|
| Frontend (Web UI) | https://officevolt.vercel.app | React + Vite + Tailwind CSS |
| Backend API + WebSocket | https://officevolt-backend.onrender.com | Express + Socket.IO |
| Discord Bot | Runs alongside backend on Render | discord.js v14 |

---

## Architecture

```
[Simulated Device Layer] → [Backend API (Express + Socket.IO)] → [Web UI (React + Vite)]
                                                               → [Discord Bot (HTTP only)]
```

- **Backend** — Single source of truth. In-memory device store, `setInterval` tick engine, REST + WebSocket push. Deployed at `https://officevolt-backend.onrender.com`.
- **Frontend** — Reads from backend on mount, subscribes to Socket.IO events for real-time updates. Hosted at `https://officevolt.vercel.app`.
- **Discord Bot** — Never imports backend code. Calls `GET /api/devices`, `GET /api/rooms/:room`, `GET /api/usage` over HTTP.

---

## Device Model

Exactly **15 devices** across 3 rooms:

| Room | Fans | Lights | Total |
|------|------|--------|-------|
| Drawing Room | 2 | 3 | 5 |
| Work Room 1 | 2 | 3 | 5 |
| Work Room 2 | 2 | 3 | 5 |

**Device object:**
```json
{
  "id": "fan-drawing-1",
  "name": "Drawing Fan 1",
  "type": "fan",
  "room": "drawing",
  "status": "on",
  "powerDrawWatts": 60,
  "lastChanged": "2026-07-04T10:30:00.000Z"
}
```

- Fan: 60W when ON, 0W when OFF
- Light: 15W when ON, 0W when OFF
- Total max draw: 3 × (2 × 60 + 3 × 15) = **495W**

---

## Features

### Real-Time Simulation
- Tick engine flips 1–3 random devices every 10 seconds
- Power usage calculated and streamed via WebSocket

### REST API
| Endpoint | Description |
|----------|-------------|
| `GET /api/devices` | All devices |
| `GET /api/rooms/:room` | Devices in a specific room |
| `GET /api/usage` | Current + historical power usage |
| `GET /api/alerts` | Active and resolved alerts |
| `GET /api/health` | Health check |

All endpoints available at `https://officevolt-backend.onrender.com/api/...`

### Socket.IO Events
| Event | Payload |
|-------|---------|
| `deviceUpdate` | `{ device: Device }` |
| `usageUpdate` | `{ totalWatts, rooms, history }` |
| `alertTriggered` | `{ alert: Alert }` |
| `alertResolved` | `{ alert: Alert }` |

### Alert Rules
- **After-hours**: Any device ON outside 09:00–17:00 (BST, UTC+6)
- **Prolonged usage**: A room where ALL devices have been ON continuously for >2 hours
- Alerts auto-resolve when the condition clears

### Discord Bot
- Slash commands + legacy `!` prefix aliases
- `!status` / `/status` — Overall device summary
- `!room <name>` / `/room` — Per-room breakdown
- `!usage` / `/usage` — Power consumption report
- LLM-powered humanization (DeepSeek) with plain-text fallback

---

## Quick Start (Local Development)

### Prerequisites
- Node.js >= 18

### Setup
```bash
# 1. Clone and install
git clone https://github.com/FazleRabbiMugdho/Techathon2026-Team_Prognosis.git
cd Techathon2026-Team_Prognosis
npm install

# 2. Create .env files
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
Copy-Item bot\.env.example bot\.env   # optional

# 3. Start backend (terminal 1)
npx tsx backend/src/index.ts

# 4. Start frontend (terminal 2)
npx vite frontend

# 5. (Optional) Start Discord bot (terminal 3)
npx tsx bot/src/index.ts

# 6. Run tests
npx vitest run
```

Open http://localhost:5173

---

## Environment Variables

| Variable | Required For | Default |
|----------|-------------|---------|
| `PORT` | Backend | 3001 |
| `CORS_ORIGIN` | Backend | `http://localhost:5173,https://officevolt.vercel.app` |
| `SIM_TICK_INTERVAL_MS` | Backend | 10000 |
| `DISCORD_TOKEN` | Bot | (none) |
| `DISCORD_ALERT_CHANNEL_ID` | Bot | (none) |
| `DISCORD_GUILD_ID` | Bot | (none) |
| `BACKEND_URL` | Bot | `https://officevolt-backend.onrender.com` |
| `LLM_API_KEY` | Bot | (none) |
| `ALERT_PROLONGED_HOURS` | Backend | 2 |
| `ALERT_OFFICE_START` | Backend | 9 |
| `ALERT_OFFICE_END` | Backend | 17 |
| `VITE_BACKEND_URL` | Frontend | `https://officevolt-backend.onrender.com` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, TypeScript, Express, Socket.IO |
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Bot | discord.js v14, DeepSeek API |
| Testing | Vitest (workspace-wide) |
| Deployment | Render (backend + bot), Vercel (frontend) |

---

## Team manties

| Name | Email | Phone |
|------|-------|-------|
| Nafisa Rahman | nafisa.rahman@yahoo.com | +8801812345678 |
| Tanvir Hossain | tanvir.hossain@yahoo.com | +8801912345678 |

---

## License

MIT License — see [LICENSE](LICENSE).
