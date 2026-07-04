interface ConnectionBadgeProps {
  connected: boolean
}

const ConnectionBadge = ({ connected }: ConnectionBadgeProps) => {
  const dot = connected
    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
      {connected ? 'Live' : 'Disconnected'}
    </div>
  )
}

export default ConnectionBadge
