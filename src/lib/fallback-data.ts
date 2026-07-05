import { DatabaseZap, GitBranch, RefreshCw, ShieldCheck } from 'lucide-react'

export const swarmAgents = [
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

export const events = [
  'AA consent token issued for GST, bank, EPFO, and UPI sources',
  'Perceiver mapped 214 features with 96% schema confidence',
  'Planner selected working-capital path with buyer cap',
  'Guardian signed decision with HMAC audit seal',
]

export const federatedRounds = [
  { bank: 'IDBI sandbox', auc: '0.86', drift: 'low', samples: '18.2k' },
  { bank: 'NBFC partner A', auc: '0.83', drift: 'medium', samples: '11.7k' },
  { bank: 'Co-op bank node', auc: '0.81', drift: 'medium', samples: '7.4k' },
]

export const architectureNodes = [
  {
    layer: 'L1',
    name: 'Consent and source connectors',
    components: ['AA', 'GSTN', 'NPCI UPI', 'EPFO', 'Bank parser'],
    status: 'mocked in backend',
  },
  {
    layer: 'L2',
    name: 'Feature engineering',
    components: ['cashflow', 'compliance', 'concentration', 'working capital'],
    status: 'deterministic prototype',
  },
  {
    layer: 'L3',
    name: 'Swarm and scoring',
    components: ['Perceiver', 'Planner', 'Guardian', 'Recoverer'],
    status: 'orchestrated scoring pipeline',
  },
  {
    layer: 'L4',
    name: 'Delivery and lending rails',
    components: ['Health Card UI', 'OCEN', 'ULI', 'LOS handoff'],
    status: 'API-ready stubs',
  },
]
