# Prompt 2 — Simulated Device Layer

## Files Created / Changed

### New Files
| File | Purpose |
|------|---------|
| `backend/src/lib/clock.ts` | Injectable `Clock` type + `getClock()`/`setClock()` for testable time |
| `backend/src/store/deviceStore.ts` | Seeds 15 devices from `roomFixture`, exports accessors + `flipDeviceStatus()` |
| `backend/src/store/powerHistory.ts` | Backfills midnight→now synthetic snapshots, trapezoidal kWh integration |
| `backend/src/store/__tests__/deviceStore.test.ts` | 7 tests — seed count, room/type distribution, power calc, immutability |
| `backend/src/store/__tests__/powerHistory.test.ts` | 3 tests — non-zero kWh after boot, upper bound, snapshot recording |

### Changed Files
| File | Change |
|------|--------|
| `backend/src/models/device.ts` | Added `WATTAGES` constant + `computePowerDraw()` helper |
| `backend/src/simulator/index.ts` | Replaced placeholder with `startSimulator()` / `stopSimulator()` |
| `backend/src/index.ts` | Added `startSimulator()` call on boot |

## Architecture

```
┌─────────────────────────────┐
│      roomFixture.ts         │  ← 3 rooms × (2 fans + 3 lights) — canonical fixture
└─────┬───────────────────────┘
      │ imported by
      ▼
┌─────────────────────────────┐
│      deviceStore.ts         │  ← singleton, seeds on import
│  - getAllDevices()          │     ~40% devices randomly ON at boot
│  - getDevicesByRoom(room)   │     lastChanged spread over last 4h
│  - getTotalPowerNow()       │
│  - getRoomPower(room)       │
│  - flipDeviceStatus(id)     │  ← mutation for simulator
│  - resetAndReseed()         │  ← test escape hatch
└─────┬───────────────────────┘
      │ consumed by
      ├──────────────────────────────┐
      │                              │
      ▼                              ▼
┌──────────────┐           ┌──────────────────┐
│ powerHistory │           │   simulator/     │
│  - backfill  │           │  startSimulator  │
│  - record()  │           │  flips 1-3       │
│  - kWhToday  │           │  devices/tick    │
└──────────────┘           └──────────────────┘
```

## Tick Engine
- `setInterval` every `SIM_TICK_INTERVAL_MS` (default 10s)
- Each tick: randomly picks 1-3 unique devices, flips their `status` (on↔off)
- Updates `lastChanged` to now, recalculates `powerDrawWatts`
- Records a power snapshot into `powerHistory`

## Power History Backfill
- On boot, generates synthetic snapshots at 5-minute intervals from **midnight today → now**
- Each snapshot: `totalWatts` = random 10–80% of theoretical max (derived from fixture)
- `getEstimatedKWhToday()`: trapezoidal integration over today's snapshots → kWh
- **Why backfill?** Without it, `estimatedKWhToday` reads ~0 for the first minutes of any demo/judging session

## Injectable Clock (`src/lib/clock.ts`)
- Default: `() => new Date()` (real clock)
- Tests call `setClock(() => new Date('2026-07-04T14:00:00Z'))` to pin time
- Both `deviceStore` and `powerHistory` use `getClock()` — reseeding re-runs with pinned time

## Tests (10/10 passing)
| Test | What it proves |
|------|----------------|
| Seed count = 15 (from fixture) | No magic number, fixture-derived |
| Each room has 5 devices | Room distribution correct |
| Type counts per room | Fan/light split matches fixture |
| powerDrawWatts correct | 60W/15W when ON, 0 when OFF |
| getTotalPowerNow = sum | Aggregate accessor consistent |
| getRoomPower = sum | Per-room accessor consistent |
| Immutable accessor | `getAllDevices()` returns copies |
| Non-zero kWh after boot | Backfill works, demo-ready |
| kWh < theoretical max | Integration bounds sane |
| Snapshot recording | recordSnapshot updates kWh |

## How REST / Socket.IO Will Consume
Both layers import the same singleton accessors from `deviceStore` and `powerHistory`:
- **REST handlers** call `getAllDevices()`, `getTotalPowerNow()`, etc. directly
- **Socket.IO** calls the same accessors to emit `deviceUpdate`, `usageUpdate`
- **Simulator** mutates via `flipDeviceStatus()` + `recordSnapshot()`, then fires callbacks for Socket.IO to emit
- No state duplication — module-level arrays are the single source of truth
