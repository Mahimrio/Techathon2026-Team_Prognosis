# Codebase Audit — OfficeVolt

Generated from full scan: TypeScript compilation, tests, build, imports, env vars, dangling files, and logic review across all 3 workspaces.

**Result:** 0 errors, 0 test failures, 0 broken imports, 12 notes (low/info severity).

---

## TypeScript
No errors in any workspace (`tsc --noEmit` passes in backend, dashboard, bot).

## Tests
All 22 pass (all in backend). Dashboard and bot have zero test files.

## Build
Dashboard `vite build` passes.

## Issues

| # | Severity | File | Line | Description |
|---|----------|------|------|-------------|
| 1 | Low | `dashboard/package.json` | 16 | `recharts` declared as dependency but never imported anywhere |
| 2 | Low | `backend/src/models/roomFixture.ts` | 1 | Uses `import { RoomName, DeviceType }` instead of `import type` for type-only symbols |
| 3 | Low | `dashboard/src/hooks/useDashboard.ts` | 24-30 | REST response can overwrite a socket update during mount (minor race) |
| 4 | Low | `dashboard/src/hooks/useAlerts.ts` | 22-28 | Same race as #3 for alert state |
| 5 | Low | `.env.example` | 7-8 | `DISCORD_ALERT_CHANNEL_ID` and `BACKEND_URL` defined but undocumented in AGENTS.md and unused in code |
| 6 | Info | `backend/src/store/powerHistory.ts` | 37-39 | Backfill data is purely synthetic (by design — warms chart on load) |
| 7 | Info | `bot/src/services/llm.ts` | 1-4 | `humanize()` is a no-op stub; LLM formatting not yet wired |
| 8 | Info | `backend/.env.example` | — | Missing file; setup copies root `.env.example` instead, which works but path differs from AGENTS.md |
| 9 | Info | `docs/.gitkeep` | — | Unnecessary; `docs/` already has 6 files |
| 10 | Info | `bot`, `dashboard` | — | Zero test files outside backend |
| 11 | Info | `backend/src/store/__tests__/powerHistory.test.ts` | 56 | kWh test asserts `after >= 0` instead of `after > before` |
