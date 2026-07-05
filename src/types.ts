export type Tone = 'good' | 'watch' | 'risk'

export type Dimension = {
  label: string
  value: number
  delta: string
  signal: string
  tone: Tone
}

export type Enterprise = {
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

export type Scenario = 'baseline' | 'thinData' | 'stress' | 'attack'

export type BackendAgent = {
  name: string
  role: string
  tier: string
  health: number
  detail: string
}

export type GuardianFinding = { severity: string; rule: string; message: string }

export type BackendHealthCard = {
  scenario: { key: Scenario; label: string }
  enterprise: Enterprise
  connectors: Record<string, unknown>
  guardian: {
    verdict: string
    audit_id: string
    signature_preview: string
    findings: GuardianFinding[]
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

export type IntegrationSummary = {
  catalog: Array<Record<string, string>>
  credit_memo: Record<string, any>
  external_verification: Record<string, any>
  analytics_event: Record<string, any>
  policy: Record<string, any>
  model_monitor: Record<string, any>
  data_quality: Record<string, any>
  document_intelligence: Record<string, any>
  memory: Record<string, any>
  operations: Record<string, any>
}

export type SimulationOverrides = {
  gst_filing_timeliness?: number
  top_buyer_share?: number
  upi_monthly_inflow_lakh?: number
  emi_delay_count_180d?: number
  dso_days?: number
  bank_avg_balance_lakh?: number
}

export type SimulationResult = {
  baseline: { composite: number; decision: string; dimensions: Dimension[] }
  simulated: {
    composite: number
    decision: string
    dimensions: Dimension[]
    reasons: { factor: string; impact: number; text: string }[]
  }
  deltas: { label: string; before: number; after: number }[]
  mode: 'live' | 'local'
}

export type PortfolioItem = {
  id: string
  name: string
  sector: string
  location: string
  composite: number
  tone: Tone
  decision: string
  top_risk_factor: string
  ask: string
  growth_pct: number
}

export type PortfolioAlert = {
  id: string
  enterprise_id: string
  enterprise_name: string
  severity: 'high' | 'medium' | 'low'
  message: string
  dimension: string
}

export type PortfolioSnapshot = {
  summary: {
    count: number
    avg_score: number
    tier_counts: { good: number; watch: number; risk: number }
    total_exposure_lakh: number
  }
  items: PortfolioItem[]
  alerts: PortfolioAlert[]
  distribution: { bucket: string; count: number }[]
}

export type SwarmRunResult = {
  mode: 'live-llm' | 'deterministic'
  model: string | null
  composite: number
  decision: string
  guardian_verdict: string
  agents: Record<string, { output: string; model: string; policy_gate?: Record<string, unknown> }>
  a2a_log: {
    from: string
    to: string
    at: string
    blocked: boolean
    guardrail_findings: string[]
    content: string
  }[]
  guardrails: Record<string, unknown>
}

export type MLScore = {
  enterprise_id: string
  name: string
  pd: number
  credit_score: number
  band: string
  decision: string
  models: {
    logistic_scorecard: number
    gradient_boosting: number
    tabpfn_foundation?: number
  }
  attributions: { feature: string; points: number; direction: 'protective' | 'risk' }[]
}

export type MLPeers = {
  enterprise_id: string
  model: string
  mode: 'semantic' | 'feature-space'
  self_pd: number
  peer_avg_pd: number
  consistency: string
  peers: { id: string; name: string; sector: string; similarity: number; pd: number }[]
}

export type MLValidation = {
  auroc: number
  gini: number
  ks: number
  gbm_auroc: number
  gbm_gini: number
  psi_train_test: number
  base_default_rate: number
  n_train: number
  n_test: number
  roc_curve: { fpr: number; tpr: number }[]
  calibration: { predicted: number; observed: number }[]
  gains: { decile: number; capture: number }[]
  business_impact: {
    cutoff_pd: number
    approval_rate: number
    approved_bad_rate: number
    traditional_approval_rate: number
    uplift_pct_points: number
  }[]
}

export type ModelCard = {
  model_name: string
  version: string
  champion: string
  challenger: string
  foundation_model: string
  training_data: string
  target: string
  features: string[]
  intended_use: string
  limitations: string
  metrics: { auroc: number; ks: number; gini: number }
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  mode?: 'groq' | 'deterministic' | 'local'
  blocked?: boolean
  citations?: { dimension: string; value: number }[]
}
