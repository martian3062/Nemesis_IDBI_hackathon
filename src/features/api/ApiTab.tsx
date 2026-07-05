import { CheckCircle2, DatabaseZap } from 'lucide-react'
import type { BackendHealthCard } from '../../types'
import { MotionSection } from '../../components/ui/MotionCard'

export function ApiTab({
  apiCard,
  apiStatus,
}: {
  apiCard: BackendHealthCard | null
  apiStatus: 'connecting' | 'live' | 'fallback'
}) {
  return (
    <MotionSection className="content-grid two-column">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Backend API</p>
            <h3>Runnable endpoints</h3>
          </div>
          <DatabaseZap size={22} />
        </div>
        <div className="endpoint-list">
          {[
            ['GET', '/api/v1/health-card', 'Generate score, reason codes, connector snapshot, and Guardian audit'],
            ['POST', '/api/v1/simulate', 'Recompute the six-dimension score with what-if feature overrides'],
            ['GET', '/api/v1/portfolio', 'Portfolio summary, alerts queue, and score distribution'],
            ['POST', '/api/v1/ai/chat', 'Guardian-screened AI credit officer conversation'],
            ['POST', '/api/v1/scenario/run', 'Run baseline, thinData, stress, or attack simulation'],
            ['GET', '/api/v1/connectors/snapshot', 'Inspect AA, GST, UPI, EPFO, OCEN, and ULI payloads'],
            ['GET', '/api/v1/audit/latest', 'Return latest signed Guardian decision envelope'],
            ['GET', '/api/v1/federated/status', 'Show multi-node model-readiness status'],
          ].map(([method, path, detail]) => (
            <div key={path} className="endpoint-row">
              <b>{method}</b>
              <div>
                <strong>{path}</strong>
                <span>{detail}</span>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Connector status</p>
            <h3>{apiStatus === 'live' ? 'Live snapshot' : 'Fallback preview'}</h3>
          </div>
          <CheckCircle2 size={22} />
        </div>
        <div className="connector-health">
          {[
            ['AA consent', apiCard?.connectors.account_aggregator ? 'active' : 'ready'],
            ['GSTN', apiCard?.connectors.gst ? 'available' : 'mock'],
            ['NPCI UPI', apiCard?.connectors.upi ? 'available' : 'mock'],
            ['EPFO', apiCard?.connectors.epfo ? 'scoped' : 'mock'],
            ['OCEN', apiCard?.connectors.ocen ? 'payload ready' : 'stub'],
            ['ULI', apiCard?.connectors.uli ? 'payload ready' : 'stub'],
          ].map(([name, status]) => (
            <div key={name as string} className="connector-health-row">
              <strong>{name as string}</strong>
              <span>{status as string}</span>
            </div>
          ))}
        </div>
      </article>
    </MotionSection>
  )
}
