import type { Device } from '../lib/types'

/* ── Hardcoded positions: [fan1, fan2, light1, light2, light3] per room ── */
const DEVICE_POS: Record<string, { x: number; y: number }[]> = {
  drawing: [
    { x: 135, y: 210 },
    { x: 220, y: 320 },
    { x: 100, y: 300 },
    { x: 155, y: 150 },
    { x: 230, y: 190 },
  ],
  work1: [
    { x: 420, y: 180 },
    { x: 500, y: 340 },
    { x: 380, y: 290 },
    { x: 460, y: 130 },
    { x: 540, y: 230 },
  ],
  work2: [
    { x: 700, y: 180 },
    { x: 780, y: 340 },
    { x: 660, y: 290 },
    { x: 740, y: 130 },
    { x: 820, y: 230 },
  ],
}

interface OfficeLayoutProps {
  devices: Device[]
}

const OfficeLayout = ({ devices }: OfficeLayoutProps) => {
  /* ── Map each device to its visual position ── */
  const positioned: { device: Device; x: number; y: number }[] = []
  for (const room of ['drawing', 'work1', 'work2'] as const) {
    const roomDevices = devices.filter((d) => d.room === room)
    const pos = DEVICE_POS[room]
    roomDevices.forEach((device, i) => {
      if (pos[i]) positioned.push({ device, x: pos[i].x, y: pos[i].y })
    })
  }

  return (
    <svg viewBox="0 0 900 550" className="w-full rounded-xl border border-gray-700 bg-gray-800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* ── Fan symbol (2-blade Y-shape for simplicity) ── */}
        <g id="fan-off">
          <circle cx="0" cy="0" r="10" fill="#4b5563" stroke="#6b7280" strokeWidth="1" />
          <ellipse cx="0" cy="-14" rx="5" ry="12" fill="#6b7280" />
          <ellipse cx="-10" cy="8" rx="12" ry="5" fill="#6b7280" transform="rotate(-30)" />
          <ellipse cx="10" cy="8" rx="12" ry="5" fill="#6b7280" transform="rotate(30)" />
          <circle cx="0" cy="0" r="3" fill="#9ca3af" />
        </g>

        <g id="fan-on">
          <circle cx="0" cy="0" r="10" fill="#374151" stroke="#3b82f6" strokeWidth="1.5" />
          <g className="fan-spin">
            <ellipse cx="0" cy="-14" rx="5" ry="12" fill="#60a5fa" />
            <ellipse cx="-10" cy="8" rx="12" ry="5" fill="#60a5fa" transform="rotate(-30)" />
            <ellipse cx="10" cy="8" rx="12" ry="5" fill="#60a5fa" transform="rotate(30)" />
          </g>
          <circle cx="0" cy="0" r="3" fill="#93c5fd" />
        </g>

        {/* ── Light symbol ── */}
        <g id="light-off">
          <circle cx="0" cy="0" r="7" fill="#4b5563" stroke="#6b7280" strokeWidth="1" />
          <line x1="0" y1="-11" x2="0" y2="-15" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="11" x2="0" y2="15" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="-11" y1="0" x2="-15" y2="0" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11" y1="0" x2="15" y2="0" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="-8" y1="-8" x2="-11" y2="-11" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="-8" x2="11" y2="-11" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="-8" y1="8" x2="-11" y2="11" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="8" x2="11" y2="11" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        <g id="light-on">
          <circle cx="0" cy="0" r="12" fill="#fbbf24" opacity="0.25" />
          <circle cx="0" cy="0" r="7" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
          <line x1="0" y1="-11" x2="0" y2="-15" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="11" x2="0" y2="15" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="-11" y1="0" x2="-15" y2="0" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="11" y1="0" x2="15" y2="0" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="-8" y1="-8" x2="-11" y2="-11" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="-8" x2="11" y2="-11" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="-8" y1="8" x2="-11" y2="11" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="8" x2="11" y2="11" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </g>
      </defs>

      {/* ── Background / floor ── */}
      <rect x="0" y="0" width="900" height="550" fill="#1f2937" rx="8" />

      {/* ── Top wall (with window cutouts) ── */}
      <rect x="20" y="20" width="860" height="16" fill="#374151" rx="2" />

      {/* Windows */}
      <rect x="40" y="16" width="230" height="18" fill="#7dd3fc" opacity="0.3" rx="2" />
      <rect x="330" y="16" width="230" height="18" fill="#7dd3fc" opacity="0.3" rx="2" />
      <rect x="630" y="16" width="230" height="18" fill="#7dd3fc" opacity="0.3" rx="2" />

      {/* ── Room dividers (vertical walls) ── */}
      <line x1="310" y1="36" x2="310" y2="430" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
      <line x1="590" y1="36" x2="590" y2="430" stroke="#374151" strokeWidth="4" strokeLinecap="round" />

      {/* ── Bottom wall (with door gap) ── */}
      <line x1="20" y1="430" x2="400" y2="430" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
      <line x1="500" y1="430" x2="880" y2="430" stroke="#374151" strokeWidth="4" strokeLinecap="round" />

      {/* ── Outer walls ── */}
      <rect x="20" y="20" width="860" height="490" fill="none" stroke="#374151" strokeWidth="4" rx="4" />

      {/* ── Entry door ── */}
      <rect x="400" y="430" width="100" height="75" fill="none" stroke="#6b7280" strokeWidth="2" rx="2" strokeDasharray="4,2" />
      <rect x="435" y="465" width="30" height="6" fill="#6b7280" rx="2" />
      <text x="470" y="480" fontSize="10" fill="#9ca3af" textAnchor="end">ENTRY</text>

      {/* ── Room backgrounds ── */}
      <rect x="24" y="40" width="283" height="387" fill="#111827" opacity="0.4" rx="2" />
      <rect x="314" y="40" width="273" height="387" fill="#111827" opacity="0.4" rx="2" />
      <rect x="594" y="40" width="283" height="387" fill="#111827" opacity="0.4" rx="2" />

      {/* ── Room labels ── */}
      <text x="165" y="70" fontSize="13" fontWeight="bold" fill="#e5e7eb" textAnchor="middle">Drawing Room</text>
      <text x="450" y="70" fontSize="13" fontWeight="bold" fill="#e5e7eb" textAnchor="middle">Work Room 1</text>
      <text x="735" y="70" fontSize="13" fontWeight="bold" fill="#e5e7eb" textAnchor="middle">Work Room 2</text>

      {/* ══════════════════════════════════════════════════════════════════
         DRAWING ROOM — furniture
         ══════════════════════════════════════════════════════════════════ */}
      {/* Sofa (left wall) */}
      <rect x="40" y="280" width="50" height="110" fill="#374151" rx="4" />
      <rect x="44" y="284" width="42" height="12" fill="#4b5563" rx="2" />
      <rect x="44" y="304" width="42" height="80" fill="#4b5563" rx="2" />
      {/* Armchair */}
      <ellipse cx="120" cy="390" rx="22" ry="18" fill="#374151" />
      <ellipse cx="120" cy="385" rx="16" ry="12" fill="#4b5563" />
      {/* Coffee table */}
      <ellipse cx="170" cy="280" rx="28" ry="12" fill="#4b5563" />
      {/* Plants */}
      <circle cx="250" cy="100" r="14" fill="#374151" />
      <circle cx="250" cy="100" r="8" fill="#065f46" />
      <circle cx="250" cy="400" r="14" fill="#374151" />
      <circle cx="250" cy="400" r="8" fill="#065f46" />

      {/* ══════════════════════════════════════════════════════════════════
         WORK ROOM 1 — furniture
         ══════════════════════════════════════════════════════════════════ */}
      {/* Desk row 1 */}
      <rect x="340" y="240" width="70" height="36" fill="#374151" rx="3" />
      <rect x="345" y="244" width="60" height="28" fill="#4b5563" rx="2" />
      <rect x="350" y="286" width="18" height="14" fill="#374151" rx="3" /> {/* Chair */}
      {/* Desk row 2 */}
      <rect x="430" y="340" width="70" height="36" fill="#374151" rx="3" />
      <rect x="435" y="344" width="60" height="28" fill="#4b5563" rx="2" />
      <rect x="440" y="386" width="18" height="14" fill="#374151" rx="3" /> {/* Chair */}

      {/* ══════════════════════════════════════════════════════════════════
         WORK ROOM 2 — furniture
         ══════════════════════════════════════════════════════════════════ */}
      {/* Desk row 1 */}
      <rect x="620" y="240" width="70" height="36" fill="#374151" rx="3" />
      <rect x="625" y="244" width="60" height="28" fill="#4b5563" rx="2" />
      <rect x="630" y="286" width="18" height="14" fill="#374151" rx="3" /> {/* Chair */}
      {/* Desk row 2 */}
      <rect x="710" y="340" width="70" height="36" fill="#374151" rx="3" />
      <rect x="715" y="344" width="60" height="28" fill="#4b5563" rx="2" />
      <rect x="720" y="386" width="18" height="14" fill="#374151" rx="3" /> {/* Chair */}

      {/* ══════════════════════════════════════════════════════════════════
         DEVICES — one SVG use per device
         ══════════════════════════════════════════════════════════════════ */}
      {positioned.map(({ device, x, y }) => {
        const isOn = device.status === 'on'
        const isFan = device.type === 'fan'
        const symbolId = isFan ? (isOn ? 'fan-on' : 'fan-off') : (isOn ? 'light-on' : 'light-off')

        return (
          <g key={device.id}>
            <use href={`#${symbolId}`} x={x} y={y} />
            <text x={x} y={y + 22} fontSize="8" fill="#9ca3af" textAnchor="middle">
              {isFan ? 'Fan' : 'Light'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default OfficeLayout
