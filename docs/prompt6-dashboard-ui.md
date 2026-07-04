# Prompt 6 — Frontend UI Completion (Alerts Panel + Office Layout SVG)

**Status** — Completed and pushed to `feat/dashboard-ui`. Build passes (72 modules).

---

## Files Created / Modified

### New Files
| File | Purpose |
|------|---------|
| `dashboard/src/components/AlertCard.tsx` | Single alert row: icon, title, description, room tag, timestamp, resolved badge. Collapsible resolved section support. |
| `dashboard/src/components/AlertsPanel.tsx` | Active alerts list (always visible) + collapsible resolved alerts section. Subscribes to `alertTriggered`/`alertResolved` via `useAlerts`. |
| `dashboard/src/components/OfficeLayout.tsx` | Hand-crafted SVG top-view of 3 rooms with walls, windows, door, furniture (sofa, armchair, coffee table, plants, desks, chairs), and 15 device icons positioned per room. Fans show a spinning-blade animation when ON; lights show a glow halo. |
| `dashboard/src/hooks/useAlerts.ts` | REST fetch on mount (`GET /api/alerts`), subscribes to `alertTriggered` / `alertResolved`, merges new alerts and removes resolved ones from local state. |

### Modified Files
| File | Change |
|------|--------|
| `dashboard/src/App.tsx` | Imports `OfficeLayout` and `AlertsPanel`, wires `<OfficeLayout devices={devices} />` above `<AlertsPanel />`. |
| `dashboard/src/index.css` | Added `@keyframes fan-spin` + `.fan-spin` class for SVG blade rotation. |
| `dashboard/src/lib/types.ts` | Added `Alert` interface matching backend's `Alert` type. |

---

## Architecture Decisions

### Alerts Panel
- **useAlerts hook** — analogous to `useDashboard`, fetches on mount then subscribes to socket events. On `alertTriggered`, prepends alert to active list. On `alertResolved`, moves alert from active → resolved (sets `resolvedAt`) by matching `alert.id`. Never refetches the full list.
- **No auto-dismiss timer** — resolved alerts stay visible in the collapsed section until page refresh. Kept intentionally simple.

### Office Layout SVG
- **SVG + CSS animations** rather than re-rendering per tick. `use` elements reference `<g id="fan-on">` or `<g id="fan-off">` etc. based on device state. The `.fan-spin` CSS class is applied to the SVG `<g>` via the `className` attribute — Vite/SVG handles this correctly.
- **Device positions hardcoded** per room index (room → [fan1, fan2, light1, light2, light3]) in `DEVICE_POS`. Derived from the filtered device array rather than the full list, so if device count ever changes, only the position array needs updating.
- **Furniture is decorative** — no data binding, just static shapes. Keeps the code simple and avoids re-rendering overhead.

---

## Dev Notes
- **Fan spin animation**: `transform-origin: center` is critical. The SVG `<g>` wrapping the fan blades has the class, and the origin defaults to `(0,0)` which is the center of the fan circle (since all fan coords are relative to the `use` x/y).
- **Light glow**: implemented as a semi-transparent yellow circle behind the light symbol, purely in SVG (no CSS). The `id="light-on"` def has a `<circle r="12" fill="#fbbf24" opacity="0.25" />`.
- **Alerts** use the `Alert` interface from `types.ts` which was added in this prompt.
- Build: 72 modules, 200 KB JS, 11 KB CSS.
