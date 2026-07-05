import { useEffect, useState } from 'react'
import { AlertTriangle, Briefcase, TrendingUp } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PortfolioSnapshot, Scenario } from '../../types'
import { fetchPortfolio } from '../../lib/nemesis-api'
import { buildLocalPortfolio } from '../../lib/scoring-local'
import { MotionSection, MotionGrid, MotionTile } from '../../components/ui/MotionCard'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'

const BUCKET_COLORS: Record<string, string> = {
  '0-40': '#dc2626',
  '40-50': '#ef4444',
  '50-62': '#d97706',
  '62-78': '#eab308',
  '78-100': '#16a34a',
}

export function PortfolioTab({
  scenario,
  isLive,
  onOpenEnterprise,
}: {
  scenario: Scenario
  isLive: boolean
  onOpenEnterprise: (id: string) => void
}) {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null)
  const [mode, setMode] = useState<'live' | 'local'>('local')

  useEffect(() => {
    let cancelled = false
    const local = buildLocalPortfolio(scenario)
    if (!isLive) {
      setSnapshot(local)
      setMode('local')
      return
    }
    fetchPortfolio(scenario)
      .then((data: PortfolioSnapshot) => {
        if (!cancelled) {
          setSnapshot(data)
          setMode('live')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshot(local)
          setMode('local')
        }
      })
    return () => {
      cancelled = true
    }
  }, [scenario, isLive])

  if (!snapshot) return null
  const { summary, items, alerts, distribution } = snapshot

  return (
    <MotionSection className="content-grid">
      <MotionGrid className="portfolio-stats">
        <MotionTile className="portfolio-stat">
          <span>MSMEs under watch</span>
          <strong>
            <AnimatedNumber value={summary.count} />
          </strong>
          <small>{mode === 'live' ? 'live backend portfolio' : 'local scoring mirror'}</small>
        </MotionTile>
        <MotionTile className="portfolio-stat">
          <span>Average health score</span>
          <strong>
            <AnimatedNumber value={summary.avg_score} />
          </strong>
          <small>across the active book</small>
        </MotionTile>
        <MotionTile className="portfolio-stat">
          <span>Requested exposure</span>
          <strong>
            INR <AnimatedNumber value={summary.total_exposure_lakh} />L
          </strong>
          <small>sum of open asks</small>
        </MotionTile>
        <MotionTile className="portfolio-stat tiers">
          <span>Risk tiers</span>
          <div className="tier-chips">
            <b className="good">{summary.tier_counts.good} strong</b>
            <b className="watch">{summary.tier_counts.watch} watch</b>
            <b className="risk">{summary.tier_counts.risk} risk</b>
          </div>
          <small>score tone distribution</small>
        </MotionTile>
      </MotionGrid>

      <div className="content-grid two-column">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Score distribution</p>
              <h3>Where the book sits today</h3>
            </div>
            <TrendingUp size={22} />
          </div>
          <div className="distribution-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distribution} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: 'rgba(83, 209, 182, 0.08)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distribution.map((entry) => (
                    <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket] ?? '#53d1b6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel-heading alerts-heading">
            <div>
              <p className="eyebrow">Alerts queue</p>
              <h3>{alerts.length} early-warning signals</h3>
            </div>
            <AlertTriangle size={20} />
          </div>
          <div className="alert-queue">
            {alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                className={`alert-row ${alert.severity}`}
                onClick={() => onOpenEnterprise(alert.enterprise_id)}
                title={`Open ${alert.enterprise_name}`}
              >
                <b>{alert.severity}</b>
                <div>
                  <strong>{alert.enterprise_name}</strong>
                  <span>{alert.message}</span>
                </div>
                <small>{alert.dimension}</small>
              </button>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Underwriter book</p>
              <h3>All MSMEs ranked by risk</h3>
            </div>
            <Briefcase size={22} />
          </div>
          <div className="portfolio-table">
            <div className="portfolio-head">
              <span>Enterprise</span>
              <span>Score</span>
              <span>Decision</span>
              <span>Top risk</span>
            </div>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="portfolio-row"
                onClick={() => onOpenEnterprise(item.id)}
                title={`Open ${item.name} health card`}
              >
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.sector} · {item.location}
                  </span>
                </div>
                <b className={`score-chip ${item.tone}`}>{item.composite}</b>
                <span className="decision-text">{item.decision}</span>
                <small>{item.top_risk_factor}</small>
              </button>
            ))}
          </div>
        </article>
      </div>
    </MotionSection>
  )
}
