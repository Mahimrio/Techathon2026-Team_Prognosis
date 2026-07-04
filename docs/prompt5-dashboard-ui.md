# Prompt 5 — Core Frontend UI

## Files Created / Changed

### New Files
| File | Purpose |
|------|---------|
| `dashboard/src/lib/types.ts` | Shared TypeScript types: `Device`, `UsageData`, `DeviceStatus`, etc. |
| `dashboard/src/lib/socket.tsx` | `SocketProvider` context + `useSocket()` hook — singleton socket instance |
| `dashboard/src/hooks/useDashboard.ts` | Main state hook: REST initial load + socket subscriptions |
| `dashboard/src/components/Header.tsx` | Title bar with app name + connection badge |
| `dashboard/src/components/ConnectionBadge.tsx` | Green/red dot with "Live" / "Disconnected" text |
| `dashboard/src/components/DeviceCard.tsx` | Single device card: icon, name, wattage, ON/OFF badge |
| `dashboard/src/components/RoomSection.tsx` | Room group: label, ON count, grid of DeviceCards |
| `dashboard/src/components/DevicePanel.tsx` | 3-column grid of RoomSections |
| `dashboard/src/components/PowerMeter.tsx` | Total wattage (big number) + per-room sub-meters with progress bars |
| `dashboard/src/vite-env.d.ts` | Vite client type declarations for `import.meta.env` |

### Changed Files
| File | Change |
|------|--------|
| `dashboard/src/App.tsx` | Replaced placeholder with full dashboard layout |
| `dashboard/src/main.tsx` | Unchanged |
| `dashboard/src/index.css` | Unchanged (Tailwind directives only) |
| `dashboard/src/lib/socket.ts` | **Deleted** — replaced by `socket.tsx` (now a React context) |

## Component Tree

```
App
└── SocketProvider                     ← single io() connection, never per-component
    └── DashboardContent
        ├── Header                     ← "OfficeVolt" title + "Real-time office power monitor" subtitle
        │   └── ConnectionBadge        ← ● Live (green) / ● Disconnected (red)
        ├── DevicePanel                ← 3-column grid of rooms
        │   ├── RoomSection ×3         ← Drawing Room / Work Room 1 / Work Room 2
        │   │   ├── header: "Drawing Room  3/5 ON"
        │   │   └── DeviceCard ×5      ← type icon + name + wattage + ON/OFF badge
        └── PowerMeter
            ├── TotalPower             ← 5xl bold number + "~X.XX kWh today"
            └── RoomPower ×3           ← per-room card: watts + progress bar + percentage
```

## State Management

| Layer | File | Role |
|-------|------|------|
| **Context** | `lib/socket.tsx` | Creates one `io(BACKEND_URL)`, exposes `{ socket, connected }` via `SocketProvider` + `useSocket()` |
| **Hook** | `hooks/useDashboard.ts` | Fetches initial state from `GET /api/devices` + `GET /api/usage`; subscribes to `deviceUpdate` / `usageUpdate` socket events |
| **Loading** | — | `loading = true` until first REST response or socket event arrives → shows "Connecting..." |
| **Connection** | — | Tracks `socket.connected` + `connect` / `disconnect` events → drives `ConnectionBadge` |

## Data Flow

```
Initial mount:
  useDashboard → fetch(GET /api/devices) + fetch(GET /api/usage)
               → setDevices([]) + setUsage({...})
               → loading = false

Every simulator tick:
  socket 'deviceUpdate' → setDevices(prev => replace one device by id)
  socket 'usageUpdate'  → setUsage(data)

Connection changes:
  socket 'connect'    → setConnected(true)
  socket 'disconnect' → setConnected(false)
```

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Socket instance | React context (`SocketProvider`) | Single connection — children consume via `useContext`; no duplicate `io()` calls |
| Initial load | REST + socket fallback | REST gives instant data on page load; socket keeps it fresh |
| Device updates | Replace by `id` in array | O(1) find via `map`, no full list re-render |
| Loading state | Boolean until first data | Prevents flash of empty panel; shows "Connecting..." spinner |
| Connection state | Socket events → React state | Green/red badge updates live; projector-friendly feedback |
| Device cards | Single `DeviceCard` × `devices.map()` | One reusable component, not 15 hand-written instances |
| Styling | Tailwind dark theme (`bg-gray-900`) | High contrast for projector demos; green/gray for on/off |

## Visual Design (Projector-Ready)

- **Background**: Dark gray (`bg-gray-900`)
- **ON devices**: Green border + green badge + green text (`border-green-700`, `bg-green-900/30`)
- **OFF devices**: Gray border + gray badge (`border-gray-700`, `bg-gray-800/50`)
- **Power total**: 5xl bold white text with glow
- **Room power bars**: Blue progress bars with percentage label
- **Layout**: Max-width 6xl container, responsive grid (1 col mobile → 3 col desktop)
- **Connection badge**: Glowing dot (`shadow-[0_0_8px_rgba(...)]`)

## File Structure

```
dashboard/src/
├── lib/
│   ├── types.ts            ← Device, UsageData interfaces
│   └── socket.tsx          ← SocketProvider + useSocket()
├── hooks/
│   └── useDashboard.ts     ← devices, usage, loading state
├── components/
│   ├── Header.tsx
│   ├── ConnectionBadge.tsx
│   ├── DeviceCard.tsx
│   ├── RoomSection.tsx
│   ├── DevicePanel.tsx
│   └── PowerMeter.tsx
├── App.tsx
├── main.tsx
├── index.css
└── vite-env.d.ts
```

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | No errors |
| `npx vite build` | 68 modules, production bundle (190KB JS, 9KB CSS) |
| Backend + dashboard via `npm run dev` | Real-time updates visible at `http://localhost:5173` |
