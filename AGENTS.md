# OfficeVolt — AGENTS.md

Below is the full project context and engineering rules. Read this first before any task.

---

## Project Summary

A small office has 3 rooms (Drawing Room, Work Room 1, Work Room 2), each with 2 fans + 3 lights (fan=60W, light=15W when ON). No real hardware exists — device state is simulated. The system must expose that simulated state through:

1. A real-time web dashboard (live device grid, power meter, alerts panel)
2. A Discord bot (!status, !room <name>, !usage — LLM-humanized replies)

Both must read from ONE shared backend (single source of truth) — the bot calls the backend's HTTP/WS API, it never reads the device store directly.

Architecture: `[Simulated Device Layer] → [Backend API] → [Web UI] && [Discord Bot]`

## Device Count — Critical

The office setup is fixed: **3 rooms, each with 2 fans + 3 lights**. Derive the total device count FROM this room/device fixture array in code — do not hardcode "15" or "18" as a magic number anywhere (seed logic, tests, docs, bot replies). The official problem statement is internally inconsistent ("15 devices" on one page, "18 devices" on another). Building from the fixture means whichever number is correct, we only ever change the fixture, not the architecture. If the confirmed number changes later, update the fixture only.

## Engineering Process Rules

- Prioritize correctness and engineering process over speed.
- Before implementing a non-trivial component, restate understanding of the requirement in 2-3 sentences.
- If a requirement is ambiguous or has multiple reasonable approaches, ask a concise clarifying question instead of guessing — but don't stall on things already decided.
- For every significant feature, briefly give: assumptions, implementation plan, trade-offs, and how you'd validate/test it — before writing code.
- For any hardware/wiring content, explain it with pin-mapping tables, connection lists, and electrical reasoning — never just prose.
- Do NOT generate or export a complete Wokwi/Tinkercad project JSON or simulator file. Give enough detail (components, pin map, connections) to build the schematic manually.
- Do NOT use Mermaid for any diagram — describe diagrams as a labeled component/flow list that can be drawn manually or in draw.io.
- Prefer modular architecture, a clearly shared backend, and testable units over a monolithic one-shot solution. Add brief comments explaining *why*, not just what.
- After finishing each prompt, restate understanding briefly before the user says "go ahead" to the next one — don't chain multiple prompts' work together without a checkpoint.

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
| Office hours | 09:00-17:00 (Bangladesh Standard Time), used for the after-hours alert rule. Use an injectable/overridable clock function in the alerts engine (not a hardcoded `new Date()` call) so tests can pin a fixed "now". |
| Alert rules | (a) any device ON outside office hours, (b) a room where ALL its devices have been continuously ON for >2 hours (via lastChanged delta). Alerts must also RESOLVE — when the triggering condition stops being true, emit `alertResolved` event / mark the alert resolved with a `resolvedAt` timestamp. |
| REST endpoints | `GET /api/devices`, `GET /api/rooms/:room`, `GET /api/usage`, `GET /api/alerts` |
| Socket.IO events | `deviceUpdate`, `usageUpdate`, `alertTriggered`, `alertResolved` |
| Repository | Must be a PUBLIC GitHub or GitLab repository (hard submission requirement) — don't leave it private by default when scaffolding |

## Dummy / Sample Data Constraint

Whenever placeholder personal data is needed (sample "team member" or "contact" entries in docs, seed data, or test fixtures), use ONLY these two records — do not invent, modify, or add others unless explicitly asked:

```ts
{ name: "Nafisa Rahman", email: "nafisa.rahman@yahoo.com", phone: "+8801812345678" }
{ name: "Tanvir Hossain", email: "tanvir.hossain@yahoo.com", phone: "+8801912345678" }
```

This does NOT apply to device data (devices use the canonical model, seeded with realistic randomized on/off state — that's a separate concern).
