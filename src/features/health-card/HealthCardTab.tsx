import { Activity, Gauge } from 'lucide-react'
import type { Dimension, Enterprise, Scenario } from '../../types'
import { Radar } from '../../components/charts/Radar'
import { Sparkline } from '../../components/charts/Sparkline'
import { MotionSection } from '../../components/ui/MotionCard'
import { clampScore, scenarioOffset, scoreTone } from '../../lib/format'

export function HealthCardTab({
  enterprise,
  dimensions,
  scenario,
  isLive,
}: {
  enterprise: Enterprise
  dimensions: Dimension[]
  scenario: Scenario
  isLive: boolean
}) {
  const cashflow = isLive
    ? enterprise.cashflow
    : enterprise.cashflow.map((value) => clampScore(value + scenarioOffset(scenario)))

  return (
    <MotionSection className="content-grid two-column">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Financial Health Card</p>
            <h3>Six-dimensional score</h3>
          </div>
          <Gauge size={22} />
        </div>
        <div className="radar-layout">
          <Radar dimensions={dimensions} />
          <div className="dimension-list">
            {dimensions.map((dimension) => (
              <div key={dimension.label} className="dimension-row">
                <div>
                  <strong>{dimension.label}</strong>
                  <span>{dimension.signal}</span>
                </div>
                <b className={scoreTone(dimension.value)}>{dimension.value}</b>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Cashflow signal</p>
            <h3>Alternate-data trend</h3>
          </div>
          <Activity size={22} />
        </div>
        <Sparkline points={cashflow} />
        <div className="feature-grid">
          {enterprise.features.map((feature) => (
            <div key={feature.label} className="feature-tile">
              <span>{feature.label}</span>
              <strong>{feature.value}</strong>
              <small>{feature.status}</small>
            </div>
          ))}
        </div>
      </article>
    </MotionSection>
  )
}
