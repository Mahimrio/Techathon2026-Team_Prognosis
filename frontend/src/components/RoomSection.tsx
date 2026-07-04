import type { Device } from '../lib/types'
import DeviceCard from './DeviceCard'

interface RoomSectionProps {
  label: string
  devices: Device[]
}

const RoomSection = ({ label, devices }: RoomSectionProps) => {
  if (devices.length === 0) return null

  const onCount = devices.filter((d) => d.status === 'on').length

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{label}</h3>
        <span className="text-sm text-gray-400">
          {onCount}/{devices.length} ON
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {devices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  )
}

export default RoomSection
