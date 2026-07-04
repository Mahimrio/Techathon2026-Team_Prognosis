import ConnectionBadge from './ConnectionBadge'

interface HeaderProps {
  connected: boolean
}

const Header = ({ connected }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between border-b border-gray-700 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-white">OfficeVolt</h1>
        <p className="text-sm text-gray-400">Real-time office power monitor</p>
      </div>
      <ConnectionBadge connected={connected} />
    </header>
  )
}

export default Header
