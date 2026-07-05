import type { BackendHealthCard, Dimension, Enterprise, Scenario } from '../../types'
import { scenarioLabels, scoreTone } from '../../lib/format'
import './print.css'

export function PrintableHealthCard({
  enterprise,
  dimensions,
  scenario,
  apiCard,
}: {
  enterprise: Enterprise
  dimensions: Dimension[]
  scenario: Scenario
  apiCard: BackendHealthCard | null
}) {
  const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })

  return (
    <div id="print-root" aria-hidden="true">
      <header className="print-header">
        <div>
          <h1>Nemesis · MSME Financial Health Card</h1>
          <p>Alternate-data creditworthiness assessment for IDBI Innovate</p>
        </div>
        <div className="print-meta">
          <span>Generated {generatedAt}</span>
          <span>Scenario: {scenarioLabels[scenario]}</span>
        </div>
      </header>

      <section className="print-identity">
        <div>
          <h2>{enterprise.name}</h2>
          <p>
            {enterprise.sector} · {enterprise.location}
          </p>
          <p className="print-ask">Request: {enterprise.ask}</p>
        </div>
        <div className={`print-score ${scoreTone(enterprise.composite)}`}>
          <strong>{enterprise.composite}</strong>
          <span>/ 100</span>
          <b>{enterprise.decision}</b>
        </div>
      </section>

      <section className="print-dimensions">
        <h3>Six-dimension score</h3>
        <table>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Score</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {dimensions.map((dimension) => (
              <tr key={dimension.label}>
                <td>{dimension.label}</td>
                <td className={scoreTone(dimension.value)}>{dimension.value}</td>
                <td>{dimension.signal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="print-reasons">
        <h3>Reason codes</h3>
        {enterprise.reasons.map((reason) => (
          <div key={reason.factor} className="print-reason">
            <b className={reason.impact > 0 ? 'good' : 'risk'}>
              {reason.impact > 0 ? '+' : ''}
              {reason.impact}
            </b>
            <div>
              <strong>{reason.factor}</strong>
              <p>{reason.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="print-features">
        <h3>Alternate-data evidence</h3>
        <div className="print-feature-grid">
          {enterprise.features.map((feature) => (
            <div key={feature.label}>
              <span>{feature.label}</span>
              <strong>{feature.value}</strong>
              <small>{feature.status}</small>
            </div>
          ))}
        </div>
      </section>

      <footer className="print-footer">
        <div>
          <span>Guardian verdict</span>
          <strong>{apiCard?.guardian.verdict ?? 'APPROVED (offline preview)'}</strong>
        </div>
        <div>
          <span>Audit signature</span>
          <strong className="mono">{apiCard?.guardian.signature_preview ?? 'available with live backend'}</strong>
        </div>
        <p className="print-disclaimer">
          Indicative assessment generated from consented alternate data (GST, UPI, EPFO, bank statements). Not a
          final credit decision. All decisions pass Guardian policy checks with signed HMAC audit records.
        </p>
      </footer>
    </div>
  )
}
