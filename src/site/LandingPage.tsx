import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  FileDown,
  Gauge,
  LineChart,
  MessagesSquare,
  Network,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import './site.css'

const NAV = [
  { href: '#platform', label: 'Platform' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#technology', label: 'Technology' },
  { href: '#impact', label: 'Impact' },
]

const POWERED = ['Groq', 'Hugging Face', 'TabPFN', 'Firecrawl', 'Sarvam AI', 'Pinecone', 'OPA', 'Qdrant']

type FloatingTone = 'soft' | 'strong' | 'hot'

type FloatingWord = {
  text: string
  x: string
  y: string
  delay: string
  duration: string
  tone: FloatingTone
}

const WORD_POOL = [
  'GST',
  'UPI',
  'AA CONSENT',
  'EPFO',
  'GROQ',
  'GUARDIAN',
  'SHAP',
  'OCEN',
  'ULI',
  'HMAC',
  'QDRANT',
  'FIRECRAWL',
  'TABPFN',
  'PD SCORE',
  'ROC 0.83',
  'CONSENT',
  'RISK BAND',
  'CASHFLOW',
]

const TONES: FloatingTone[] = ['strong', 'soft', 'hot']

function createFloatingWords(): FloatingWord[] {
  return WORD_POOL.map((text, index) => ({
    text,
    x: `${4 + Math.random() * 86}%`,
    y: `${8 + Math.random() * 78}%`,
    delay: `${(index % 7) * 0.55}s`,
    duration: `${7.8 + Math.random() * 4.4}s`,
    tone: TONES[index % TONES.length],
  }))
}

const AUDIENCE_TABS = [
  {
    key: 'Underwriter',
    title: 'Decisions you can defend',
    body: 'Every score arrives with coefficient-level reason codes, a Guardian policy verdict, and an HMAC-signed audit envelope — approve, review, or decline with a paper trail regulators accept.',
  },
  {
    key: 'Relationship Manager',
    title: 'A whole book at a glance',
    body: 'The portfolio command center ranks every MSME by risk, charts the score distribution, and surfaces an early-warning queue so you act the week cashflow slips, not the quarter after.',
  },
  {
    key: 'MSME Owner',
    title: 'Know exactly how to qualify',
    body: 'The What-If Lab shows the borrower which single lever — GST timeliness, buyer concentration, DSO — moves their score the most, turning a rejection into a roadmap.',
  },
  {
    key: 'Auditor',
    title: 'Guardrails on every step',
    body: 'Consent scope, prompt-injection defense, PII redaction, and a guarded agent-to-agent channel are enforced before any recommendation is issued or any model is called.',
  },
]

const DATA_TABS = [
  { key: 'Score', body: 'A six-dimension Financial Health Card plus a trained probability-of-default model — logistic scorecard and gradient boosting — with a live credit score and band.' },
  { key: 'Simulate', body: 'Drag any lever and the six dimensions and composite score recompute instantly, backed by the same engine that makes the real decision, with an offline mirror for demos.' },
  { key: 'Portfolio', body: 'Twelve synthetic MSMEs across sectors and geographies, a risk-tier distribution, requested-exposure totals, and a rule-based early-warning alerts queue.' },
  { key: 'Chat', body: 'Ask the AI Credit Officer why an MSME scored the way it did — grounded in the live health card, Groq-powered, and screened by Guardian on every message.' },
]

const CAPABILITIES = [
  { icon: Brain, title: 'Trained credit model', body: 'Logistic scorecard + gradient boosting on alternate data, with ROC, calibration, gains and PSI validation.' },
  { icon: SlidersHorizontal, title: 'What-If Lab', body: 'Interactive counterfactual sliders that recompute the score live and reveal the fastest path to approval.' },
  { icon: TrendingUp, title: 'Portfolio command center', body: 'Bank-side book view with distribution, risk tiers, and an early-warning alerts queue.' },
  { icon: MessagesSquare, title: 'AI Credit Officer', body: 'Guardian-screened chat over the live health card, Groq-powered with a deterministic fallback.' },
  { icon: Network, title: 'Guarded agent swarm', body: 'Four small LLMs negotiate over an agent-to-agent channel with injection and PII guardrails on every hop.' },
  { icon: FileDown, title: 'One-click PDF card', body: 'A bank-ready Financial Health Card with score, reason codes, and the audit signature.' },
]

const TECH = [
  { title: 'AI/ML at the core', body: 'A probability-of-default model trained on a synthetic MSME population — AUROC 0.83, KS 0.52, Gini 0.66 — with exact coefficient-based reason codes.' },
  { title: 'Two HF foundation models (<200M)', body: 'TabPFN as a tabular foundation model in the PD ensemble, and all-MiniLM-L6-v2 (22M) for semantic peer benchmarking.' },
  { title: 'Guardian trust layer', body: 'Consent scope, injection defense, PII redaction, unsafe-approval blocks, and HMAC-signed audit envelopes on every decision.' },
  { title: 'Integration-ready', body: 'Seventeen fallback-safe adapters spanning AA, GSTN, UPI, EPFO, OCEN, ULI, and a modern AI/observability stack.' },
]

const STATS = [
  { value: '0.83', label: 'Model AUROC', hint: 'trained PD scorecard' },
  { value: '+28 pts', label: 'Approval uplift', hint: 'vs document-based underwriting' },
  { value: '6', label: 'Score dimensions', hint: 'from alternate data' },
  { value: '17', label: 'Integration adapters', hint: 'AA · GSTN · UPI · EPFO · OCEN · ULI' },
]

function HealthCardMock() {
  const dims = [84, 78, 91, 63, 86, 72]
  const score = 82
  const r = 52
  const circumference = 2 * Math.PI * r
  return (
    <div className="hc-mock">
      <div className="hc-mock-head">
        <span>Suryam Precision Tools</span>
        <b className="hc-verdict">Guardian · Approved</b>
      </div>
      <div className="hc-mock-body">
        <div className="hc-dial">
          <svg viewBox="0 0 128 128" role="img" aria-label="Composite health score">
            <circle cx="64" cy="64" r={r} className="hc-track" />
            <circle
              cx="64"
              cy="64"
              r={r}
              className="hc-arc"
              strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
              transform="rotate(-90 64 64)"
            />
            <text x="64" y="60" textAnchor="middle" className="hc-score">{score}</text>
            <text x="64" y="80" textAnchor="middle" className="hc-score-label">/ 100</text>
          </svg>
        </div>
        <div className="hc-bars">
          {['Liquidity', 'Discipline', 'Compliance', 'Concentration', 'Growth', 'Working cap'].map((label, i) => (
            <div key={label} className="hc-bar-row">
              <span>{label}</span>
              <div className="hc-bar"><i style={{ width: `${dims[i]}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="hc-chips">
        <span className="hc-chip good">GST 97%</span>
        <span className="hc-chip">UPI 18.4k txns</span>
        <span className="hc-chip">AUROC 0.83</span>
      </div>
    </div>
  )
}

export function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [audience, setAudience] = useState(0)
  const [dataTab, setDataTab] = useState(0)
  const [floatingWords, setFloatingWords] = useState<FloatingWord[]>(() => createFloatingWords())
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFloatingWords(createFloatingWords())
    }, 18000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="nx-site">
      <div className="nx-aurora" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="nx-word-field" aria-hidden="true">
        {floatingWords.map((word) => (
          <span
            key={word.text}
            className={`nx-float-word ${word.tone}`}
            style={{
              left: word.x,
              top: word.y,
              animationDelay: word.delay,
              animationDuration: word.duration,
            }}
          >
            {word.text}
          </span>
        ))}
      </div>

      <header className={scrolled ? 'nx-nav scrolled' : 'nx-nav'}>
        <a className="nx-brand" href="#top">
          <span className="nx-logo"><LineChart size={20} /></span>
          <b>Nemesis</b>
        </a>
        <nav className="nx-links" aria-label="Sections">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>{n.label}</a>
          ))}
        </nav>
        <div className="nx-nav-cta">
          <span className="nx-badge"><BadgeCheck size={14} /> IDBI Innovate 2026</span>
          <button type="button" className="nx-btn primary" onClick={onLaunch}>
            Launch Console <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="nx-hero">
          <div className="nx-hero-copy">
            <span className="nx-pill"><Sparkles size={14} /> GST · UPI · Account Aggregator · EPFO</span>
            <h1>
              Turn alternate data into <span className="grad">MSME creditworthiness</span> — explainable, in under a minute.
            </h1>
            <p className="nx-lead">
              Nemesis converts consented alternate data into a six-dimensional Financial Health Card, a trained
              probability-of-default score, and a policy-checked decision — built for thin-file and new-to-credit MSMEs.
            </p>
            <div className="nx-hero-actions">
              <button type="button" className="nx-btn primary lg" onClick={onLaunch}>
                Launch Console <ArrowRight size={17} />
              </button>
              <a className="nx-btn ghost lg" href="#technology">See the model</a>
            </div>
            <div className="nx-hero-trust">
              <b>Backed by</b> AI/ML scoring · guarded agent swarm · Guardian audit
            </div>
          </div>
          <div className="nx-hero-visual">
            <div className="nx-aurora-card" aria-hidden="true">
              <div>
                <b>03</b>
                <span>Aurora Teal</span>
              </div>
              <strong>BALANCE</strong>
            </div>
            <HealthCardMock />
          </div>
        </section>

        <section className="nx-powered">
          <p>The modern AI &amp; lending stack, one integration layer</p>
          <div className="nx-powered-row">
            {POWERED.map((p) => (
              <span key={p} className="nx-wordmark">{p}</span>
            ))}
          </div>
        </section>

        <section id="platform" className="nx-panel green">
          <div className="nx-panel-inner">
            <p className="nx-kicker">A unified MSME credit intelligence layer</p>
            <h2>Six-dimensional financial health, scored from data MSMEs already generate</h2>
            <div className="nx-stats">
              {STATS.map((s) => (
                <div key={s.label} className="nx-stat">
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                  <small>{s.hint}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="nx-feature">
          <div className="nx-feature-text">
            <p className="nx-kicker">Built for every stakeholder</p>
            <h2>AI-powered underwriting intelligence</h2>
            <div className="nx-tabs">
              {AUDIENCE_TABS.map((t, i) => (
                <button key={t.key} type="button" className={i === audience ? 'active' : ''} onClick={() => setAudience(i)}>
                  {t.key}
                </button>
              ))}
            </div>
            <h3>{AUDIENCE_TABS[audience].title}</h3>
            <p>{AUDIENCE_TABS[audience].body}</p>
            <button type="button" className="nx-btn primary" onClick={onLaunch}>
              Open the console <ArrowRight size={16} />
            </button>
          </div>
          <div className="nx-feature-visual mint">
            <Gauge size={130} strokeWidth={1} />
          </div>
        </section>

        <section className="nx-feature reverse">
          <div className="nx-feature-text">
            <p className="nx-kicker">One score, fully explained</p>
            <h2>From alternate data to a decision you can trace</h2>
            <div className="nx-tabs">
              {DATA_TABS.map((t, i) => (
                <button key={t.key} type="button" className={i === dataTab ? 'active' : ''} onClick={() => setDataTab(i)}>
                  {t.key}
                </button>
              ))}
            </div>
            <p className="nx-tab-body">{DATA_TABS[dataTab].body}</p>
            <a className="nx-btn ghost" href="#capabilities">Explore capabilities</a>
          </div>
          <div className="nx-feature-visual deep">
            <ShieldCheck size={120} strokeWidth={1} />
          </div>
        </section>

        <section id="capabilities" className="nx-cards-section">
          <p className="nx-kicker center">Product modules</p>
          <h2 className="center">Everything an MSME underwriting workflow needs</h2>
          <div className="nx-cards">
            {CAPABILITIES.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.title} className="nx-card">
                  <span className="nx-card-icon"><Icon size={22} /></span>
                  <strong>{c.title}</strong>
                  <p>{c.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section id="technology" className="nx-tech">
          <div className="nx-tech-head">
            <p className="nx-kicker">Under the hood</p>
            <h2>Real AI/ML, guarded end to end</h2>
          </div>
          <div className="nx-tech-grid">
            {TECH.map((t, i) => (
              <div key={t.title} className="nx-tech-card">
                <b>{String(i + 1).padStart(2, '0')}</b>
                <div>
                  <strong>{t.title}</strong>
                  <p>{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="impact" className="nx-cta">
          <div className="nx-cta-inner">
            <p className="nx-kicker light">Financial inclusion, measured</p>
            <h2>Explainable MSME credit, live.</h2>
            <p className="nx-cta-sub">
              Approve more credit-invisible MSMEs at equal risk — a ~28 percentage-point approval uplift over
              document-based underwriting, every decision policy-checked and auditable.
            </p>
            <button type="button" className="nx-btn light lg" onClick={onLaunch}>
              Launch the console <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </main>

      <footer className="nx-footer">
        <div className="nx-footer-top">
          <div className="nx-brand">
            <span className="nx-logo"><LineChart size={20} /></span>
            <b>Nemesis</b>
          </div>
          <p>MSME Financial Health Card &amp; AI creditworthiness intelligence — built for IDBI Innovate 2026, Track 03.</p>
        </div>
        <div className="nx-footer-cols">
          <div>
            <span>Platform</span>
            <a href="#platform">Health Card</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#technology">Technology</a>
          </div>
          <div>
            <span>Console</span>
            <button type="button" onClick={onLaunch}>Launch Console</button>
          </div>
          <div>
            <span>Track</span>
            <a href="#impact">Financial Inclusion</a>
            <a href="#impact">Digital Lending</a>
          </div>
        </div>
        <div className="nx-footer-base">
          <span>© 2026 Team Nemesis · IDBI Innovate</span>
          <span>Alternate-data credit decisioning</span>
        </div>
      </footer>
    </div>
  )
}
