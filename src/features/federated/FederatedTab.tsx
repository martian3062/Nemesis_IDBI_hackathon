import { DatabaseZap, Landmark } from 'lucide-react'
import { MotionSection } from '../../components/ui/MotionCard'

export function FederatedTab({
  rounds,
}: {
  rounds: { bank: string; auc: string; drift: string; samples: string }[]
}) {
  return (
    <MotionSection className="content-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Federated-learning core</p>
            <h3>Model travels, raw data stays local</h3>
          </div>
          <Landmark size={22} />
        </div>
        <div className="federated-table">
          <div className="table-head">
            <span>Node</span>
            <span>AUROC</span>
            <span>Drift</span>
            <span>Samples</span>
          </div>
          {rounds.map((round) => (
            <div key={round.bank} className="table-row">
              <strong>{round.bank}</strong>
              <span>{round.auc}</span>
              <span>{round.drift}</span>
              <span>{round.samples}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel compact-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Deployment surface</p>
            <h3>Connectors</h3>
          </div>
          <DatabaseZap size={22} />
        </div>
        <div className="connector-list">
          {['AA consent', 'GSTN', 'NPCI UPI', 'EPFO', 'OCEN', 'ULI'].map((connector) => (
            <span key={connector}>{connector}</span>
          ))}
        </div>
      </article>
    </MotionSection>
  )
}
