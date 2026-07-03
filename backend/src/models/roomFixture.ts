import { RoomName, DeviceType } from './device'

/** Canonical room layout — total device count is derived from this array, never hardcoded. */
export const ROOMS: {
  name: RoomName
  label: string
  devices: { type: DeviceType; count: number }[]
}[] = [
  {
    name: 'drawing',
    label: 'Drawing Room',
    devices: [
      { type: 'fan', count: 2 },
      { type: 'light', count: 3 },
    ],
  },
  {
    name: 'work1',
    label: 'Work Room 1',
    devices: [
      { type: 'fan', count: 2 },
      { type: 'light', count: 3 },
    ],
  },
  {
    name: 'work2',
    label: 'Work Room 2',
    devices: [
      { type: 'fan', count: 2 },
      { type: 'light', count: 3 },
    ],
  },
]
