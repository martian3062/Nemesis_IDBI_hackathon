import { AlertTriangle, CheckCircle2, FileCheck2, History, LockKeyhole, ShieldCheck } from 'lucide-react'
import type { BackendHealthCard, Scenario } from '../../types'
import { MotionSection } from '../../components/ui/MotionCard'

// Demo-grade audit history derived deterministically from the current session so the
// trail always looks populated; real deployments would read a persisted audit store.
function buildAuditTrail(scenario: Scenario, runCount: number, signature: string) {
  const rules = [
    { rule: 'POLICY_CLEAR', verdict: 'APPROVED' },
    { rule: 'CONSENT_SCOPE', verdict: 'APPROVED' },
    { rule: 'LOW_CONFIDENCE', verdict: 'WARN' },
    { rule: 'PROMPT_INJECTION', verdict: 'BLOCKED' },
    { rule: 'UNSAFE_APPROVAL', verdict: 'BLOCKED' },
  ]
  const now = Date.now()
  return Array.from({ length: 5 }, (_, index) => {
    const entry =
      index === 0 && scenario === 'attack'
        ? rules[3]
        : rules[(runCount + index) % (scenario === 'attack' ? rules.length : 3)]
    const time = new Date(now - index * 47_000 - index * index * 13_000)
    return {
      id: `${signature.slice(0, 6)}${(runCount + index).toString(16)}`,
      time: time.toLocaleTimeString('en-IN', { hour12: false }),
      ...entry,
    }
  })
}

export function GuardianTab({
  scenario,
  apiCard,
  runCount,
}: {
  scenario: Scenario
  apiCard: BackendHealthCard | null
  runCount: number
}) {
  const auditTrail = buildAuditTrail(scenario, runCount, apiCard?.guardian.signature_preview ?? 'a9f3c1demo')

  return (
    <MotionSection className="content-grid two-column">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Guardian controls</p>
            <h3>Policy, consent, and tamper evidence</h3>
          </div>
          <LockKeyhole size={22} />
        </div>
        <div className="control-list">
          {[
            ['Consent scope verified', 'AA token bound to GST, bank, UPI, EPFO only', CheckCircle2],
            ['RBI XAI coverage', 'Every decision emits human-readable reason codes', FileCheck2],
            ['Injection sentinel', 'Operator text and model rationale scanned before use', AlertTriangle],
            ['Audit signer', 'Decision envelope sealed with HMAC-SHA256', ShieldCheck],
          ].map(([label, detail, Icon]) => {
            const ControlIcon = Icon as typeof CheckCircle2
            return (
              <div key={label as string} className="control-row">
                <ControlIcon size={20} />
                <div>
                  <strong>{label as string}</strong>
                  <span>{detail as string}</span>
                </div>
              </div>
            )
          })}
        </div>
      </article>

      <article className="panel alert-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Attack console</p>
            <h3>{scenario === 'attack' ? 'Blocked' : 'Ready'}</h3>
          </div>
          <ShieldCheck size={22} />
        </div>
        <p className="audit-copy">
          {apiCard?.guardian.findings[0]?.message ??
            (scenario === 'attack'
              ? 'A spoofed planner attempted to override exposure caps. Guardian rejected the message, quarantined the action path, and issued a signed audit record.'
              : 'Guardian is monitoring consent drift, prompt injection, high-risk exposure, and incomplete-data overrides.')}
        </p>
        <div className="audit-seal">
          <span>Audit seal</span>
          <strong>
            {apiCard?.guardian.signature_preview ?? `nemesis-${runCount.toString().padStart(4, '0')}-a9f3c1`}
          </strong>
        </div>

        <div className="audit-trail">
          <div className="audit-trail-head">
            <History size={16} />
            <span>Recent decision envelopes</span>
          </div>
          {auditTrail.map((entry) => (
            <div key={entry.id} className="audit-trail-row">
              <b className={entry.verdict.toLowerCase()}>{entry.verdict}</b>
              <div>
                <strong>{entry.rule}</strong>
                <span>envelope #{entry.id}</span>
              </div>
              <small>{entry.time}</small>
            </div>
          ))}
        </div>
      </article>
    </MotionSection>
  )
}
