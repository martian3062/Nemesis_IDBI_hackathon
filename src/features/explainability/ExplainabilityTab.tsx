import { Eye, LineChart } from 'lucide-react'
import type { Enterprise } from '../../types'
import { MotionSection } from '../../components/ui/MotionCard'

export function ExplainabilityTab({ enterprise }: { enterprise: Enterprise }) {
  return (
    <MotionSection className="content-grid two-column">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Reason codes</p>
            <h3>SHAP-grade explanation layer</h3>
          </div>
          <Eye size={22} />
        </div>
        <div className="reason-list">
          {enterprise.reasons.map((reason) => (
            <div key={reason.factor} className="reason-row">
              <div>
                <strong>{reason.factor}</strong>
                <p>{reason.text}</p>
              </div>
              <b className={reason.impact > 0 ? 'good' : 'risk'}>
                {reason.impact > 0 ? '+' : ''}
                {reason.impact}
              </b>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Counterfactual monitor</p>
            <h3>Digital-twin stress response</h3>
          </div>
          <LineChart size={22} />
        </div>
        <div className="stress-grid">
          {[
            ['GST delay 2 months', '-9 score', 'watch'],
            ['Top buyer payment late', '-14 score', 'risk'],
            ['UPI inflow +12%', '+6 score', 'good'],
            ['EPFO drop 20%', '-5 score', 'watch'],
          ].map(([label, value, tone]) => (
            <div key={label} className={`stress-tile ${tone}`}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </article>
    </MotionSection>
  )
}
