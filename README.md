# OfficeVolt

A real-time office energy monitoring dashboard and Discord bot that simulates 15 smart devices across 3 rooms, surfaces live power usage, and pushes intelligent alerts when devices are left on after hours or running too long — built for the boss who wants to know why the electricity bill is higher than rent.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Setup & Installation](#setup--installation)
- [How to Run](#how-to-run)
- [API Endpoints](#api-endpoints)
- [LLM / AI Integration](#llm--ai-integration)
- [Discord Bot](#discord-bot)
- [Hardware & Electrical Schematic](#hardware--electrical-schematic)
- [Live Deployments](#live-deployments)
- [Known Limitations & Trade-offs](#known-limitations--trade-offs)
- [Team Contributions](#team-contributions)
- [Future Scope & Improvements](#future-scope--improvements)
- [License](#license)

---

## Problem Statement

The ask was straightforward: build a full-stack prototype that proves an IoT energy monitoring concept — simulate a small office's device layer, expose live device state and power usage via a clean API, push real-time updates to a web dashboard **and** a Discord bot, and implement smart alerting rules (after-hours usage, prolonged run-times) that resolve automatically when conditions normalise. No physical hardware required, but the architecture must be immediately portable to real ESP32-connected relays.

---

## Architecture Overview

OfficeVolt uses a **single shared backend** as the source of truth. An in-memory device store is driven by a `setInterval`-based simulator tick engine that flips 1–3 random devices every ~10 seconds. The backend exposes:

- **REST endpoints** (`/api/devices`, `/api/rooms/:room`, `/api/usage`, `/api/alerts`) for initial page load and bot queries.
- **Socket.IO events** (`deviceUpdate`, `usageUpdate`, `alertTriggered`, `alertResolved`) for real-time push to the web UI and (optionally) the Discord bot's alert listener.

The web UI is a React + Vite app with Tailwind, Recharts-ready, and an SVG office layout that shows each fan spinning and each light glowing when ON. The Discord bot uses `discord.js` v14 with slash commands + legacy `!` prefix aliases, and calls the backend over HTTP only — no shared code, no tight coupling.

```
[Simulated Device Layer] -> [Backend API (Express + Socket.IO)] -> [Web UI (React / Vite)]
                                                                -> [Discord Bot (HTTP only)]
```

![System Diagram](./docs/system-diagram.png)

**Note:** The system diagram image should be placed at `docs/system-diagram.png`. See the `docs/` directory for per-prompt design documents that informed this architecture.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | Node.js + TypeScript, Express, Socket.IO, in-memory store | Fast to prototype, zero external dependencies (no DB), single-process deployment. Socket.IO chosen over raw WebSockets for automatic reconnection, fallback transports, and room-based broadcasting if needed later. |
| **Frontend** | React + Vite + TypeScript, Tailwind CSS, Recharts, `socket.io-client` | Vite gives instant HMR; Tailwind keeps the UI consistent without writing bespoke CSS. Recharts is declared but not yet used (ready for historical kWh line charts). |
| **Discord Bot** | `discord.js` v14, HTTP-only backend client, Socket.IO alert listener | Slash commands + legacy `!` prefixes for maximum user comfort. The bot never imports backend code — it fetches JSON over HTTP, keeping the coupling boundary clean. The alert listener uses a Socket.IO client to receive real-time `alertTriggered` events and push them to a designated channel. |
| **Testing** | Vitest (workspace mode) | Vitest runs across all three workspaces consistently, integrates natively with Vite's transform pipeline, and is fast enough for watch-mode TDD. |

---

## Data Model

Every device in the office is represented by a single canonical interface:

```typescript
interface Device {
  id: string          // e.g. "dev-01"
  name: string        // e.g. "Drawing Room Fan 1"
  type: "fan" | "light"
  room: "drawing" | "work1" | "work2"
  status: "on" | "off"
  powerDrawWatts: number  // 60 for fan, 15 for light when ON; 0 when OFF
  lastChanged: string     // ISO 8601 timestamp
}
```

**Example instance:**

```json
{
  "id": "dev-03",
  "name": "Drawing Room Light 1",
  "type": "light",
  "room": "drawing",
  "status": "on",
  "powerDrawWatts": 15,
  "lastChanged": "2026-07-04T08:32:17.000Z"
}
```

**Total device count: 15** — derived entirely from the canonical fixture at `backend/src/models/roomFixture.ts`. The fixture defines 3 rooms, each with 2 fans and 3 lights. If the fixture changes (e.g. a 4th room is added), all derived totals (seed logic, test assertions, bot replies) update automatically — no magic numbers anywhere.

---

## Setup & Installation

### Prerequisites

- **Node.js >= 18** (includes `npm`). Verify:

```bash
node --version
npm --version
```

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_ORG/officevolt.git
cd officevolt

# 2. Install all workspace dependencies (from root)
npm install

# 3. Create backend environment file (required)
Copy-Item backend\.env.example backend\.env

# 4. Create frontend environment file (required)
Copy-Item frontend\.env.example frontend\.env

# 5. (Optional) Create bot environment file
Copy-Item bot\.env.example bot\.env
```

### Required Environment Variables

| File | Variable | Required For | Default |
|------|----------|-------------|---------|
| `backend/.env` | `PORT` | Backend server | `3001` |
| `backend/.env` | `CORS_ORIGIN` | CORS header | `http://localhost:5173` |
| `backend/.env` | `SIM_TICK_INTERVAL_MS` | Simulator tick speed | `10000` |
| `frontend/.env` | `VITE_BACKEND_URL` | Frontend knows where to reach the API | `http://localhost:3001` |
| `bot/.env` | `DISCORD_TOKEN` | Bot login **(required for bot)** | *(none)* |
| `bot/.env` | `LLM_API_KEY` | DeepSeek humanization (optional) | *(none)* |
| `bot/.env` | `BACKEND_URL` | Bot knows where the backend is | `http://localhost:3001` |
| `bot/.env` | `DISCORD_GUILD_ID` | Guild-specific slash registration | *(none)* |
| `bot/.env` | `DISCORD_ALERT_CHANNEL_ID` | Alert push destination channel | *(none)* |

The **backend and frontend work out-of-the-box** with just the `.env` copies — no tokens needed. The bot requires a valid `DISCORD_TOKEN` to start.

---

## How to Run

### Development Mode (all services)

```bash
npm run dev
```

This uses `concurrently` to start all three workspaces in parallel:
- **Backend** → `http://localhost:3001`
- **Frontend** → `http://localhost:5173`
- **Bot** → terminal-only (connects to Discord)

### Individual Services

```bash
# Backend only
npm run dev -w backend

# Frontend only
npm run dev -w frontend

# Bot only
npm run dev -w bot
```

### Production / Deployed Mode

```bash
npm run build        # Compile all workspaces
npm start            # Backend + Bot (frontend is static, served by Vercel/CDN)
```

### Running Tests

```bash
npx vitest run       # Run all tests across backend, frontend, and bot
```

---

## API Endpoints

### REST Routes

| Method | Route | Response | Example |
|--------|-------|----------|---------|
| `GET` | `/api/health` | `{ "status": "ok" }` | — |
| `GET` | `/api/devices` | `Device[]` — all 15 devices | [Try it](https://officevolt-backend.onrender.com/api/devices) |
| `GET` | `/api/rooms/:room` | `{ room, devices, totalPower }` — room-scoped | [Try it](https://officevolt-backend.onrender.com/api/rooms/drawing) |
| `GET` | `/api/usage` | `{ totalPowerNow, roomPower, estimatedKWhToday }` | [Try it](https://officevolt-backend.onrender.com/api/usage) |
| `GET` | `/api/alerts` | `Alert[]` — currently active alerts | [Try it](https://officevolt-backend.onrender.com/api/alerts) |

### WebSocket Events (Socket.IO)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `deviceUpdate` | Server → Client | `Device` | Fired whenever a device flips on/off during a simulator tick |
| `usageUpdate` | Server → Client | `UsageData` | Fired on every tick with latest aggregate power + kWh estimate |
| `alertTriggered` | Server → Client | `Alert` | A new alert condition became true |
| `alertResolved` | Server → Client | `Alert` | A previously-active alert condition is no longer true (sets `resolvedAt`) |

**Alert shape:**

```json
{
  "id": "after-hours-drawing",
  "type": "after-hours",
  "message": "Drawing Room: 2 device(s) are ON outside office hours (09:00-17:00 BDT)",
  "room": "drawing",
  "deviceIds": ["dev-01", "dev-02"],
  "triggeredAt": "2026-07-04T18:30:00.000Z",
  "resolvedAt": "2026-07-04T18:35:00.000Z"
}
```

Two alert rules:
1. **After-hours** — any device ON outside 09:00–17:00 BDT (UTC+6).
2. **Prolonged room usage** — all devices in a room ON continuously for > 2 hours (configurable via `ALERT_PROLONGED_HOURS`).

Both resolve automatically when the condition stops being true, emitting `alertResolved` and setting the `resolvedAt` timestamp.

---

## LLM / AI Integration

The Discord bot includes a **humanization layer** that rewrites structured command output into friendly, conversational sentences using **DeepSeek's chat API**.

### How It Works

1. The bot calls the backend REST API to get raw numeric data (device counts, wattages, kWh).
2. It builds a plain-text summary string (e.g. `"Total power right now: 135W. Today's estimated usage: 1.2 kWh."`).
3. It sends that string to DeepSeek with a system prompt: *"Rewrite this into one friendly Discord sentence. Never invent or change numbers."*
4. DeepSeek returns a natural-language reply (e.g. *"We're pulling about 135W at the moment, which works out to roughly 1.2 kWh today so far."*).

### Critical Guarantee

The LLM **never generates or invents raw numbers**. It only rephrases the already-correct structured data. If the DeepSeek API call fails, times out, or returns an unexpected shape, the bot falls back silently to the plain-template string — the bot never goes silent.

### Configuration

Set `LLM_API_KEY` in `bot/.env` to enable. Without it, `humanize()` returns the plain text verbatim.

---

## Discord Bot

### Commands

| Command | Description | Example Output |
|---------|-------------|----------------|
| `/status` or `!status` | Show device status for all 3 rooms | "Drawing Room has 2 fans and 1 light on. Work Room 1 is totally dark. Work Room 2 has 3 lights on." |
| `/room <name>` or `!room <name>` | Show status + power for a specific room (`drawing`, `work1`, `work2`) | "Drawing Room: 1 fan, 2 lights ON. Drawing 60W." |
| `/usage` or `!usage` | Show total current power draw + estimated kWh today | "We're drawing 135W right now. About 1.6 kWh used today." |

### Adding the Bot to a New Server

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a new application → **Bot** → copy the token into `bot/.env` as `DISCORD_TOKEN`.
3. Under **OAuth2 → URL Generator**, select scopes `bot` + `applications.commands`, then the `Send Messages` and `Read Message History` permissions.
4. Use the generated URL to invite the bot to your server.
5. (Optional) Set `DISCORD_GUILD_ID` for near-instant slash command registration; without it, global commands take ~1 hour to propagate.

---

## Hardware & Electrical Schematic

> **This is a software-only prototype.** No physical hardware is required to run OfficeVolt. The schematic below documents the planned wiring for a real-world deployment using an ESP32 microcontroller and relay module — ready for implementation when the office is ready for hardware.

![Electrical Schematic](./docs/schematic.png)

### Pin Mapping (Planned)

| ESP32 Pin | Component | Notes |
|-----------|-----------|-------|
| GPIO 32 | Relay 1 — Drawing Fan 1 | Active-low relay (LOW = ON) |
| GPIO 33 | Relay 2 — Drawing Fan 2 | |
| GPIO 25 | Relay 3 — Drawing Light 1 | |
| GPIO 26 | Relay 4 — Drawing Light 2 | |
| GPIO 27 | Relay 5 — Drawing Light 3 | |
| GPIO 14 | Relay 6 — Work1 Fan 1 | |
| GPIO 12 | Relay 7 — Work1 Fan 2 | |
| GPIO 13 | Relay 8 — Work1 Light 1 | |
| GPIO 15 | Relay 9 — Work1 Light 2 | |
| GPIO 2  | Relay 10 — Work1 Light 3 | |
| GPIO 4  | Relay 11 — Work2 Fan 1 | |
| GPIO 16 | Relay 12 — Work2 Fan 2 | |
| GPIO 17 | Relay 13 — Work2 Light 1 | |
| GPIO 5  | Relay 14 — Work2 Light 2 | |
| GPIO 18 | Relay 15 — Work2 Light 3 | |
| GPIO 19 | (Spare) | Future expansion |

### Safety Notes

- Use a **5V relay module** with optocouplers for galvanic isolation between the ESP32 and mains-rated loads.
- Each relay's COM terminal connects to the **live (phase) wire** of the corresponding device; the NO (normally open) terminal connects to the device's live input. Neutral wires are common.
- **Always consult a licensed electrician** before connecting any prototype board to mains voltage (220–240 VAC in Bangladesh).
- The simulated layer in this codebase mirrors this 15-relay layout perfectly — switching from simulation to hardware means replacing the `flipDeviceStatus` calls in the simulator with MQTT or HTTP commands to the ESP32.

---

## Live Deployments

| Service | URL | Hosting |
|---------|-----|---------|
| **Frontend** (Web Dashboard) | [https://officevolt.vercel.app](https://officevolt.vercel.app) | Vercel |
| **Backend API** (REST + Socket.IO) | [https://officevolt-backend.onrender.com](https://officevolt-backend.onrender.com) | Render |
| **Discord Bot** | Runs on Render (background worker) | Render |

Click the "Try it" links in the [API Endpoints](#api-endpoints) section above to see live JSON responses from the deployed backend.

---

## Known Limitations & Trade-offs

- **In-memory store resets on restart.** Every time the backend process restarts (deploy, crash, local restart), all device states and alert history are lost. The simulator re-seeds with randomised states, so the app comes back healthy — but kWh estimates for "today" start from zero. A production version would persist state in SQLite or Redis.
- **No authentication.** The REST API and Socket.IO server are completely open. Intentionally so — adding auth would add scope with no benefit to the prototype's core purpose. A real deployment would add API keys or OAuth2.
- **Simulator is random, not pattern-based.** Device flips are purely stochastic. A more realistic simulator would follow occupancy patterns (e.g. lunch hours, meeting schedules). This was deemed unnecessary for a proof-of-concept but would matter for demo-day plausibility.
- **No persistent user accounts.** The frontend is a single anonymous dashboard. Multi-tenant support (different offices, different user roles) would require a fundamentally different architecture.
- **Recharts is declared but unused.** The dependency is in `frontend/package.json` and ready for historical chart rendering, but the current UI only shows real-time numbers. Adding a time-series kWh chart is the next logical UI enhancement.
- **Bot tests are absent.** All 22 tests live in the backend workspace. The frontend and bot workspaces have zero test files — something to address before production hardening.

---

## Team Contributions

| Team Member | Role / Contribution |
|-------------|---------------------|
| **Rianto** | Project initialization, Device Simulator engine, REST API + Socket.IO integration, Dashboard UI (React components, SVG office layout, live data hooks) |
| **Akif** | Discord bot (all commands: `!status`, `!room`, `!usage`), LLM humanization layer (`DeepSeek` integration with fallback), alert push service |
| **Dhrubo** | Hardware/electrical schematic guidance, system diagram content, wiring pin-mapping specification |
| **Mugdho** | Environment variable restructuring & `.env` security separation, cross-workspace testing & validation pass, Render + Vercel live deployments, professional README.md |

*Team submitted as **Team Prognosis** for Techathon 2026.*

---

## Future Scope & Improvements

1. **Real ESP32 telemetry** — Introduce a `/api/telemetry` ingest endpoint that accepts device state reports from physical ESP32s over MQTT or HTTP POST. When a telemetry source is active, the simulator pauses for that device automatically.
2. **Historical kWh charts** — Wire Recharts into the frontend to display a time-series line chart of power usage over the current day, using the snapshot history already maintained in `powerHistory.ts`.
3. **Manual device override from frontend** — Add a `POST /api/devices/:id/toggle` endpoint so users can flip devices from the dashboard (currently the simulator owns all state changes).
4. **Scheduled occupancy patterns** — Replace random simulator ticks with a cron-like schedule that mimics real office hours (e.g. ramps up at 09:00, drops at 13:00 for lunch, ramps again, shuts down at 17:00).
5. **Energy cost calculator** — Multiply kWh usage by Bangladesh's commercial electricity tariff (~12-14 BDT/kWh) and show an estimated cost on the dashboard and in the `/usage` bot command.

---

## License

MIT License — see [LICENSE](./LICENSE) for full text.
