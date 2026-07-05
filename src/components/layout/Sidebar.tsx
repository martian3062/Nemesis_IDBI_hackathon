import { useEffect, useState } from 'react'
import { Clock3, DatabaseZap, LineChart, Zap } from 'lucide-react'
import { navItems, type TabKey } from './nav-items'

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function Sidebar({
  activeTab,
  onSelectTab,
  apiStatus,
  runCount,
}: {
  activeTab: TabKey
  onSelectTab: (key: TabKey) => void
  apiStatus: 'connecting' | 'live' | 'fallback'
  runCount: number
}) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    setElapsed(0)
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(interval)
  }, [runCount])

  return (
    <aside className="sidebar" aria-label="Nemesis navigation">
      <div className="brand-block">
        <div className="brand-mark">
          <LineChart size={24} />
        </div>
        <div>
          <p className="eyebrow">IDBI Innovate Track 03</p>
          <h1>Nemesis</h1>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              className={activeTab === item.key ? 'nav-item active' : 'nav-item'}
              type="button"
              onClick={() => onSelectTab(item.key)}
              title={item.label}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-panel">
        <p className="eyebrow">Live decision clock</p>
        <div className="metric-row">
          <DatabaseZap size={18} />
          <strong>{apiStatus === 'live' ? 'API' : apiStatus === 'connecting' ? '...' : 'UI'}</strong>
          <span>
            {apiStatus === 'live' ? 'live backend' : apiStatus === 'connecting' ? 'connecting' : 'static fallback'}
          </span>
        </div>
        <div className="metric-row">
          <Clock3 size={18} />
          <strong>{formatElapsed(elapsed)}</strong>
          <span>since last score</span>
        </div>
        <div className="metric-row">
          <Zap size={18} />
          <strong>{runCount}</strong>
          <span>scoring runs</span>
        </div>
      </div>
    </aside>
  )
}
