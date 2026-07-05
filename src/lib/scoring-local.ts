// TypeScript mirror of backend/app/scoring.py so the simulator and portfolio
// keep working offline. Values may drift ±1 from the backend because Python
// round() uses banker's rounding.
import type { Dimension, Scenario, SimulationOverrides, Tone } from '../types'

export type RawRecord = {
  id: string
  name: string
  sector: string
  location: string
  loan_request: string
  gst_filing_timeliness: number
  gst_bank_reconciliation: number
  upi_monthly_inflow_lakh: number
  upi_volatility: number
  bank_avg_balance_lakh: number
  bank_negative_days: number
  epfo_employee_count: number
  epfo_continuity: number
  emi_delay_count_180d: number
  cheque_bounce_count_180d: number
  top_buyer_share: number
  revenue_growth_pct: number
  dso_days: number
  dpo_days: number
  inventory_cycle_days: number
  statement_months: number
  cashflow: number[]
}

const SCENARIO_EFFECTS: Record<Scenario, { scoreOffset: number; dataQualityOffset: number }> = {
  baseline: { scoreOffset: 0, dataQualityOffset: 0 },
  thinData: { scoreOffset: -7, dataQualityOffset: -0.18 },
  stress: { scoreOffset: -13, dataQualityOffset: -0.08 },
  attack: { scoreOffset: -21, dataQualityOffset: -0.12 },
}

export const RAW_RECORDS: Record<string, RawRecord> = {
  suryam: {
    id: 'suryam',
    name: 'Suryam Precision Tools',
    sector: 'Auto components',
    location: 'Ludhiana, PB',
    loan_request: 'INR 42L working-capital line',
    gst_filing_timeliness: 0.97,
    gst_bank_reconciliation: 0.94,
    upi_monthly_inflow_lakh: 36.8,
    upi_volatility: 0.18,
    bank_avg_balance_lakh: 11.6,
    bank_negative_days: 1,
    epfo_employee_count: 23,
    epfo_continuity: 0.92,
    emi_delay_count_180d: 0,
    cheque_bounce_count_180d: 0,
    top_buyer_share: 0.43,
    revenue_growth_pct: 16.0,
    dso_days: 41,
    dpo_days: 33,
    inventory_cycle_days: 28,
    statement_months: 14,
    cashflow: [45, 51, 56, 61, 58, 67, 72, 78, 82, 85, 91, 96],
  },
  meghdoot: {
    id: 'meghdoot',
    name: 'Meghdoot Agro Foods',
    sector: 'Food processing',
    location: 'Nashik, MH',
    loan_request: 'INR 28L invoice-backed loan',
    gst_filing_timeliness: 0.88,
    gst_bank_reconciliation: 0.86,
    upi_monthly_inflow_lakh: 18.4,
    upi_volatility: 0.32,
    bank_avg_balance_lakh: 5.2,
    bank_negative_days: 5,
    epfo_employee_count: 11,
    epfo_continuity: 0.73,
    emi_delay_count_180d: 1,
    cheque_bounce_count_180d: 0,
    top_buyer_share: 0.61,
    revenue_growth_pct: 10.0,
    dso_days: 56,
    dpo_days: 39,
    inventory_cycle_days: 46,
    statement_months: 9,
    cashflow: [42, 48, 63, 74, 88, 81, 59, 53, 61, 66, 72, 78],
  },
  neelkanth: {
    id: 'neelkanth',
    name: 'Neelkanth Textiles',
    sector: 'Textile processing',
    location: 'Surat, GJ',
    loan_request: 'INR 35L machinery upgrade',
    gst_filing_timeliness: 0.81,
    gst_bank_reconciliation: 0.79,
    upi_monthly_inflow_lakh: 24.1,
    upi_volatility: 0.27,
    bank_avg_balance_lakh: 7.8,
    bank_negative_days: 3,
    epfo_employee_count: 18,
    epfo_continuity: 0.84,
    emi_delay_count_180d: 1,
    cheque_bounce_count_180d: 1,
    top_buyer_share: 0.39,
    revenue_growth_pct: 7.0,
    dso_days: 49,
    dpo_days: 37,
    inventory_cycle_days: 52,
    statement_months: 12,
    cashflow: [50, 53, 55, 54, 57, 62, 65, 63, 68, 70, 71, 75],
  },
  vardhan: {
    id: 'vardhan',
    name: 'Vardhan Machine Works',
    sector: 'Industrial tools',
    location: 'Rajkot, GJ',
    loan_request: 'INR 18L term loan',
    gst_filing_timeliness: 0.74,
    gst_bank_reconciliation: 0.71,
    upi_monthly_inflow_lakh: 12.3,
    upi_volatility: 0.44,
    bank_avg_balance_lakh: 3.1,
    bank_negative_days: 9,
    epfo_employee_count: 8,
    epfo_continuity: 0.62,
    emi_delay_count_180d: 3,
    cheque_bounce_count_180d: 2,
    top_buyer_share: 0.67,
    revenue_growth_pct: 2.0,
    dso_days: 68,
    dpo_days: 41,
    inventory_cycle_days: 58,
    statement_months: 7,
    cashflow: [38, 35, 41, 37, 33, 36, 39, 34, 31, 35, 33, 37],
  },
  adya: {
    id: 'adya',
    name: 'Adya Packaging',
    sector: 'Packaging',
    location: 'Indore, MP',
    loan_request: 'INR 24L working-capital line',
    gst_filing_timeliness: 0.91,
    gst_bank_reconciliation: 0.89,
    upi_monthly_inflow_lakh: 29.6,
    upi_volatility: 0.21,
    bank_avg_balance_lakh: 9.7,
    bank_negative_days: 2,
    epfo_employee_count: 16,
    epfo_continuity: 0.88,
    emi_delay_count_180d: 0,
    cheque_bounce_count_180d: 0,
    top_buyer_share: 0.34,
    revenue_growth_pct: 13.0,
    dso_days: 38,
    dpo_days: 30,
    inventory_cycle_days: 33,
    statement_months: 13,
    cashflow: [52, 55, 58, 61, 60, 64, 68, 71, 74, 76, 80, 84],
  },
  kaveri: {
    id: 'kaveri',
    name: 'Kaveri Handlooms',
    sector: 'Textiles',
    location: 'Erode, TN',
    loan_request: 'INR 12L inventory loan',
    gst_filing_timeliness: 0.85,
    gst_bank_reconciliation: 0.8,
    upi_monthly_inflow_lakh: 9.8,
    upi_volatility: 0.35,
    bank_avg_balance_lakh: 2.9,
    bank_negative_days: 4,
    epfo_employee_count: 6,
    epfo_continuity: 0.7,
    emi_delay_count_180d: 1,
    cheque_bounce_count_180d: 0,
    top_buyer_share: 0.48,
    revenue_growth_pct: 9.0,
    dso_days: 52,
    dpo_days: 35,
    inventory_cycle_days: 61,
    statement_months: 10,
    cashflow: [30, 33, 37, 35, 40, 43, 41, 45, 47, 46, 50, 53],
  },
  zenlabs: {
    id: 'zenlabs',
    name: 'ZenLabs Diagnostics',
    sector: 'Healthcare services',
    location: 'Pune, MH',
    loan_request: 'INR 55L equipment loan',
    gst_filing_timeliness: 0.95,
    gst_bank_reconciliation: 0.93,
    upi_monthly_inflow_lakh: 41.2,
    upi_volatility: 0.15,
    bank_avg_balance_lakh: 14.3,
    bank_negative_days: 0,
    epfo_employee_count: 31,
    epfo_continuity: 0.94,
    emi_delay_count_180d: 0,
    cheque_bounce_count_180d: 0,
    top_buyer_share: 0.22,
    revenue_growth_pct: 21.0,
    dso_days: 29,
    dpo_days: 28,
    inventory_cycle_days: 18,
    statement_months: 16,
    cashflow: [58, 62, 66, 70, 73, 77, 80, 84, 87, 90, 94, 97],
  },
  bhoomi: {
    id: 'bhoomi',
    name: 'Bhoomi Agro Traders',
    sector: 'Agri trading',
    location: 'Guntur, AP',
    loan_request: 'INR 20L crop-cycle credit',
    gst_filing_timeliness: 0.7,
    gst_bank_reconciliation: 0.66,
    upi_monthly_inflow_lakh: 15.6,
    upi_volatility: 0.51,
    bank_avg_balance_lakh: 3.8,
    bank_negative_days: 8,
    epfo_employee_count: 5,
    epfo_continuity: 0.55,
    emi_delay_count_180d: 2,
    cheque_bounce_count_180d: 1,
    top_buyer_share: 0.58,
    revenue_growth_pct: 4.0,
    dso_days: 71,
    dpo_days: 44,
    inventory_cycle_days: 66,
    statement_months: 8,
    cashflow: [28, 41, 55, 62, 48, 33, 27, 31, 44, 52, 39, 30],
  },
  rhythm: {
    id: 'rhythm',
    name: 'Rhythm Apparel Exports',
    sector: 'Garments',
    location: 'Tiruppur, TN',
    loan_request: 'INR 38L export packing credit',
    gst_filing_timeliness: 0.89,
    gst_bank_reconciliation: 0.87,
    upi_monthly_inflow_lakh: 27.4,
    upi_volatility: 0.24,
    bank_avg_balance_lakh: 8.1,
    bank_negative_days: 2,
    epfo_employee_count: 26,
    epfo_continuity: 0.86,
    emi_delay_count_180d: 0,
    cheque_bounce_count_180d: 0,
    top_buyer_share: 0.52,
    revenue_growth_pct: 11.0,
    dso_days: 47,
    dpo_days: 36,
    inventory_cycle_days: 41,
    statement_months: 12,
    cashflow: [46, 49, 53, 57, 55, 60, 63, 67, 65, 70, 73, 77],
  },
  sagar: {
    id: 'sagar',
    name: 'Sagar Marine Foods',
    sector: 'Seafood processing',
    location: 'Kochi, KL',
    loan_request: 'INR 30L cold-chain loan',
    gst_filing_timeliness: 0.83,
    gst_bank_reconciliation: 0.78,
    upi_monthly_inflow_lakh: 22.7,
    upi_volatility: 0.38,
    bank_avg_balance_lakh: 6.4,
    bank_negative_days: 5,
    epfo_employee_count: 19,
    epfo_continuity: 0.77,
    emi_delay_count_180d: 1,
    cheque_bounce_count_180d: 1,
    top_buyer_share: 0.63,
    revenue_growth_pct: 8.0,
    dso_days: 58,
    dpo_days: 40,
    inventory_cycle_days: 49,
    statement_months: 11,
    cashflow: [40, 46, 52, 58, 50, 44, 48, 55, 60, 54, 49, 53],
  },
  trident: {
    id: 'trident',
    name: 'Trident Electronics',
    sector: 'Electronics assembly',
    location: 'Noida, UP',
    loan_request: 'INR 46L purchase-order finance',
    gst_filing_timeliness: 0.93,
    gst_bank_reconciliation: 0.9,
    upi_monthly_inflow_lakh: 33.9,
    upi_volatility: 0.19,
    bank_avg_balance_lakh: 10.8,
    bank_negative_days: 1,
    epfo_employee_count: 21,
    epfo_continuity: 0.9,
    emi_delay_count_180d: 0,
    cheque_bounce_count_180d: 0,
    top_buyer_share: 0.41,
    revenue_growth_pct: 17.0,
    dso_days: 36,
    dpo_days: 31,
    inventory_cycle_days: 26,
    statement_months: 15,
    cashflow: [50, 54, 58, 63, 66, 70, 74, 77, 81, 84, 88, 92],
  },
  anvi: {
    id: 'anvi',
    name: 'Anvi Ceramics',
    sector: 'Ceramics',
    location: 'Morbi, GJ',
    loan_request: 'INR 26L kiln upgrade loan',
    gst_filing_timeliness: 0.78,
    gst_bank_reconciliation: 0.74,
    upi_monthly_inflow_lakh: 17.2,
    upi_volatility: 0.4,
    bank_avg_balance_lakh: 4.6,
    bank_negative_days: 6,
    epfo_employee_count: 13,
    epfo_continuity: 0.68,
    emi_delay_count_180d: 2,
    cheque_bounce_count_180d: 0,
    top_buyer_share: 0.55,
    revenue_growth_pct: 5.0,
    dso_days: 62,
    dpo_days: 42,
    inventory_cycle_days: 57,
    statement_months: 9,
    cashflow: [36, 39, 42, 38, 44, 47, 43, 40, 45, 48, 46, 50],
  },
}

function clamp(value: number, low = 0, high = 100) {
  return Math.max(low, Math.min(high, Math.round(value)))
}

export function localScoreTone(score: number): Tone {
  if (score >= 78) return 'good'
  if (score >= 62) return 'watch'
  return 'risk'
}

export function decisionFor(score: number) {
  if (score >= 78) return 'Indicative approve'
  if (score >= 62) return 'Review with mitigants'
  return 'Manual review required'
}

function featureEngineer(record: RawRecord, scenario: Scenario) {
  const effect = SCENARIO_EFFECTS[scenario] ?? SCENARIO_EFFECTS.baseline
  const dataQuality =
    record.gst_filing_timeliness * 0.2 +
    record.gst_bank_reconciliation * 0.2 +
    Math.min(record.statement_months / 12, 1) * 0.2 +
    (1 - Math.min(record.upi_volatility, 0.8)) * 0.2 +
    record.epfo_continuity * 0.2 +
    effect.dataQualityOffset
  return {
    dataQuality: Math.max(0.1, Math.min(1.0, dataQuality)),
    liquidityBase: record.bank_avg_balance_lakh * 3.2 + record.upi_monthly_inflow_lakh * 1.2,
    disciplinePenalty: record.emi_delay_count_180d * 8 + record.cheque_bounce_count_180d * 10,
    complianceBase: record.gst_filing_timeliness * 55 + record.gst_bank_reconciliation * 45,
    concentrationPenalty: Math.max(0, record.top_buyer_share - 0.25) * 105,
    growthBase: 68 + record.revenue_growth_pct * 1.25,
    workingCapitalPenalty:
      Math.max(0, record.dso_days - 35) * 0.55 + Math.max(0, record.inventory_cycle_days - 35) * 0.35,
  }
}

export function localDimensionScores(record: RawRecord, scenario: Scenario): Dimension[] {
  const features = featureEngineer(record, scenario)
  const offset = SCENARIO_EFFECTS[scenario]?.scoreOffset ?? 0
  const attackCompliancePenalty = scenario === 'attack' ? -15 : 0
  const thinDataPenalty = scenario === 'thinData' ? -4 : 0

  const dimensions = [
    {
      label: 'Cashflow Liquidity',
      value: clamp(features.liquidityBase - record.bank_negative_days * 3 + offset + thinDataPenalty),
      delta: record.upi_volatility < 0.22 ? '+7' : '+2',
      signal: `UPI inflow INR ${record.upi_monthly_inflow_lakh.toFixed(1)}L/month, volatility ${Math.round(record.upi_volatility * 100)}%`,
    },
    {
      label: 'Credit Discipline',
      value: clamp(86 - features.disciplinePenalty + offset),
      delta: record.emi_delay_count_180d === 0 ? '+3' : '-4',
      signal: `${record.emi_delay_count_180d} EMI delays and ${record.cheque_bounce_count_180d} cheque bounces in 180 days`,
    },
    {
      label: 'Compliance Health',
      value: clamp(features.complianceBase + offset + attackCompliancePenalty),
      delta: record.gst_filing_timeliness > 0.9 ? '+11' : '+4',
      signal: `GST timeliness ${Math.round(record.gst_filing_timeliness * 100)}%, bank reconciliation ${Math.round(record.gst_bank_reconciliation * 100)}%`,
    },
    {
      label: 'Concentration Risk',
      value: clamp(90 - features.concentrationPenalty + offset),
      delta: record.top_buyer_share < 0.5 ? '-4' : '-12',
      signal: `Top buyer contributes ${Math.round(record.top_buyer_share * 100)}% of revenue`,
    },
    {
      label: 'Growth Trajectory',
      value: clamp(features.growthBase + offset),
      delta: `+${Math.round(record.revenue_growth_pct)}`,
      signal: `Quarterly GST sales growth trend ${record.revenue_growth_pct.toFixed(1)}%`,
    },
    {
      label: 'Working Capital Efficiency',
      value: clamp(88 - features.workingCapitalPenalty + offset),
      delta: record.dso_days < 45 ? '+5' : '-3',
      signal: `DSO ${record.dso_days} days, DPO ${record.dpo_days} days, inventory ${record.inventory_cycle_days} days`,
    },
  ]

  return dimensions.map((item) => ({ ...item, tone: localScoreTone(item.value) }))
}

export function localReasonCodes(record: RawRecord) {
  const reasons = [
    {
      factor: 'GST filing regularity',
      impact: Math.round((record.gst_filing_timeliness - 0.75) * 60),
      text: 'Monthly GST behavior improves compliance confidence and reduces documentation risk.',
    },
    {
      factor: 'Buyer concentration',
      impact: -Math.round(Math.max(0, record.top_buyer_share - 0.3) * 62),
      text: 'High dependence on one buyer reduces resilience and may require exposure caps.',
    },
    {
      factor: 'Cashflow depth',
      impact: Math.round(Math.min(record.upi_monthly_inflow_lakh / 4, 14)),
      text: 'UPI and bank inflows provide alternate evidence for thin-file underwriting.',
    },
    {
      factor: 'Working-capital cycle',
      impact: -Math.round(Math.max(0, record.dso_days - 40) / 2),
      text: 'Longer realization cycles reduce near-term liquidity comfort.',
    },
  ]
  reasons.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
  return reasons.slice(0, 3)
}

export function localComposite(dimensions: Dimension[]) {
  return clamp(dimensions.reduce((sum, item) => sum + item.value, 0) / dimensions.length)
}

export function simulateLocally(
  enterpriseId: string,
  scenario: Scenario,
  overrides: SimulationOverrides,
) {
  const base = RAW_RECORDS[enterpriseId] ?? RAW_RECORDS.suryam
  const simulatedRecord: RawRecord = { ...base, ...overrides }
  const baselineDimensions = localDimensionScores(base, scenario)
  const simulatedDimensions = localDimensionScores(simulatedRecord, scenario)
  const baselineComposite = localComposite(baselineDimensions)
  const simulatedComposite = localComposite(simulatedDimensions)

  return {
    baseline: {
      composite: baselineComposite,
      decision: decisionFor(baselineComposite),
      dimensions: baselineDimensions,
    },
    simulated: {
      composite: simulatedComposite,
      decision: decisionFor(simulatedComposite),
      dimensions: simulatedDimensions,
      reasons: localReasonCodes(simulatedRecord),
    },
    deltas: baselineDimensions.map((dimension, index) => ({
      label: dimension.label,
      before: dimension.value,
      after: simulatedDimensions[index].value,
    })),
    mode: 'local' as const,
  }
}

export function buildLocalEnterprise(enterpriseId: string, scenario: Scenario) {
  const record = RAW_RECORDS[enterpriseId] ?? RAW_RECORDS.suryam
  const dimensions = localDimensionScores(record, scenario)
  const composite = localComposite(dimensions)
  return {
    id: record.id,
    name: record.name,
    sector: record.sector,
    location: record.location,
    ask: record.loan_request,
    composite,
    decision: decisionFor(composite),
    dimensions,
    features: [
      {
        label: 'GST consistency',
        value: `${Math.round(record.gst_filing_timeliness * 100)}%`,
        status: record.gst_filing_timeliness >= 0.85 ? 'verified' : 'watch',
      },
      {
        label: 'UPI settlement depth',
        value: `${((record.upi_monthly_inflow_lakh * 500) / 1000).toFixed(1)}k txns`,
        status: record.upi_monthly_inflow_lakh >= 30 ? 'rich' : 'usable',
      },
      {
        label: 'EPFO continuity',
        value: `${record.epfo_employee_count} employees`,
        status: record.epfo_continuity >= 0.8 ? 'steady' : 'thin',
      },
      {
        label: 'Bank statement coverage',
        value: `${record.statement_months} months`,
        status: record.statement_months >= 12 ? 'complete' : 'partial',
      },
    ],
    reasons: localReasonCodes(record),
    cashflow: record.cashflow,
  }
}

const EXPOSURE_PATTERN = /(\d+(?:\.\d+)?)L/

function exposureLakh(loanRequest: string) {
  const match = loanRequest.match(EXPOSURE_PATTERN)
  return match ? Number(match[1]) : 0
}

export function buildLocalPortfolio(scenario: Scenario) {
  const records = Object.values(RAW_RECORDS)
  const items = records.map((record) => {
    const dimensions = localDimensionScores(record, scenario)
    const composite = localComposite(dimensions)
    const reasons = localReasonCodes(record)
    const topNegative = reasons.find((reason) => reason.impact < 0)
    return {
      id: record.id,
      name: record.name,
      sector: record.sector,
      location: record.location,
      composite,
      tone: localScoreTone(composite),
      decision: decisionFor(composite),
      top_risk_factor: topNegative ? topNegative.factor : 'No dominant risk factor',
      ask: record.loan_request,
      growth_pct: record.revenue_growth_pct,
    }
  })

  const alerts = records.flatMap((record) => {
    const found: {
      id: string
      enterprise_id: string
      enterprise_name: string
      severity: 'high' | 'medium' | 'low'
      message: string
      dimension: string
    }[] = []
    if (record.top_buyer_share > 0.55) {
      found.push({
        id: `${record.id}-concentration`,
        enterprise_id: record.id,
        enterprise_name: record.name,
        severity: 'high',
        message: `Top buyer carries ${Math.round(record.top_buyer_share * 100)}% of revenue`,
        dimension: 'Concentration Risk',
      })
    }
    if (record.emi_delay_count_180d > 0) {
      found.push({
        id: `${record.id}-discipline`,
        enterprise_id: record.id,
        enterprise_name: record.name,
        severity: record.emi_delay_count_180d >= 2 ? 'high' : 'medium',
        message: `${record.emi_delay_count_180d} EMI delays in the last 180 days`,
        dimension: 'Credit Discipline',
      })
    }
    if (record.bank_negative_days >= 5) {
      found.push({
        id: `${record.id}-liquidity`,
        enterprise_id: record.id,
        enterprise_name: record.name,
        severity: 'medium',
        message: `${record.bank_negative_days} negative-balance days observed`,
        dimension: 'Cashflow Liquidity',
      })
    }
    return found
  })

  const buckets = ['0-40', '40-50', '50-62', '62-78', '78-100']
  const distribution = buckets.map((bucket) => {
    const [low, high] = bucket.split('-').map(Number)
    return {
      bucket,
      count: items.filter((item) => item.composite >= low && item.composite < (high === 100 ? 101 : high)).length,
    }
  })

  const tierCounts = {
    good: items.filter((item) => item.tone === 'good').length,
    watch: items.filter((item) => item.tone === 'watch').length,
    risk: items.filter((item) => item.tone === 'risk').length,
  }

  return {
    summary: {
      count: items.length,
      avg_score: clamp(items.reduce((sum, item) => sum + item.composite, 0) / items.length),
      tier_counts: tierCounts,
      total_exposure_lakh: Math.round(records.reduce((sum, record) => sum + exposureLakh(record.loan_request), 0)),
    },
    items: [...items].sort((a, b) => a.composite - b.composite),
    alerts,
    distribution,
  }
}
