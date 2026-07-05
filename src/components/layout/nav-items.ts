import {
  Activity,
  Brain,
  Briefcase,
  DatabaseZap,
  Eye,
  Gauge,
  Landmark,
  LockKeyhole,
  Network,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'

export const navItems = [
  { key: 'health', label: 'Health Card', icon: Gauge },
  { key: 'model', label: 'Credit Model', icon: Brain },
  { key: 'simulator', label: 'What-If Lab', icon: SlidersHorizontal },
  { key: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { key: 'swarm', label: 'Swarm', icon: Network },
  { key: 'explain', label: 'Explainability', icon: Eye },
  { key: 'security', label: 'Guardian', icon: LockKeyhole },
  { key: 'federated', label: 'Federated', icon: Landmark },
  { key: 'architecture', label: 'Architecture', icon: DatabaseZap },
  { key: 'api', label: 'API', icon: Activity },
  { key: 'integrations', label: 'Integrations', icon: Zap },
] as const

export type TabKey = (typeof navItems)[number]['key']
