import type { Device } from '../lib/types'

const ICONS: Record<string, string> = { fan: '⟳', light: '💡' }

interface DeviceCardProps {
  device: Device
}

const DeviceCard = ({ device }: DeviceCardProps) => {
  const isOn = device.status === 'on'

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        isOn
          ? 'border-green-700 bg-green-900/30'
          : 'border-gray-700 bg-gray-800/50'
      }`}
    >
      <span className="text-xl">{ICONS[device.type]}</span>

      <div className="flex-1 min-w-0">
        <p className={`truncate text-sm font-medium ${isOn ? 'text-green-300' : 'text-gray-400'}`}>
          {device.name}
        </p>
        <p className="text-xs text-gray-500">{device.powerDrawWatts}W</p>
      </div>

      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
          isOn
            ? 'bg-green-700 text-green-100'
            : 'bg-gray-700 text-gray-400'
        }`}
      >
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  )
}

export default DeviceCard
