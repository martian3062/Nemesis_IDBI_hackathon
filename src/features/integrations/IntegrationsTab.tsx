import { ShieldCheck, Zap } from 'lucide-react'
import type { Enterprise, IntegrationSummary } from '../../types'
import { MotionSection } from '../../components/ui/MotionCard'

export function IntegrationsTab({
  integrationSummary,
  enterprise,
  activeScore,
}: {
  integrationSummary: IntegrationSummary | null
  enterprise: Enterprise
  activeScore: number
}) {
  return (
    <MotionSection className="content-grid two-column">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">AI credit officer</p>
            <h3>{integrationSummary?.credit_memo.tool ?? 'Groq AI'} memo pipeline</h3>
          </div>
          <Zap size={22} />
        </div>
        <div className="memo-panel">
          <span className="mode-pill">{integrationSummary?.credit_memo.mode ?? 'fallback'}</span>
          <strong>
            {integrationSummary?.credit_memo.memo.summary ??
              `${enterprise.name} has a policy-checked score and is ready for credit memo generation.`}
          </strong>
          <div className="memo-columns">
            <div>
              <span>Mitigants</span>
              {(integrationSummary?.credit_memo.memo.mitigants ?? [
                'Cap exposure until buyer concentration improves.',
                'Monitor monthly GST-bank reconciliation.',
              ]).map((item: unknown, index: number) => (
                <p key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</p>
              ))}
            </div>
            <div>
              <span>Borrower advice</span>
              {(integrationSummary?.credit_memo.memo.borrower_advice ?? [
                'Improve receivable cycles.',
                'Grow repeat customers across more buyers.',
              ]).map((item: unknown, index: number) => (
                <p key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="integration-catalog">
          {(integrationSummary?.catalog ?? [
            {
              name: 'Groq AI',
              category: 'AI credit officer',
              status: 'fallback',
              purpose: 'Generate structured credit memo and planner rationale.',
            },
            {
              name: 'Firecrawl',
              category: 'External verification',
              status: 'fallback',
              purpose: 'Verify MSME web footprint and supplier context.',
            },
            {
              name: 'OPA',
              category: 'Policy engine',
              status: 'local-rules',
              purpose: 'Evaluate underwriting policies.',
            },
          ]).map((tool) => (
            <div key={tool.name} className="integration-row">
              <div>
                <strong>{tool.name}</strong>
                <span>{tool.category}</span>
                <p>{tool.purpose}</p>
              </div>
              <b>{tool.status}</b>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Ops and verification</p>
            <h3>Hackathon readiness stack</h3>
          </div>
          <ShieldCheck size={22} />
        </div>
        <div className="ops-grid">
          <div>
            <span>Firecrawl verification</span>
            <strong>{integrationSummary?.external_verification.mode ?? 'fallback'}</strong>
            {(integrationSummary?.external_verification.signals ?? ['External signal fallback is ready.']).map(
              (signal: string) => (
                <p key={signal}>{signal}</p>
              ),
            )}
          </div>
          <div>
            <span>OPA policy</span>
            <strong>{integrationSummary?.policy.mode ?? 'local-rules'}</strong>
            <p>
              {integrationSummary?.policy.result.reason ??
                `Allow: ${String(integrationSummary?.policy.result.allow ?? activeScore >= 62)}`}
            </p>
          </div>
          <div>
            <span>Evidently monitor</span>
            <strong>{integrationSummary?.model_monitor.score_mean ?? activeScore}</strong>
            <p>Mean score with confidence {integrationSummary?.model_monitor.confidence_mean ?? '0.86'}</p>
          </div>
          <div>
            <span>Great Expectations</span>
            <strong>
              {integrationSummary ? `${integrationSummary.data_quality.expectations.length} suites` : 'contracts'}
            </strong>
            <p>Connector quality gates for GST, UPI, EPFO, and bank data.</p>
          </div>
          <div>
            <span>Doc intelligence</span>
            <strong>{integrationSummary?.document_intelligence.supported_docs.length ?? 4} docs</strong>
            <p>Invoice, statement, GST, and purchase-order parsing contract.</p>
          </div>
          <div>
            <span>Vector memory</span>
            <strong>
              {typeof integrationSummary?.memory.qdrant_status === 'string'
                ? integrationSummary.memory.qdrant_status
                : 'online'}
            </strong>
            <p>{(integrationSummary?.memory.collections ?? ['credit_memos', 'policy_docs']).join(', ')}</p>
          </div>
          <div>
            <span>Observability</span>
            <strong>{integrationSummary?.operations.observability.tool ?? 'OpenTelemetry'}</strong>
            <p>
              {(integrationSummary?.operations.observability.metrics ?? ['score_runs', 'guardian_blocks'])
                .slice(0, 2)
                .join(', ')}
            </p>
          </div>
          <div>
            <span>Storage / workspace</span>
            <strong>{integrationSummary?.operations.storage.tool ?? 'MinIO'} + Zerve</strong>
            <p>Health-card exports, docs, notebooks, and validation workflows.</p>
          </div>
        </div>
      </article>
    </MotionSection>
  )
}
