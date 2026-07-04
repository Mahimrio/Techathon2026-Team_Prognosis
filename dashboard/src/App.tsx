import { SocketProvider, useSocket } from './lib/socket'
import { useDashboard } from './hooks/useDashboard'
import Header from './components/Header'
import DevicePanel from './components/DevicePanel'
import PowerMeter from './components/PowerMeter'
import AlertsPanel from './components/AlertsPanel'
import OfficeLayout from './components/OfficeLayout'

const DashboardContent = () => {
  const { connected } = useSocket()
  const { devices, usage, loading } = useDashboard()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-lg text-gray-400">Connecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <Header connected={connected} />
        <DevicePanel devices={devices} />
        <PowerMeter usage={usage} />
        <OfficeLayout devices={devices} />
        <AlertsPanel />
      </div>
    </div>
  )
}

const App = () => {
  return (
    <SocketProvider>
      <DashboardContent />
    </SocketProvider>
  )
}

export default App
