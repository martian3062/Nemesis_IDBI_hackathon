import { FileDown, Play } from 'lucide-react'

export function TopBar({
  enterpriseOptions,
  selectedId,
  onSelectEnterprise,
  onRunScenario,
  onExport,
}: {
  enterpriseOptions: { id: string; name: string }[]
  selectedId: string
  onSelectEnterprise: (id: string) => void
  onRunScenario: () => void
  onExport: () => void
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">MSME financial health swarm</p>
        <h2>Enterprise mirror for creditworthiness, consent, and explainability</h2>
      </div>
      <div className="topbar-actions">
        <select
          value={selectedId}
          onChange={(event) => onSelectEnterprise(event.target.value)}
          aria-label="Enterprise"
        >
          {enterpriseOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="button" className="ghost-button" onClick={onExport} title="Export Health Card as PDF">
          <FileDown size={16} />
          Export PDF
        </button>
        <button type="button" className="primary-button" onClick={onRunScenario}>
          <Play size={16} />
          Run scenario
        </button>
      </div>
    </header>
  )
}
