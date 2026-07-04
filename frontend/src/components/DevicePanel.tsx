import type { Device, RoomName } from '../lib/types'
import RoomSection from './RoomSection'

const ROOM_CONFIG: { key: RoomName; label: string }[] = [
  { key: 'drawing', label: 'Drawing Room' },
  { key: 'work1', label: 'Work Room 1' },
  { key: 'work2', label: 'Work Room 2' },
]

interface DevicePanelProps {
  devices: Device[]
}

const DevicePanel = ({ devices }: DevicePanelProps) => {
  const grouped = (room: RoomName) => devices.filter((d) => d.room === room)

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-white">Devices</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ROOM_CONFIG.map((room) => (
          <RoomSection
            key={room.key}
            label={room.label}
            devices={grouped(room.key)}
          />
        ))}
      </div>
    </section>
  )
}

export default DevicePanel
