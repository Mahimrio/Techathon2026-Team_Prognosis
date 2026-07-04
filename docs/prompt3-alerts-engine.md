# Prompt 3 — Alerts Engine

## Files Created / Changed

### New Files
| File | Purpose |
|------|---------|
| `backend/src/alerts/types.ts` | `Alert` interface, `EvaluateAlertsInput` / `EvaluateAlertsOutput` types |
| `backend/src/alerts/evaluateAlerts.ts` | Pure `evaluateAlerts()` function — both trigger rules + resolve logic |
| `backend/src/alerts/__tests__/evaluateAlerts.test.ts` | 12 tests: after-hours trigger/resolve, prolonged trigger/resolve, dedup, edge cases |

### Changed Files
| File | Change |
|------|--------|
| `backend/src/alerts/index.ts` | Replaced placeholder with re-export of `evaluateAlerts` + types |
| `backend/src/simulator/index.ts` | Added `onAlertTriggered`/`onAlertResolved` callbacks, calls `evaluateAlerts()` every tick |

## Architecture

```
                    ┌──────────────────────────┐
                    │     simulator tick        │
                    │  (every 5-15s via env)    │
                    └──────┬───────────────────┘
                           │ calls
                           ▼
              ┌──────────────────────────┐
              │    evaluateAlerts({      │
              │      devices,            │  ← pure function
              │      previousAlerts,     │  ← dedup via deterministic IDs
              │      now                 │  ← injectable clock
              │    })                    │
              └──────┬───────────────────┘
                     │ returns
          ┌──────────┼──────────┐
          ▼          ▼          ▼
   activeAlerts  newlyTriggered  newlyResolved
   (GET /api)    (→ alertTriggered)  (→ alertResolved)
```

## Alert Rules

### 1. After-hours
- **Condition**: Any device `status === "on"` outside 09:00-17:00 BDT (UTC+6)
- **Scope**: One alert per affected room
- **Message**: `"{Room label}: {N} device(s) are ON outside office hours (09:00-17:00 BDT)"`
- **Resolves when**: All devices in that room turn OFF during after-hours, OR the clock enters office hours

### 2. Prolonged room usage
- **Condition**: ALL devices in a room have been continuously ON with `lastChanged` > 2 hours ago
- **Scope**: One alert per room
- **Message**: `"{Room label}: all {N} devices have been on for over 2 hours"`
- **Resolves when**: Any device in the room turns OFF, OR any device's `lastChanged` updates (indicating a recent toggle)

## Alert Shape
```typescript
interface Alert {
  id: string                    // "after-hours-drawing" / "prolonged-room-usage-work1"
  type: 'after-hours' | 'prolonged-room-usage'
  message: string
  room: string
  deviceIds: string[]
  triggeredAt: string           // ISO timestamp (preserved across ticks)
  resolvedAt: string | null     // null while active, ISO when resolved
}
```

## Key Design Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dedup strategy | Deterministic alert IDs (`{type}-{room}`) | No extra state needed; just compare ID sets |
| Resolve detection | `desiredAlerts` set vs `previousAlerts` set diff | Clean set algebra; any alert ID missing from desired = resolved |
| `triggeredAt` preservation | Copied from previous alert onto new desired alert | Dashboard shows original trigger time, not refreshed every tick |
| Device identity in message | Uses `roomFixture` label | Message always reads naturally, not from internal room name |
| `now` injection | Parameter on `evaluateAlerts()` | Engine is pure — no `new Date()` calls; testable without waiting for real time |

## Tests (12 alert-specific tests, all passing)

| Test | Type | What it proves |
|------|------|----------------|
| Triggers when devices ON after hours | after-hours | Correct detection at `2026-07-05T14:00:00Z` (20:00 BDT) |
| No trigger during office hours | after-hours | `2026-07-05T08:00:00Z` (14:00 BDT) produces 0 alerts |
| No trigger when all OFF after hours | after-hours | OFF devices + after-hours time = no alert |
| Resolves when devices turn OFF | after-hours | Trigger → turn all OFF → resolvedAt set |
| No duplicate re-triggering | after-hours | Same state + same previousAlerts = 0 newlyTriggered |
| Triggers when all ON >2h | prolonged | 3 rooms × 5 devices, all ON with `lastChanged` 3h ago = 3 alerts |
| No trigger when one device OFF | prolonged | 1 device OFF breaks the "all ON" condition |
| No trigger when <2h | prolonged | `lastChanged` 30 min ago = no prolonged alert |
| Resolves when device turns OFF | prolonged | Trigger → turn one OFF → resolved |
| Resolves when devices recently toggled | prolonged | Clock advanced but `lastChanged` updated = condition broken |
| Preserves original `triggeredAt` | prolonged | Persistent alert keeps first trigger timestamp |
| No duplicate newlyResolved across calls | mixed | Already-resolved alerts excluded from future resolution |

## Mock Timestamp Approach
The `evaluateAlerts` function takes `now: Date` as a parameter — it never calls `new Date()`. Tests pin arbitrary times:

```typescript
// Test after-hours at 20:00 BDT without waiting for real 20:00
const now = new Date('2026-07-05T14:00:00.000Z') // 20:00 BDT
const result = evaluateAlerts({ devices, previousAlerts: [], now })
```

The entire alert test suite (12 tests) runs in <10ms because no timers or waits are involved.

## Simulator Wiring (`simulator/index.ts`)
- New callbacks: `onAlertTriggered(alert)` and `onAlertResolved(alert)`
- Each tick after device flips + power snapshot:
  1. Call `evaluateAlerts()` with `getClock()()`, current devices, and `currentAlerts` state
  2. Update `currentAlerts = activeAlerts`
  3. Fire `onAlertTriggered` for each `newlyTriggered`
  4. Fire `onAlertResolved` for each `newlyResolved`
- Socket.IO layer will hook these callbacks to emit `alertTriggered` / `alertResolved` events
