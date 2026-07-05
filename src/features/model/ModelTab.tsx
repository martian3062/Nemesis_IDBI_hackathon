import { useEffect, useMemo, useState } from 'react'
import { Brain, FlaskConical, ScatterChart, Sparkles, TrendingUp, Users } from 'lucide-react'
import type { MLPeers, MLScore, MLValidation, ModelCard } from '../../types'
import { fetchMlPeers, fetchMlScore, fetchMlValidation, fetchModelCard } from '../../lib/nemesis-api'
import { MotionSection } from '../../components/ui/MotionCard'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { AttributionBars, CalibrationCurve, GainsChart, RocCurve } from '../../components/charts/MlCharts'

const CUTOFFS = [0.1, 0.15, 0.2, 0.28]

function pdTone(pd: number) {
  if (pd < 0.12) return 'good'
  if (pd < 0.28) return 'watch'
  return 'risk'
}

export function ModelTab({ enterpriseId, isLive }: { enterpriseId: string; isLive: boolean }) {
  const [score, setScore] = useState<MLScore | null>(null)
  const [validation, setValidation] = useState<MLValidation | null>(null)
  const [card, setCard] = useState<ModelCard | null>(null)
  const [peers, setPeers] = useState<MLPeers | null>(null)
  const [cutoffIdx, setCutoffIdx] = useState(1)

  useEffect(() => {
    if (!isLive) return
    let cancelled = false
    fetchMlValidation().then((v) => !cancelled && setValidation(v)).catch(() => {})
    fetchModelCard().then((c) => !cancelled && setCard(c)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isLive])

  useEffect(() => {
    if (!isLive) return
    let cancelled = false
    fetchMlScore(enterpriseId).then((s) => !cancelled && setScore(s)).catch(() => {})
    fetchMlPeers(enterpriseId).then((p) => !cancelled && setPeers(p)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enterpriseId, isLive])

  const impact = useMemo(() => validation?.business_impact[cutoffIdx], [validation, cutoffIdx])

  if (!isLive) {
    return (
      <MotionSection className="content-grid">
        <article className="panel glass">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Credit model</p>
              <h3>ML scorecard needs the live backend</h3>
            </div>
            <Brain size={22} />
          </div>
          <p className="panel-copy">
            The trained probability-of-default model (logistic scorecard + gradient boosting + TabPFN foundation
            model) runs on the backend. Start the API to see live scores and validation metrics.
          </p>
        </article>
      </MotionSection>
    )
  }

  return (
    <MotionSection className="content-grid">
      <div className="model-metric-row">
        {[
          ['AUROC', validation?.auroc, 'Rank-ordering power'],
          ['KS', validation?.ks, 'Good/bad separation'],
          ['Gini', validation?.gini, '2·AUROC − 1'],
          ['PSI', validation?.psi_train_test, 'Train/test stability'],
        ].map(([label, value, hint]) => (
          <div key={label as string} className="model-metric glass">
            <span>{label as string}</span>
            <strong>{typeof value === 'number' ? value.toFixed(label === 'PSI' ? 3 : 3) : '—'}</strong>
            <small>{hint as string}</small>
          </div>
        ))}
      </div>

      <div className="content-grid two-column">
        <article className="panel glass">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Probability of default</p>
              <h3>{score?.name ?? 'Model score'}</h3>
            </div>
            <Sparkles size={22} />
          </div>
          {score && (
            <div className="pd-layout">
              <div className={`pd-dial ${pdTone(score.pd)}`}>
                <svg viewBox="0 0 120 120" role="img" aria-label="Probability of default dial">
                  <circle cx="60" cy="60" r="50" className="pd-track" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className="pd-arc"
                    strokeDasharray={`${Math.min(score.pd, 1) * 314} 314`}
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="54" textAnchor="middle" className="pd-value">
                    {(score.pd * 100).toFixed(1)}%
                  </text>
                  <text x="60" y="74" textAnchor="middle" className="pd-label">
                    12-mo PD
                  </text>
                </svg>
                <div className="pd-score">
                  <span>Credit score</span>
                  <strong>
                    <AnimatedNumber value={score.credit_score} />
                  </strong>
                  <b className={pdTone(score.pd)}>{score.band}</b>
                </div>
              </div>
              <div className="model-compare">
                <span className="eyebrow">Model ensemble</span>
                <div className="compare-row">
                  <span>Logistic scorecard</span>
                  <b>{(score.models.logistic_scorecard * 100).toFixed(1)}%</b>
                </div>
                <div className="compare-row">
                  <span>Gradient boosting</span>
                  <b>{(score.models.gradient_boosting * 100).toFixed(1)}%</b>
                </div>
                <div className="compare-row">
                  <span>TabPFN foundation model</span>
                  <b>
                    {score.models.tabpfn_foundation != null
                      ? `${(score.models.tabpfn_foundation * 100).toFixed(1)}%`
                      : 'fallback'}
                  </b>
                </div>
                <div className="compare-row">
                  <span>Ensemble PD</span>
                  <b>{(score.pd * 100).toFixed(1)}%</b>
                </div>
                <div className="decision-pill">{score.decision}</div>
              </div>
            </div>
          )}
        </article>

        <article className="panel glass">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Explainability</p>
              <h3>Feature attribution (scorecard points)</h3>
            </div>
            <ScatterChart size={22} />
          </div>
          {score && <AttributionBars rows={score.attributions} />}
          <p className="attr-legend">
            <i className="dot good" /> protective · lowers default risk &nbsp;&nbsp;
            <i className="dot risk" /> risk · raises default risk
          </p>
        </article>
      </div>

      <div className="content-grid three-column">
        <article className="panel glass">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Discrimination</p>
              <h3>ROC curve</h3>
            </div>
          </div>
          {validation && <RocCurve data={validation} />}
        </article>
        <article className="panel glass">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Reliability</p>
              <h3>Calibration</h3>
            </div>
          </div>
          {validation && <CalibrationCurve data={validation} />}
        </article>
        <article className="panel glass">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Lift</p>
              <h3>Cumulative bad capture</h3>
            </div>
          </div>
          {validation && <GainsChart data={validation} />}
        </article>
      </div>

      <div className="content-grid two-column">
        <article className="panel glass">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Business impact</p>
              <h3>Approval uplift vs traditional underwriting</h3>
            </div>
            <TrendingUp size={22} />
          </div>
          <div className="cutoff-control">
            <span>Approval cutoff (max PD)</span>
            <input
              type="range"
              min={0}
              max={CUTOFFS.length - 1}
              step={1}
              value={cutoffIdx}
              onChange={(e) => setCutoffIdx(Number(e.target.value))}
              aria-label="Approval cutoff"
            />
            <b>{impact ? `${(impact.cutoff_pd * 100).toFixed(0)}%` : ''}</b>
          </div>
          {impact && (
            <div className="impact-grid">
              <div>
                <span>Approval rate</span>
                <strong>{(impact.approval_rate * 100).toFixed(0)}%</strong>
              </div>
              <div>
                <span>Traditional baseline</span>
                <strong>{(impact.traditional_approval_rate * 100).toFixed(0)}%</strong>
              </div>
              <div className="impact-hero">
                <span>Additional MSMEs approved</span>
                <strong>+{impact.uplift_pct_points} pts</strong>
              </div>
              <div>
                <span>Bad rate in approved book</span>
                <strong>{(impact.approved_bad_rate * 100).toFixed(1)}%</strong>
              </div>
            </div>
          )}
          <p className="panel-copy">
            More credit-invisible NTC/NTB MSMEs onboarded at an equal or lower risk than document-based underwriting —
            the core Track 03 outcome.
          </p>
        </article>

        <article className="panel glass">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Governance</p>
              <h3>Model card</h3>
            </div>
            <FlaskConical size={22} />
          </div>
          {card && (
            <div className="model-card">
              <div className="mc-row"><span>Champion</span><p>{card.champion}</p></div>
              <div className="mc-row"><span>Challenger</span><p>{card.challenger}</p></div>
              <div className="mc-row"><span>Foundation model</span><p>{card.foundation_model}</p></div>
              <div className="mc-row"><span>Target</span><p>{card.target}</p></div>
              <div className="mc-row"><span>Training data</span><p>{card.training_data}</p></div>
              <div className="mc-row"><span>Features</span><p>{card.features.length} alternate-data features</p></div>
              <div className="mc-row"><span>Limitations</span><p>{card.limitations}</p></div>
            </div>
          )}
        </article>
      </div>

      {peers && (
        <article className="panel glass">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Hugging Face foundation model · {peers.model}</p>
              <h3>Semantic peer benchmarking</h3>
            </div>
            <Users size={22} />
          </div>
          <p className="panel-copy">
            A 22M-parameter sentence-transformer embeds each MSME's profile and finds its nearest peers
            ({peers.mode} similarity). This borrower's PD is <strong>{peers.consistency}</strong> — self{' '}
            {(peers.self_pd * 100).toFixed(1)}% vs peer average {(peers.peer_avg_pd * 100).toFixed(1)}%.
          </p>
          <div className="peer-grid">
            {peers.peers.map((peer) => (
              <div key={peer.id} className="peer-card">
                <strong>{peer.name}</strong>
                <span>{peer.sector}</span>
                <div className="peer-metrics">
                  <b>{(peer.similarity * 100).toFixed(0)}% match</b>
                  <i>PD {(peer.pd * 100).toFixed(1)}%</i>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}
    </MotionSection>
  )
}
