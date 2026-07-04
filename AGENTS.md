# OfficeVolt — AGENTS.md

**Read this file first** before any task. It contains the full project context, architecture, setup procedure, engineering rules, and locked decisions. A new agent can use this to orient, install dependencies, and start all services.

---

## First-Time Setup (Agent-Executable)

Run these steps in order after cloning the repo. On step 8, tell the agent you want to execute the "first-time setup" and it will follow the procedure below automatically.

### Prerequisites
- Node.js >= 18 (includes npm). Verify with `node --version` and `npm --version`.

### Step-by-Step

```bash
# 1. Install all workspace dependencies from root
npm install

# 2. Create backend .env from template (copy, don't rename)
Copy-Item .env.example backend\.env

# 3. Create dashboard .env from template
Copy-Item dashboard\.env.example dashboard\.env

# 4. (Optional) Edit backend\.env and set these values:
#    - DISCORD_TOKEN=your_bot_token   (only needed if running the bot)
#    - LLM_API_KEY=your_deepseek_key  (only needed if using LLM formatting)
# Defaults work for backend + dashboard without any tokens.

# 5. Start backend (port 3001)
cd backend
npx tsx src/index.ts
# Keep this terminal running

# 6. In a second terminal, start dashboard dev server (port 5173)
cd dashboard
npx vite
# Open http://localhost:5173

# 7. (Optional) In a third terminal, start Discord bot
cd bot
npx tsx src/index.ts

# 8. Run tests (any terminal)
npx vitest run
```

**Quick start (all services at once):**
```bash
npm install
Copy-Item .env.example backend\.env
Copy-Item dashboard\.env.example dashboard\.env
npx concurrently "npm run dev:backend" "npm run dev:dashboard"
```

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point: Express + Socket.IO + simulator
│   │   ├── lib/
│   │   │   └── clock.ts          # Injectable clock (getTime() / setClock() for tests)
│   │   ├── models/
│   │   │   └── roomFixture.ts    # Canonical: 3 rooms × (2 fans + 3 lights)
│   │   ├── store/
│   │   │   ├── deviceStore.ts    # In-memory device array, accessors, seed logic
│   │   │   └── powerHistory.ts   # Rolling power snapshots, kWh integration
│   │   ├── simulator/
│   │   │   └── index.ts          # Tick engine: flips 1-3 random devices per tick
│   │   ├── alerts/
│   │   │   ├── types.ts          # Alert + EvaluateAlertsInput/Output interfaces
│   │   │   └── evaluateAlerts.ts # Pure alert evaluation (after-hours + prolonged)
│   │   ├── routes/
│   │   │   └── index.ts          # REST: /api/devices, /rooms/:room, /usage, /alerts, /health
│   │   ├── sockets/
│   │   │   └── index.ts          # Socket.IO: returns emit callbacks for store reads
│   │   └── middleware/
│   │       ├── logger.ts         # Request logger
│   │       └── errorHandler.ts   # Centralized error handler
│   ├── __tests__/                # Vitest test files
│   ├── vitest.config.ts
│   └── tsconfig.json
│
├── dashboard/
│   ├── src/
│   │   ├── main.tsx              # React entry
│   │   ├── App.tsx               # Root layout: Header, DevicePanel, PowerMeter, OfficeLayout, AlertsPanel
│   │   ├── index.css             # Tailwind + @keyframes fan-spin
│   │   ├── lib/
│   │   │   ├── socket.tsx        # SocketProvider context + useSocket() hook
│   │   │   └── types.ts          # Device, UsageData, Alert interfaces
│   │   ├── hooks/
│   │   │   ├── useDashboard.ts   # REST load + socket subscription (devices + usage)
│   │   │   └── useAlerts.ts      # REST load + socket subscription (alerts)
│   │   └── components/
│   │       ├── Header.tsx         # Title + connection badge
│   │       ├── ConnectionBadge.tsx
│   │       ├── DevicePanel.tsx    # 3x RoomSection
│   │       ├── RoomSection.tsx    # 5x DeviceCard per room
│   │       ├── DeviceCard.tsx     # Single device toggle
│   │       ├── PowerMeter.tsx     # Total + per-room power bars
│   │       ├── OfficeLayout.tsx   # SVG top-view with fan/light icons
│   │       ├── AlertsPanel.tsx    # Active + collapsible resolved alerts
│   │       └── AlertCard.tsx      # Single alert row
│   ├── vitest.config.ts
│   └── tsconfig.json
│
├── bot/
│   ├── src/
│   │   ├── index.ts              # discord.js client + command handlers
│   │   └── ...                   # Commands: !status, !room, !usage
│   ├── vitest.config.ts
│   └── tsconfig.json
│
├── docs/                         # Per-prompt documentation
├── .env.example                  # Template with all env vars (commented defaults)
├── .gitignore                    # Unanchored node_modules/, dist/, .env, coverage/
├── vitest.workspace.ts           # Vitest workspace: backend, dashboard, bot
├── package.json                  # Root: npm workspaces + concurrently scripts
└── AGENTS.md                     # ← You are here
```

---

## Architecture

```
[Simulated Device Layer] → [Backend API (Express + Socket.IO)] → [Web UI (React + Vite)]
                                                               → [Discord Bot (calls HTTP only)]
```

- **Backend**: single source of truth. In-memory device store, `setInterval` tick engine, REST + WebSocket push.
- **Dashboard**: reads from backend on mount, then subscribes to Socket.IO events for real-time updates.
- **Bot**: never imports backend code — calls `GET /api/devices`, `GET /api/rooms/:room`, `GET /api/usage` over HTTP.

---

## Locked Decisions

| Area | Decision |
|------|----------|
| Backend | Node.js + TypeScript, Express (REST), Socket.IO (real-time push), in-memory device store (no DB), setInterval-driven simulator tick engine |
| Dashboard | React + Vite + Tailwind CSS, socket.io-client, Recharts/Chart.js for any charts |
| Discord bot | discord.js v14, slash commands with legacy "!" prefix aliases, calls backend over HTTP only |
| Testing | Vitest across backend, dashboard, and bot (consistent tool, fast, works cleanly with the Vite/TS stack already picked) |
| LLM | DeepSeek called via its API — read key from `LLM_API_KEY` env. Strictly a formatting layer: rewrites already-correct numbers into friendly sentences, never generates or invents numbers. Always implement a plain-template fallback string for when the call fails or times out, so the bot never goes silent. |
| Device model | `{ id, name, type: "fan"|"light", room: "drawing"|"work1"|"work2", status: "on"|"off", powerDrawWatts, lastChanged (ISO timestamp) }` |
| Wattages | fan = 60W, light = 15W (when ON), 0 when OFF. No per-unit randomization. |
| Office hours | 09:00-17:00 (Bangladesh Standard Time, UTC+6), used for after-hours alert rule. Use injectable/overridable clock in alerts engine — never raw `new Date()`. |
| Alert rules | (a) any device ON outside office hours, (b) a room where ALL devices have been ON continuously for >2 hours (via lastChanged delta). Alerts RESOLVE automatically when the condition stops being true; emit `alertResolved` event and set `resolvedAt`. |
| REST endpoints | `GET /api/devices`, `GET /api/rooms/:room`, `GET /api/usage`, `GET /api/alerts` |
| Socket.IO events | `deviceUpdate`, `usageUpdate`, `alertTriggered`, `alertResolved` |
| Repository | Public GitHub/GitLab — never leave private by default |

---

## Device Count — Critical

**3 rooms, each with 2 fans + 3 lights.** Derive the total device count FROM `backend/src/models/roomFixture.ts` in code — do NOT hardcode "15" or "18" as a magic number anywhere (seed logic, tests, docs, bot replies). If the number changes, update the fixture only.

---

## Dummy / Sample Data Constraint

Whenever placeholder personal data is needed (sample "team member" or "contact" entries in docs, seed data, or test fixtures), use ONLY these two records — do not invent, modify, or add others unless explicitly asked:

```ts
{ name: "Nafisa Rahman", email: "nafisa.rahman@yahoo.com", phone: "+8801812345678" }
{ name: "Tanvir Hossain", email: "tanvir.hossain@yahoo.com", phone: "+8801912345678" }
```

This does NOT apply to device data (devices use the canonical model, seeded with realistic randomized on/off state — that's a separate concern).

---

## Engineering Process Rules

- Prioritize correctness and engineering process over speed.
- Before implementing a non-trivial component, restate understanding of the requirement in 2-3 sentences. Ask a concise clarifying question if ambiguous.
- For every significant feature, briefly give: assumptions, implementation plan, trade-offs, and how you'd validate/test it — before writing code.
- Prefer modular architecture, a clearly shared backend, and testable units over a monolithic one-shot solution.
- After finishing each prompt, restate understanding briefly before the user says "go ahead" to the next one — don't chain multiple prompts' work together without a checkpoint.
- Use only the two approved dummy records for placeholder personal data (see above).
- Do NOT use Mermaid for diagrams — describe as labeled component/flow lists.

---

## Environment Variables

| Variable | Required For | Default |
|----------|-------------|---------|
| `PORT` | Backend | 3001 |
| `CORS_ORIGIN` | Backend | `*` |
| `SIM_TICK_INTERVAL_MS` | Backend | 10000 |
| `DISCORD_TOKEN` | Bot | (none) |
| `LLM_API_KEY` | Bot | (none) |
| `VITE_API_URL` | Dashboard | `http://localhost:3001` |

The root `.env.example` has all variables listed. Copy to `backend/.env` and `dashboard/.env` (dashboard `.env` is separate because Vite only reads from project root).
