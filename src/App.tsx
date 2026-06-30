import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Eye,
  FileCheck2,
  Gauge,
  GitBranch,
  Landmark,
  LineChart,
  LockKeyhole,
  Network,
  Play,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import './App.css'

type Dimension = {
  label: string
  value: number
  delta: string
  signal: string
  tone: 'good' | 'watch' | 'risk'
}

type Enterprise = {
  id: string
  name: string
  sector: string
  location: string
  ask: string
  composite: number
  decision: string
  dimensions: Dimension[]
  features: { label: string; value: string; status: string }[]
  reasons: { factor: string; impact: number; text: string }[]
  cashflow: number[]
}

type Scenario = 'baseline' | 'thinData' | 'stress' | 'attack'

const enterprises: Enterprise[] = [
  {
    id: 'suryam',
    name: 'Suryam Precision Tools',
    sector: 'Auto components',
    location: 'Ludhiana, PB',
    ask: 'INR 42L working-capital line',
    composite: 82,
    decision: 'Indicative approve',
    dimensions: [
      {
        label: 'Cashflow Liquidity',
        value: 84,
        delta: '+7',
        signal: 'UPI inflow volatility down 18%',
        tone: 'good',
      },
      {
        label: 'Credit Discipline',
        value: 78,
        delta: '+3',
        signal: 'No cheque bounce in 180 days',
        tone: 'good',
      },
      {
        label: 'Compliance Health',
        value: 91,
        delta: '+11',
        signal: 'GST filings on time for 12 months',
        tone: 'good',
      },
      {
        label: 'Concentration Risk',
        value: 63,
        delta: '-4',
        signal: 'Top buyer contributes 43% revenue',
        tone: 'watch',
      },
      {
        label: 'Growth Trajectory',
        value: 86,
        delta: '+14',
        signal: 'Quarterly GST sales CAGR 16%',
        tone: 'good',
      },
      {
        label: 'Working Capital Efficiency',
        value: 72,
        delta: '+5',
        signal: 'DSO improved from 54 to 41 days',
        tone: 'watch',
      },
    ],
    features: [
      { label: 'GST consistency', value: '97%', status: 'verified' },
      { label: 'UPI settlement depth', value: '18.4k txns', status: 'rich' },
      { label: 'EPFO continuity', value: '23 employees', status: 'steady' },
      { label: 'Bank statement coverage', value: '14 months', status: 'complete' },
    ],
    reasons: [
      {
        factor: 'GST filing regularity',
        impact: 13,
        text: 'Monthly returns align with reported bank inflows and reduce documentation risk.',
      },
      {
        factor: 'Buyer concentration',
        impact: -8,
        text: 'One anchor buyer dominates receipts, so the guardian caps the initial exposure.',
      },
      {
        factor: 'Salary stability',
        impact: 6,
        text: 'EPFO deposits show stable payroll and lower operational churn.',
      },
    ],
    cashflow: [45, 51, 56, 61, 58, 67, 72, 78, 82, 85, 91, 96],
  },
  {
    id: 'meghdoot',
    name: 'Meghdoot Agro Foods',
    sector: 'Food processing',
    location: 'Nashik, MH',
    ask: 'INR 28L invoice-backed loan',
    composite: 69,
    decision: 'Review with mitigants',
    dimensions: [
      {
        label: 'Cashflow Liquidity',
        value: 68,
        delta: '+2',
        signal: 'Seasonal inflows, high harvest variance',
        tone: 'watch',
      },
      {
        label: 'Credit Discipline',
        value: 74,
        delta: '+6',
        signal: 'One EMI delay, cured in 5 days',
        tone: 'watch',
      },
      {
        label: 'Compliance Health',
        value: 81,
        delta: '+9',
        signal: 'GST regular after April correction',
        tone: 'good',
      },
      {
        label: 'Concentration Risk',
        value: 52,
        delta: '-12',
        signal: 'Two buyers carry 61% of invoices',
        tone: 'risk',
      },
      {
        label: 'Growth Trajectory',
        value: 76,
        delta: '+10',
        signal: 'Rising UPI wholesale receipts',
        tone: 'good',
      },
      {
        label: 'Working Capital Efficiency',
        value: 62,
        delta: '-3',
        signal: 'Inventory cycle lengthened by 9 days',
        tone: 'watch',
      },
    ],
    features: [
      { label: 'GST consistency', value: '88%', status: 'verified' },
      { label: 'UPI settlement depth', value: '8.1k txns', status: 'usable' },
      { label: 'EPFO continuity', value: '11 employees', status: 'thin' },
      { label: 'Bank statement coverage', value: '9 months', status: 'partial' },
    ],
    reasons: [
      {
        factor: 'Seasonality stress',
        impact: -7,
        text: 'Cash receipts dip sharply outside procurement windows.',
      },
      {
        factor: 'GST-bank reconciliation',
        impact: 10,
        text: 'Declared turnover reconciles with deposits inside tolerance.',
      },
      {
        factor: 'Invoice concentration',
        impact: -12,
        text: 'The swarm recommends invoice-level collateral routing.',
      },
    ],
    cashflow: [42, 48, 63, 74, 88, 81, 59, 53, 61, 66, 72, 78],
  },
]

const swarmAgents = [
  {
    name: 'Perceiver',
    role: 'AA, GST, UPI, EPFO ingestion',
    tier: 'Tier 2 CPU',
    health: 98,
    icon: DatabaseZap,
    detail: 'Normalizes consented data and flags gaps before scoring.',
  },
  {
    name: 'Planner',
    role: 'Credit action planner',
    tier: 'Tier 1 LLM',
    health: 94,
    icon: GitBranch,
    detail: 'Chooses score path, loan structure, and mitigants.',
  },
  {
    name: 'Guardian',
    role: 'Policy and injection defense',
    tier: 'Always-on rules',
    health: 100,
    icon: ShieldCheck,
    detail: 'Blocks unsafe recommendations and signs each decision.',
  },
  {
    name: 'Recoverer',
    role: 'Partial-data fallback',
    tier: 'Tier 3 light',
    health: 91,
    icon: RefreshCw,
    detail: 'Keeps decisioning alive when connectors fail or data is thin.',
  },
]

const events = [
  'AA consent token issued for GST, bank, EPFO, and UPI sources',
  'Perceiver mapped 214 features with 96% schema confidence',
  'Planner selected working-capital path with buyer cap',
  'Guardian signed decision with HMAC audit seal',
]

const federatedRounds = [
  { bank: 'IDBI sandbox', auc: '0.86', drift: 'low', samples: '18.2k' },
  { bank: 'NBFC partner A', auc: '0.83', drift: 'medium', samples: '11.7k' },
  { bank: 'Co-op bank node', auc: '0.81', drift: 'medium', samples: '7.4k' },
]

const navItems = [
  { key: 'health', label: 'Health Card', icon: Gauge },
  { key: 'swarm', label: 'Swarm', icon: Network },
  { key: 'explain', label: 'Explainability', icon: Eye },
  { key: 'security', label: 'Guardian', icon: LockKeyhole },
  { key: 'federated', label: 'Federated', icon: Landmark },
] as const

function scenarioOffset(scenario: Scenario) {
  if (scenario === 'thinData') return -7
  if (scenario === 'stress') return -13
  if (scenario === 'attack') return -21
  return 0
}

function scoreTone(score: number) {
  if (score >= 78) return 'good'
  if (score >= 62) return 'watch'
  return 'risk'
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value))
}

function Sparkline({ points }: { points: number[] }) {
  const width = 260
  const height = 86
  const min = Math.min(...points) - 8
  const max = Math.max(...points) + 8
  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width
    const y = height - ((point - min) / (max - min)) * height
    return `${x},${y}`
  })

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img">
      <title>Cashflow trend</title>
      <polyline points={coords.join(' ')} />
      {points.map((point, index) => {
        const x = (index / (points.length - 1)) * width
        const y = height - ((point - min) / (max - min)) * height
        return <circle key={`${point}-${index}`} cx={x} cy={y} r="3" />
      })}
    </svg>
  )
}

function Radar({ dimensions }: { dimensions: Dimension[] }) {
  const size = 260
  const center = size / 2
  const radius = 98
  const points = dimensions.map((dimension, index) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    const distance = (dimension.value / 100) * radius
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
      labelX: center + Math.cos(angle) * (radius + 24),
      labelY: center + Math.sin(angle) * (radius + 24),
      short: dimension.label
        .split(' ')
        .map((word) => word[0])
        .join(''),
    }
  })

  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img">
      <title>Six dimension MSME score radar</title>
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          className="radar-grid"
          points={dimensions
            .map((_, index) => {
              const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
              return `${center + Math.cos(angle) * radius * scale},${
                center + Math.sin(angle) * radius * scale
              }`
            })
            .join(' ')}
        />
      ))}
      {points.map((point, index) => (
        <line
          key={`axis-${index}`}
          className="radar-axis"
          x1={center}
          y1={center}
          x2={point.labelX}
          y2={point.labelY}
        />
      ))}
      <polygon className="radar-score" points={points.map((point) => `${point.x},${point.y}`).join(' ')} />
      {points.map((point, index) => (
        <text key={`label-${index}`} x={point.labelX} y={point.labelY} textAnchor="middle">
          {point.short}
        </text>
      ))}
    </svg>
  )
}

function App() {
  const [selectedId, setSelectedId] = useState(enterprises[0].id)
  const [activeTab, setActiveTab] = useState<(typeof navItems)[number]['key']>('health')
  const [scenario, setScenario] = useState<Scenario>('baseline')
  const [runCount, setRunCount] = useState(1)

  const enterprise = enterprises.find((item) => item.id === selectedId) ?? enterprises[0]
  const activeScore = clampScore(enterprise.composite + scenarioOffset(scenario))
  const activeTone = scoreTone(activeScore)
  const adjustedDimensions = useMemo(
    () =>
      enterprise.dimensions.map((dimension, index) => ({
        ...dimension,
        value: clampScore(
          dimension.value +
            scenarioOffset(scenario) +
            (scenario === 'thinData' && index % 2 === 0 ? -4 : 0) +
            (scenario === 'attack' && dimension.label.includes('Compliance') ? -15 : 0),
        ),
      })),
    [enterprise, scenario],
  )

  const guardianVerdict =
    scenario === 'attack'
      ? 'Blocked prompt injection and spoofed planner identity'
      : scenario === 'stress'
        ? 'Warned: exposure cap and collateral routing required'
        : 'Approved with signed audit seal'

  const scenarioLabel =
    scenario === 'baseline'
      ? 'Baseline'
      : scenario === 'thinData'
        ? 'Thin data'
        : scenario === 'stress'
          ? 'Stress test'
          : 'Attack sim'

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Nemesis navigation">
        <div className="brand-block">
          <div className="brand-mark">
            <LineChart size={24} />
          </div>
          <div>
            <p className="eyebrow">IDBI Innovate Track 03</p>
            <h1>Nemesis</h1>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                className={activeTab === item.key ? 'nav-item active' : 'nav-item'}
                type="button"
                onClick={() => setActiveTab(item.key)}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-panel">
          <p className="eyebrow">Live decision clock</p>
          <div className="metric-row">
            <Clock3 size={18} />
            <strong>00:48</strong>
            <span>to score</span>
          </div>
          <div className="metric-row">
            <Zap size={18} />
            <strong>{runCount}</strong>
            <span>scoring runs</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">MSME financial health swarm</p>
            <h2>Enterprise mirror for creditworthiness, consent, and explainability</h2>
          </div>
          <div className="topbar-actions">
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-label="Enterprise">
              {enterprises.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setRunCount((count) => count + 1)
                setScenario((value) =>
                  value === 'baseline'
                    ? 'thinData'
                    : value === 'thinData'
                      ? 'stress'
                      : value === 'stress'
                        ? 'attack'
                        : 'baseline',
                )
              }}
            >
              <Play size={16} />
              Run scenario
            </button>
          </div>
        </header>

        <section className="summary-grid" aria-label="Nemesis summary">
          <article className={`score-card ${activeTone}`}>
            <div>
              <p className="eyebrow">Composite health score</p>
              <strong>{activeScore}</strong>
            </div>
            <span>{enterprise.decision}</span>
          </article>
          <article>
            <Building2 size={22} />
            <div>
              <p className="eyebrow">Enterprise</p>
              <strong>{enterprise.name}</strong>
              <span>{enterprise.sector}</span>
            </div>
          </article>
          <article>
            <Banknote size={22} />
            <div>
              <p className="eyebrow">Request</p>
              <strong>{enterprise.ask}</strong>
              <span>{enterprise.location}</span>
            </div>
          </article>
          <article>
            <ShieldCheck size={22} />
            <div>
              <p className="eyebrow">Guardian verdict</p>
              <strong>{scenarioLabel}</strong>
              <span>{guardianVerdict}</span>
            </div>
          </article>
        </section>

        {activeTab === 'health' && (
          <section className="content-grid two-column">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Financial Health Card</p>
                  <h3>Six-dimensional score</h3>
                </div>
                <Gauge size={22} />
              </div>
              <div className="radar-layout">
                <Radar dimensions={adjustedDimensions} />
                <div className="dimension-list">
                  {adjustedDimensions.map((dimension) => (
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
              <Sparkline points={enterprise.cashflow.map((value) => clampScore(value + scenarioOffset(scenario)))} />
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
          </section>
        )}

        {activeTab === 'swarm' && (
          <section className="content-grid">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Eraya-inspired cascade</p>
                  <h3>Four-agent financial swarm</h3>
                </div>
                <Network size={22} />
              </div>
              <div className="agent-grid">
                {swarmAgents.map((agent) => {
                  const Icon = agent.icon
                  return (
                    <div key={agent.name} className="agent-tile">
                      <div className="agent-icon">
                        <Icon size={22} />
                      </div>
                      <div>
                        <strong>{agent.name}</strong>
                        <span>{agent.role}</span>
                        <p>{agent.detail}</p>
                      </div>
                      <div className="health-bar" aria-label={`${agent.name} health ${agent.health}`}>
                        <i style={{ width: `${agent.health}%` }} />
                      </div>
                      <small>{agent.tier}</small>
                    </div>
                  )
                })}
              </div>
            </article>

            <article className="panel compact-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">A2A event stream</p>
                  <h3>Decision path</h3>
                </div>
                <GitBranch size={22} />
              </div>
              <ol className="event-list">
                {events.map((event, index) => (
                  <li key={event}>
                    <span>{index + 1}</span>
                    <p>{event}</p>
                  </li>
                ))}
              </ol>
            </article>
          </section>
        )}

        {activeTab === 'explain' && (
          <section className="content-grid two-column">
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
          </section>
        )}

        {activeTab === 'security' && (
          <section className="content-grid two-column">
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
                {scenario === 'attack'
                  ? 'A spoofed planner attempted to override exposure caps. Guardian rejected the message, quarantined the action path, and issued a signed audit record.'
                  : 'Guardian is monitoring consent drift, prompt injection, high-risk exposure, and incomplete-data overrides.'}
              </p>
              <div className="audit-seal">
                <span>Audit seal</span>
                <strong>nemesis-{runCount.toString().padStart(4, '0')}-a9f3c1</strong>
              </div>
            </article>
          </section>
        )}

        {activeTab === 'federated' && (
          <section className="content-grid">
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
                {federatedRounds.map((round) => (
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
          </section>
        )}
      </section>
    </main>
  )
}

export default App
