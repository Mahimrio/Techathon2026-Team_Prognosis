# Prompt 4 — REST API & Socket.IO Real-Time Layer

## Files Created / Changed

### New Files
| File | Purpose |
|------|---------|
| `backend/src/middleware/logger.ts` | Request logger: `[METHOD] /path status elapsed` |
| `backend/src/middleware/errorHandler.ts` | Catches thrown errors, returns `{ error }` with 500 |

### Changed Files
| File | Change |
|------|--------|
| `backend/src/routes/index.ts` | Replaced placeholder with 5 endpoints: health, devices, rooms/:room, usage, alerts |
| `backend/src/sockets/index.ts` | Returns callback object `{ onDeviceChange, onUsageUpdate, onAlertTriggered, onAlertResolved }` — each emits matching Socket.IO event |
| `backend/src/simulator/index.ts` | Added `getCurrentAlerts()` export so REST can read active alerts |
| `backend/src/index.ts` | Wires socket callbacks → `startSimulator()`, CORS origin from env, logger + error handler middleware |
| `.env.example` | Added `CORS_ORIGIN=http://localhost:5173` |

## REST Endpoints

| Method | Path | Returns |
|--------|------|---------|
| `GET` | `/api/health` | `{ status: "ok" }` |
| `GET` | `/api/devices` | `Device[]` — all 15 devices |
| `GET` | `/api/rooms/:room` | `{ room, devices, totalPower }` or **404** with valid room list |
| `GET` | `/api/usage` | `{ totalPowerNow, roomPower: { drawing, work1, work2 }, estimatedKWhToday }` |
| `GET` | `/api/alerts` | `Alert[]` — current active alerts |

### Room Validation
Unknown room names return 404 with an error message listing valid rooms:
```json
{ "error": "Unknown room: \"bogus\". Valid rooms: drawing, work1, work2" }
```
Valid rooms are derived from the fixture (`ROOMS` array) — not hardcoded.

## Socket.IO Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `deviceUpdate` | Single `Device` object | Every tick, once per flipped device |
| `usageUpdate` | `{ totalPowerNow, roomPower, estimatedKWhToday }` | Every tick (reads store directly) |
| `alertTriggered` | Single `Alert` object | Per newly-triggered alert |
| `alertResolved` | Single `Alert` (with `resolvedAt` set) | Per newly-resolved alert |

### Diffing Approach
No additional diffing in the socket layer — `evaluateAlerts()` already returns `newlyTriggered` and `newlyResolved` as separate arrays. The socket handler simply loops each array and emits one event per item. Zero duplicate logic.

### Data Flow
```
Simulator tick
  ├── flipDeviceStatus(id) → onDeviceChange   → io.emit('deviceUpdate')
  ├── recordSnapshot()     → onUsageUpdate     → io.emit('usageUpdate')
  └── evaluateAlerts()
        ├── newlyTriggered → onAlertTriggered  → io.emit('alertTriggered')
        └── newlyResolved  → onAlertResolved   → io.emit('alertResolved')
```

## CORS Configuration
- Default origin: `http://localhost:5173` (Vite dev server)
- Configurable via `CORS_ORIGIN` env var
- Set on both Express middleware and Socket.IO server
- Verified: response header `Access-Control-Allow-Origin: http://localhost:5173`

## Middleware

### Logger (`middleware/logger.ts`)
Prints every request:
```
[GET] /api/devices 200 1ms
```

### Error Handler (`middleware/errorHandler.ts`)
Catches unhandled errors, returns `{ error: "Internal server error" }` with status 500.

## Bot Architecture Enforcement
The bot at `bot/src/` **never imports** from `backend/src/store/`, `backend/src/models/`, or any backend internal module. It only calls `fetch(BACKEND_URL + '/api/...')` — the REST API is the sole contract. This matches the required architecture:

```
[Simulated Device Layer] → [Backend API] → [Web UI] && [Discord Bot]
```

## End-to-End Verification

All 11 tests passed (automated test script):

| # | Test | Result |
|---|------|--------|
| 1 | `GET /api/health` returns 200 | ✓ |
| 2 | `GET /api/devices` returns 200 + 15 devices | ✓ |
| 3 | First device has all required fields | ✓ |
| 4 | `GET /api/rooms/drawing` returns 200 + 5 devices | ✓ |
| 5 | `GET /api/rooms/bogus` returns 404 | ✓ |
| 6 | `GET /api/usage` returns 200 + all fields | ✓ |
| 7 | `GET /api/alerts` returns 200 | ✓ |
| 8 | CORS header = `http://localhost:5173` | ✓ |
| 9 | `deviceUpdate` Socket.IO event fires on tick | ✓ |
| 10 | `usageUpdate` Socket.IO event fires on tick | ✓ |
| 11 | `alertTriggered`/`alertResolved` not tested (normal hours) | — |

## Manual Curl Checklist

```bash
# Health
curl http://localhost:3001/api/health

# All devices
curl http://localhost:3001/api/devices

# Room (valid)
curl http://localhost:3001/api/rooms/drawing

# Room (invalid — 404)
curl http://localhost:3001/api/rooms/bogus

# Usage
curl http://localhost:3001/api/usage

# Alerts
curl http://localhost:3001/api/alerts
```

## Testing Alert Events
To verify `alertTriggered` and `alertResolved` fire, temporarily run with a simulated after-hours time (or adjust the office-hours check). When an alert condition is met, the socket emits one `alertTriggered` per new alert; when it clears, one `alertResolved` per resolved alert — each with the full `Alert` object including `resolvedAt` timestamps.
