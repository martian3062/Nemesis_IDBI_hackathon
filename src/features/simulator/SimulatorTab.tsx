import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react'
import type { Scenario, SimulationOverrides, SimulationResult } from '../../types'
import { postSimulate } from '../../lib/nemesis-api'
import { RAW_RECORDS, simulateLocally } from '../../lib/scoring-local'
import { MotionSection } from '../../components/ui/MotionCard'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { scoreTone } from '../../lib/format'

type SliderConfig = {
  key: keyof SimulationOverrides
  label: string
  hint: string
  min: number
  max: number
  step: number
  format: (value: number) => string
}

const SLIDERS: SliderConfig[] = [
  {
    key: 'gst_filing_timeliness',
    label: 'GST filing timeliness',
    hint: 'Share of GST returns filed on time',
    min: 0.4,
    max: 1,
    step: 0.01,
    format: (value) => `${Math.round(value * 100)}%`,
  },
  {
    key: 'top_buyer_share',
    label: 'Top buyer share',
    hint: 'Revenue concentration in the largest buyer',
    min: 0.1,
    max: 0.9,
    step: 0.01,
    format: (value) => `${Math.round(value * 100)}%`,
  },
  {
    key: 'upi_monthly_inflow_lakh',
    label: 'UPI monthly inflow',
    hint: 'Digital settlement volume per month',
    min: 2,
    max: 60,
    step: 0.5,
    format: (value) => `INR ${value.toFixed(1)}L`,
  },
  {
    key: 'emi_delay_count_180d',
    label: 'EMI delays (180d)',
    hint: 'Missed or late EMI payments',
    min: 0,
    max: 6,
    step: 1,
    format: (value) => `${value}`,
  },
  {
    key: 'dso_days',
    label: 'Receivable days (DSO)',
    hint: 'Days sales outstanding',
    min: 20,
    max: 90,
    step: 1,
    format: (value) => `${value} days`,
  },
  {
    key: 'bank_avg_balance_lakh',
    label: 'Average bank balance',
    hint: 'Mean monthly balance across accounts',
    min: 1,
    max: 20,
    step: 0.1,
    format: (value) => `INR ${value.toFixed(1)}L`,
  },
]

export function SimulatorTab({
  enterpriseId,
  scenario,
  isLive,
}: {
  enterpriseId: string
  scenario: Scenario
  isLive: boolean
}) {
  const record = RAW_RECORDS[enterpriseId] ?? RAW_RECORDS.suryam
  const baseValues = useMemo<Record<string, number>>(
    () => ({
      gst_filing_timeliness: record.gst_filing_timeliness,
      top_buyer_share: record.top_buyer_share,
      upi_monthly_inflow_lakh: record.upi_monthly_inflow_lakh,
      emi_delay_count_180d: record.emi_delay_count_180d,
      dso_days: record.dso_days,
      bank_avg_balance_lakh: record.bank_avg_balance_lakh,
    }),
    [record],
  )

  const [values, setValues] = useState<Record<string, number>>(baseValues)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const debounceRef = useRef<number>(0)

  useEffect(() => {
    setValues(baseValues)
  }, [baseValues])

  useEffect(() => {
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      const overrides = values as SimulationOverrides
      const local = simulateLocally(enterpriseId, scenario, overrides)
      if (!isLive) {
        setResult(local)
        return
      }
      postSimulate(enterpriseId, scenario, overrides)
        .then((response) => setResult({ ...response, mode: 'live' }))
        .catch(() => setResult(local))
    }, 150)
    return () => window.clearTimeout(debounceRef.current)
  }, [values, enterpriseId, scenario, isLive])

  const simulated = result?.simulated
  const baseline = result?.baseline
  const scoreDelta = simulated && baseline ? simulated.composite - baseline.composite : 0

  return (
    <MotionSection className="content-grid two-column">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">What-If Lab</p>
            <h3>Counterfactual score simulator</h3>
          </div>
          <SlidersHorizontal size={22} />
        </div>
        <p className="panel-copy">
          Move any lever to see how {record.name} could improve its Financial Health Card. The engine reruns the
          same six-dimension scoring used for real decisions{result?.mode === 'live' ? ' (live backend)' : ' (local mirror)'}.
        </p>
        <div className="slider-list">
          {SLIDERS.map((slider) => (
            <div key={slider.key} className="slider-row">
              <div className="slider-meta">
                <strong>{slider.label}</strong>
                <span>{slider.hint}</span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={values[slider.key] ?? slider.min}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [slider.key]: Number(event.target.value) }))
                }
                aria-label={slider.label}
              />
              <b className={values[slider.key] !== baseValues[slider.key] ? 'changed' : ''}>
                {slider.format(values[slider.key] ?? slider.min)}
              </b>
            </div>
          ))}
        </div>
        <button type="button" className="ghost-button" onClick={() => setValues(baseValues)}>
          <RotateCcw size={15} />
          Reset to observed data
        </button>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Simulated outcome</p>
            <h3>Before vs after</h3>
          </div>
          <Sparkles size={22} />
        </div>
        <div className="simulate-scores">
          <div className="simulate-score">
            <span>Observed</span>
            <strong className={baseline ? scoreTone(baseline.composite) : ''}>
              {baseline ? baseline.composite : '--'}
            </strong>
            <small>{baseline?.decision ?? ''}</small>
          </div>
          <ArrowRight size={20} className="simulate-arrow" />
          <div className={`simulate-score simulated ${simulated ? scoreTone(simulated.composite) : ''}`}>
            <span>Simulated</span>
            <strong>{simulated ? <AnimatedNumber value={simulated.composite} /> : '--'}</strong>
            <small>{simulated?.decision ?? ''}</small>
          </div>
          <div className={`simulate-delta ${scoreDelta > 0 ? 'good' : scoreDelta < 0 ? 'risk' : ''}`}>
            {scoreDelta > 0 ? '+' : ''}
            {scoreDelta} pts
          </div>
        </div>

        <div className="delta-list">
          {(result?.deltas ?? []).map((delta) => {
            const change = delta.after - delta.before
            return (
              <div key={delta.label} className="delta-row">
                <strong>{delta.label}</strong>
                <div className="delta-values">
                  <span>{delta.before}</span>
                  <ArrowRight size={13} />
                  <b className={scoreTone(delta.after)}>{delta.after}</b>
                  <i className={change > 0 ? 'good' : change < 0 ? 'risk' : ''}>
                    {change > 0 ? `+${change}` : change === 0 ? '±0' : change}
                  </i>
                </div>
              </div>
            )
          })}
        </div>

        {simulated && (
          <div className="simulate-reasons">
            <span className="eyebrow">Updated reason codes</span>
            {simulated.reasons.map((reason) => (
              <p key={reason.factor}>
                <b className={reason.impact > 0 ? 'good' : 'risk'}>
                  {reason.impact > 0 ? '+' : ''}
                  {reason.impact}
                </b>
                {reason.factor}
              </p>
            ))}
          </div>
        )}
      </article>
    </MotionSection>
  )
}
