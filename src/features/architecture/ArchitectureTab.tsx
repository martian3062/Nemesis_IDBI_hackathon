import { Activity, DatabaseZap } from 'lucide-react'
import type { BackendHealthCard } from '../../types'
import { architectureNodes } from '../../lib/fallback-data'
import { MotionSection } from '../../components/ui/MotionCard'

export function ArchitectureTab({ apiCard }: { apiCard: BackendHealthCard | null }) {
  return (
    <MotionSection className="content-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">System architecture</p>
            <h3>Consent to health-card workflow</h3>
          </div>
          <DatabaseZap size={22} />
        </div>
        <div className="architecture-flow">
          {(apiCard?.architecture_nodes ?? architectureNodes).map((node) => (
            <div key={node.layer} className="architecture-node">
              <b>{node.layer}</b>
              <div>
                <strong>{node.name}</strong>
                <span>{node.components.join(' / ')}</span>
                <small>{node.status}</small>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="panel compact-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Benchmark</p>
            <h3>Decision readiness</h3>
          </div>
          <Activity size={22} />
        </div>
        <div className="benchmark-list">
          <div>
            <span>Indicative decision</span>
            <strong>{apiCard ? `${Math.round(apiCard.benchmark.indicative_decision_ms / 1000)}s` : '<90s'}</strong>
          </div>
          <div>
            <span>Model confidence</span>
            <strong>{apiCard ? `${Math.round(apiCard.benchmark.model_confidence * 100)}%` : '86%'}</strong>
          </div>
          <div>
            <span>Reason coverage</span>
            <strong>{apiCard?.benchmark.reason_code_coverage ?? '100%'}</strong>
          </div>
          <div>
            <span>Cascade tier</span>
            <strong>{apiCard?.benchmark.tier_used ?? 'tier2_tabular'}</strong>
          </div>
        </div>
      </article>
    </MotionSection>
  )
}
