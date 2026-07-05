import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  Banknote,
  Building2,
  DatabaseZap,
  Gauge,
  GitBranch,
  LineChart,
  Network,
  Play,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { fetchHealthCard, fetchIntegrationSummary } from './lib/nemesis-api'
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

type BackendAgent = {
  name: string
  role: string
  tier: string
  health: number
  detail: string
}

type BackendHealthCard = {
  scenario: { key: Scenario; label: string }
  enterprise: Enterprise
  connectors: Record<string, unknown>
  guardian: {
    verdict: string
    audit_id: string
    signature_preview: string
    findings: { severity: string; rule: string; message: string }[]
  }
  benchmark: {
    indicative_decision_ms: number
    model_confidence: number
    reason_code_coverage: string
    synthetic_peer_percentile: number
    tier_used: string
  }
  swarm_agents: BackendAgent[]
  events: string[]
  federated_rounds: { bank: string; auc: string; drift: string; samples: string }[]
  architecture_nodes: {
    layer: string
    name: string
    components: string[]
    status: string
  }[]
}

type IntegrationSummary = {
  catalog: Array<{ name: string; category: string; status: string; purpose: string }>
  credit_memo: {
    tool: string
    mode: string
    memo: {
      summary: string
      decision: string
      mitigants: string[]
      borrower_advice: string[]
    }
  }
  external_verification: { tool: string; mode: string; signals: string[] }
  policy: { tool: string; mode: string; result: { allow?: boolean; reason?: string } }
  model_monitor: { score_mean?: number; confidence_mean?: number; drift_alerts?: string[] }
  data_quality: { expectations?: { enterprise_id: string; passed: number; total: number }[] }
  document_intelligence: { supported_docs?: string[]; extracted_fields?: string[] }
  memory: { qdrant_status?: string | Record<string, unknown>; collections?: string[] }
  operations: {
    observability?: { tool?: string; metrics?: string[] }
    storage?: { tool?: string; buckets?: string[] }
    workspace?: { tool?: string; workflows?: string[] }
    agent_graph?: { tool?: string; nodes?: string[] }
  }
}

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
      { label: 'Cashflow Liquidity', value: 84, delta: '+7', signal: 'UPI inflow volatility down 18%', tone: 'good' },
      { label: 'Credit Discipline', value: 78, delta: '+3', signal: 'No cheque bounce in 180 days', tone: 'good' },
      { label: 'Compliance Health', value: 91, delta: '+11', signal: 'GST filings on time for 12 months', tone: 'good' },
      { label: 'Concentration Risk', value: 63, delta: '-4', signal: 'Top buyer contributes 43% revenue', tone: 'watch' },
      { label: 'Growth Trajectory', value: 86, delta: '+14', signal: 'Quarterly GST sales CAGR 16%', tone: 'good' },
      { label: 'Working Capital Efficiency', value: 72, delta: '+5', signal: 'DSO improved from 54 to 41 days', tone: 'watch' },
    ],
    features: [
      { label: 'GST consistency', value: '97%', status: 'verified' },
      { label: 'UPI settlement depth', value: '18.4k txns', status: 'rich' },
      { label: 'EPFO continuity', value: '23 employees', status: 'steady' },
      { label: 'Bank statement coverage', value: '14 months', status: 'complete' },
    ],
    reasons: [
      { factor: 'GST filing regularity', impact: 13, text: 'Monthly returns align with reported bank inflows and reduce documentation risk.' },
      { factor: 'Buyer concentration', impact: -8, text: 'One anchor buyer dominates receipts, so the Guardian caps the initial exposure.' },
      { factor: 'Salary stability', impact: 6, text: 'EPFO deposits show stable payroll and lower operational churn.' },
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
      { label: 'Cashflow Liquidity', value: 68, delta: '+2', signal: 'Seasonal inflows, high harvest variance', tone: 'watch' },
      { label: 'Credit Discipline', value: 74, delta: '+6', signal: 'One EMI delay, cured in 5 days', tone: 'watch' },
      { label: 'Compliance Health', value: 81, delta: '+9', signal: 'GST regular after April correction', tone: 'good' },
      { label: 'Concentration Risk', value: 52, delta: '-12', signal: 'Two buyers carry 61% of invoices', tone: 'risk' },
      { label: 'Growth Trajectory', value: 76, delta: '+10', signal: 'Rising UPI wholesale receipts', tone: 'good' },
      { label: 'Working Capital Efficiency', value: 62, delta: '-3', signal: 'Inventory cycle lengthened by 9 days', tone: 'watch' },
    ],
    features: [
      { label: 'GST consistency', value: '88%', status: 'verified' },
      { label: 'UPI settlement depth', value: '8.1k txns', status: 'usable' },
      { label: 'EPFO continuity', value: '11 employees', status: 'thin' },
      { label: 'Bank statement coverage', value: '9 months', status: 'partial' },
    ],
    reasons: [
      { factor: 'Seasonality stress', impact: -7, text: 'Cash receipts dip sharply outside procurement windows.' },
      { factor: 'GST-bank reconciliation', impact: 10, text: 'Declared turnover reconciles with deposits inside tolerance.' },
      { factor: 'Invoice concentration', impact: -12, text: 'The swarm recommends invoice-level collateral routing.' },
    ],
    cashflow: [42, 48, 63, 74, 88, 81, 59, 53, 61, 66, 72, 78],
  },
]

const fallbackAgents = [
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

const fallbackEvents = [
  'AA consent token issued for GST, bank, EPFO, and UPI sources',
  'Perceiver mapped 214 features with 96% schema confidence',
  'Planner selected working-capital path with buyer cap',
  'Guardian signed decision with HMAC audit seal',
]

const fallbackFederatedRounds = [
  { bank: 'IDBI sandbox', auc: '0.86', drift: 'low', samples: '18.2k' },
  { bank: 'NBFC partner A', auc: '0.83', drift: 'medium', samples: '11.7k' },
  { bank: 'Co-op bank node', auc: '0.81', drift: 'medium', samples: '7.4k' },
]

const navItems = [
  { label: 'Overview', href: '#overview' },
  { label: 'Health', href: '#health-card' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Guardian', href: '#guardian' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'API', href: '#api' },
]

const subdomainLinks = [
  { label: 'app.nemesis', href: '#overview' },
  { label: 'score.nemesis', href: '#health-card' },
  { label: 'agents.nemesis', href: '#workflow' },
  { label: 'guardian.nemesis', href: '#guardian' },
  { label: 'api.nemesis', href: '#api' },
]

const consoleWords = [
  'GST GRAPH',
  'UPI FLOW',
  'AI MEMO',
  'GUARDIAN',
  'RISK BAND',
  'TABPFN',
  'CASHFLOW',
  'CONSENT',
  'OCEN',
  'HMAC',
  'SWARM',
  'QDRANT',
]

const endpoints = [
  ['GET', '/api/v1/health-card', 'score, reason codes, connectors, audit'],
  ['POST', '/api/v1/scenario/run', 'baseline, thin-data, stress, attack'],
  ['GET', '/api/v1/integrations/summary', 'Groq, Firecrawl, OPA, monitoring'],
  ['GET', '/api/v1/connectors/snapshot', 'AA, GSTN, UPI, EPFO, OCEN, ULI'],
  ['GET', '/metrics', 'Prometheus-ready service metrics'],
]

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
  const width = 320
  const height = 110
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
        return <circle key={`${point}-${index}`} cx={x} cy={y} r="3.5" />
      })}
    </svg>
  )
}

function Radar({ dimensions }: { dimensions: Dimension[] }) {
  const size = 300
  const center = size / 2
  const radius = 108
  const points = dimensions.map((dimension, index) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    const distance = (dimension.value / 100) * radius
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
      labelX: center + Math.cos(angle) * (radius + 28),
      labelY: center + Math.sin(angle) * (radius + 28),
      short: dimension.label
        .split(' ')
        .map((word) => word[0])
        .join(''),
    }
  })

  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img">
      <title>Six-dimension MSME score radar</title>
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
        <line key={`axis-${index}`} className="radar-axis" x1={center} y1={center} x2={point.labelX} y2={point.labelY} />
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

function App({ onHome }: { onHome?: () => void } = {}) {
  const [selectedId, setSelectedId] = useState(enterprises[0].id)
  const [scenario, setScenario] = useState<Scenario>('baseline')
  const [runCount, setRunCount] = useState(1)
  const [apiCard, setApiCard] = useState<BackendHealthCard | null>(null)
  const [integrationSummary, setIntegrationSummary] = useState<IntegrationSummary | null>(null)
  const [apiStatus, setApiStatus] = useState<'connecting' | 'live' | 'fallback'>('connecting')

  useEffect(() => {
    let cancelled = false
    setApiStatus('connecting')
    fetchHealthCard(selectedId, scenario)
      .then((card: BackendHealthCard) => {
        if (!cancelled) {
          setApiCard(card)
          setApiStatus('live')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiCard(null)
          setApiStatus('fallback')
        }
      })
    return () => {
      cancelled = true
    }
  }, [selectedId, scenario])

  useEffect(() => {
    let cancelled = false
    fetchIntegrationSummary(selectedId, scenario)
      .then((summary: IntegrationSummary) => {
        if (!cancelled) {
          setIntegrationSummary(summary)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIntegrationSummary(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [selectedId, scenario])

  const fallbackEnterprise = enterprises.find((item) => item.id === selectedId) ?? enterprises[0]
  const enterprise = apiCard?.enterprise ?? fallbackEnterprise
  const activeScore = apiCard ? enterprise.composite : clampScore(enterprise.composite + scenarioOffset(scenario))
  const activeTone = scoreTone(activeScore)
  const adjustedDimensions = useMemo(
    () =>
      apiCard
        ? enterprise.dimensions
        : enterprise.dimensions.map((dimension, index) => ({
            ...dimension,
            value: clampScore(
              dimension.value +
                scenarioOffset(scenario) +
                (scenario === 'thinData' && index % 2 === 0 ? -4 : 0) +
                (scenario === 'attack' && dimension.label.includes('Compliance') ? -15 : 0),
            ),
          })),
    [apiCard, enterprise, scenario],
  )

  const scenarioLabel =
    apiCard?.scenario.label ??
    (scenario === 'baseline'
      ? 'Baseline'
      : scenario === 'thinData'
        ? 'Thin data'
        : scenario === 'stress'
          ? 'Stress test'
          : 'Attack sim')

  const renderedAgents = (apiCard?.swarm_agents ?? fallbackAgents).map((agent) => {
    const staticAgent = fallbackAgents.find((item) => item.name === agent.name)
    return { ...agent, icon: staticAgent?.icon ?? Network }
  })
  const renderedEvents = apiCard?.events ?? fallbackEvents
  const renderedFederatedRounds = apiCard?.federated_rounds ?? fallbackFederatedRounds
  const guardianFinding =
    apiCard?.guardian.findings[0]?.message ??
    (scenario === 'attack'
      ? 'Unsafe override attempt blocked and signed into audit.'
      : 'Consent, explainability, and threshold gates are active.')
  const memo = integrationSummary?.credit_memo.memo
  const catalog = integrationSummary?.catalog ?? []

  return (
    <main className="tesla-site">
      <div className="console-aurora" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="console-word-field" aria-hidden="true">
        {consoleWords.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </div>
      <header className="site-header">
        <a className="brand-link" href="#overview" aria-label="Nemesis home">
          <LineChart size={22} />
          <span>Nemesis</span>
        </a>
        <nav className="desktop-nav" aria-label="Site sections">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-right">
          {onHome && (
            <button type="button" className="header-home" onClick={onHome}>
              <ArrowLeft size={16} />
              Back
            </button>
          )}
          <a className="header-action" href="#api">
            {apiStatus === 'live' ? 'Live API' : apiStatus === 'connecting' ? 'Connecting' : 'Demo Mode'}
          </a>
        </div>
      </header>

      <section id="overview" className="snap-section hero-section">
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="section-kicker">IDBI Innovate 2026</p>
          <h1>Nemesis</h1>
          <p className="hero-subtitle">
            MSME Financial Health Card, AI credit memo, Guardian audit, and integration-ready underwriting in one
            full-stack prototype.
          </p>
          <div className="hero-meta">
            <span>Score {activeScore}/100</span>
            <span>{scenarioLabel}</span>
            <span>{enterprise.name}</span>
          </div>
          <div className="subdomain-strip" aria-label="Nemesis product subdomains">
            {subdomainLinks.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="hero-console">
          <div className={`score-ring ${activeTone}`}>
            <span>Health Score</span>
            <strong>{activeScore}</strong>
            <small>{enterprise.decision}</small>
          </div>
          <div className="hero-controls">
            <label>
              Enterprise
              <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-label="Enterprise">
                {enterprises.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
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
        </div>

        <a className="scroll-cue" href="#health-card" aria-label="Scroll to Health Card">
          <ArrowDown size={26} />
        </a>
      </section>

      <section id="health-card" className="snap-section product-section health-section">
        <div className="section-copy">
          <p className="section-kicker">Financial Health Card</p>
          <h2>Six dimensions. One explainable score.</h2>
          <p>
            Nemesis turns alternate data into a clear scorecard for IDBI teams and borrower-facing improvement
            guidance for MSMEs.
          </p>
          <div className="quick-stats">
            <span>
              <Building2 size={18} />
              {enterprise.sector}
            </span>
            <span>
              <Banknote size={18} />
              {enterprise.ask}
            </span>
            <span>
              <ShieldCheck size={18} />
              {apiCard?.guardian.verdict ?? 'APPROVED'}
            </span>
          </div>
        </div>

        <div className="glass-panel health-panel">
          <Radar dimensions={adjustedDimensions} />
          <div className="health-data-stack">
            <div className="cashflow-strip">
              <div>
                <strong>Cashflow signal</strong>
                <span>Alternate-data monthly trend</span>
              </div>
              <Sparkline points={enterprise.cashflow.map((value) => clampScore(value + scenarioOffset(scenario)))} />
            </div>
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
        </div>
      </section>

      <section id="workflow" className="snap-section product-section workflow-section">
        <div className="section-copy centered">
          <p className="section-kicker">Workflow</p>
          <h2>Consent to decision, with agents in the loop.</h2>
          <p>Perceiver maps data, Planner structures credit action, Guardian validates policy, Recoverer handles gaps.</p>
        </div>
        <div className="agent-row">
          {renderedAgents.map((agent) => {
            const Icon = agent.icon
            return (
              <article key={agent.name} className="agent-card">
                <Icon size={24} />
                <strong>{agent.name}</strong>
                <span>{agent.role}</span>
                <div className="health-bar" aria-label={`${agent.name} health ${agent.health}`}>
                  <i style={{ width: `${agent.health}%` }} />
                </div>
                <small>{agent.tier}</small>
              </article>
            )
          })}
        </div>
        <ol className="event-strip">
          {renderedEvents.map((event, index) => (
            <li key={event}>
              <span>{index + 1}</span>
              <p>{event}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="guardian" className="snap-section split-section guardian-section">
        <div className="section-copy">
          <p className="section-kicker">Guardian + AI Credit Officer</p>
          <h2>Fast decisions, checked before they move.</h2>
          <p>{guardianFinding}</p>
          <div className="audit-seal">
            <span>Audit Seal</span>
            <strong>{apiCard?.guardian.signature_preview ?? `nemesis-${runCount.toString().padStart(4, '0')}-a9f3c1`}</strong>
          </div>
        </div>

        <div className="glass-panel memo-card">
          <span className="mode-pill">{integrationSummary?.credit_memo.mode ?? 'fallback'}</span>
          <h3>{memo?.summary ?? `${enterprise.name} is ready for a policy-checked AI credit memo.`}</h3>
          <div className="memo-columns">
            <div>
              <strong>Mitigants</strong>
              {(memo?.mitigants ?? ['Cap exposure until buyer concentration improves.', 'Monitor GST-bank reconciliation monthly.']).map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
            <div>
              <strong>Borrower Advice</strong>
              {(memo?.borrower_advice ?? ['Shorten receivable cycles.', 'Grow repeat customers across more buyers.']).map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="integrations" className="snap-section product-section integrations-section">
        <div className="section-copy centered">
          <p className="section-kicker">Advanced Integrations</p>
          <h2>AI, verification, policy, storage, memory, and observability.</h2>
          <p>
            All adapters are demo-safe: live when keys or services exist, deterministic fallback when they do not.
          </p>
        </div>

        <div className="integration-grid">
          {(catalog.length ? catalog : [
            { name: 'Groq AI', category: 'AI credit officer', status: 'fallback', purpose: 'Structured credit memo and planner rationale.' },
            { name: 'Firecrawl', category: 'External verification', status: 'fallback', purpose: 'MSME web footprint and supplier context.' },
            { name: 'OPA', category: 'Policy engine', status: 'local-rules', purpose: 'External Rego-ready underwriting gates.' },
            { name: 'Tinybird', category: 'Real-time analytics', status: 'fallback', purpose: 'Score runs and Guardian event stream.' },
            { name: 'Qdrant / Chroma', category: 'Vector memory', status: 'docker-ready', purpose: 'Credit memo and policy document memory.' },
            { name: 'MinIO + Grafana', category: 'Operations', status: 'docker-ready', purpose: 'Storage, metrics, traces, and dashboards.' },
          ]).slice(0, 8).map((tool) => (
            <article key={tool.name} className="integration-card">
              <strong>{tool.name}</strong>
              <span>{tool.category}</span>
              <p>{tool.purpose}</p>
              <b>{tool.status}</b>
            </article>
          ))}
        </div>
      </section>

      <section id="api" className="snap-section split-section api-section">
        <div className="section-copy">
          <p className="section-kicker">Directories + API</p>
          <h2>Every major surface has a direct path.</h2>
          <p>
            The site now behaves like a product showcase with direct section links, while the backend exposes runnable
            endpoints for scoring, policy, integrations, and metrics.
          </p>
          <div className="directory-map">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {item.href}
              </a>
            ))}
            {subdomainLinks.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="glass-panel api-panel">
          {endpoints.map(([method, path, detail]) => (
            <div key={path} className="endpoint-row">
              <b>{method}</b>
              <div>
                <strong>{path}</strong>
                <span>{detail}</span>
              </div>
            </div>
          ))}
          <div className="benchmark-row">
            <span>
              <Gauge size={18} />
              {apiCard ? `${Math.round(apiCard.benchmark.model_confidence * 100)}% confidence` : '86% confidence'}
            </span>
            <span>
              <Activity size={18} />
              {apiCard?.benchmark.tier_used ?? 'tier2_tabular'}
            </span>
          </div>
        </div>
      </section>

      <section className="snap-section product-section closing-section">
        <div className="section-copy centered">
          <p className="section-kicker">Deployment Ready</p>
          <h2>Built for a live hackathon walkthrough.</h2>
          <p>Frontend, FastAPI backend, Docker Compose stack, policy files, metrics, and slide draft are in the repo.</p>
        </div>
        <div className="federated-table glass-panel">
          <div className="table-head">
            <span>Node</span>
            <span>AUROC</span>
            <span>Drift</span>
            <span>Samples</span>
          </div>
          {renderedFederatedRounds.map((round) => (
            <div key={round.bank} className="table-row">
              <strong>{round.bank}</strong>
              <span>{round.auc}</span>
              <span>{round.drift}</span>
              <span>{round.samples}</span>
            </div>
          ))}
        </div>
        <footer className="site-footer">
          <span>Nemesis IDBI Hackathon</span>
          <span>React + FastAPI + Guardian + Integrations</span>
        </footer>
      </section>
    </main>
  )
}

export default App
