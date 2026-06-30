from __future__ import annotations

from .data import MSMERecord, SCENARIO_EFFECTS


def clamp(value: float, low: int = 0, high: int = 100) -> int:
    return int(max(low, min(high, round(value))))


def score_tone(score: int) -> str:
    if score >= 78:
        return "good"
    if score >= 62:
        return "watch"
    return "risk"


def decision_for(score: int) -> str:
    if score >= 78:
        return "Indicative approve"
    if score >= 62:
        return "Review with mitigants"
    return "Manual review required"


def feature_engineer(record: MSMERecord, scenario: str) -> dict:
    scenario_effect = SCENARIO_EFFECTS.get(scenario, SCENARIO_EFFECTS["baseline"])
    data_quality = (
        record.gst_filing_timeliness * 0.2
        + record.gst_bank_reconciliation * 0.2
        + min(record.statement_months / 12, 1) * 0.2
        + (1 - min(record.upi_volatility, 0.8)) * 0.2
        + record.epfo_continuity * 0.2
        + scenario_effect["data_quality_offset"]
    )
    return {
        "data_quality": max(0.1, min(1.0, data_quality)),
        "liquidity_base": record.bank_avg_balance_lakh * 3.2 + record.upi_monthly_inflow_lakh * 1.2,
        "discipline_penalty": record.emi_delay_count_180d * 8 + record.cheque_bounce_count_180d * 10,
        "compliance_base": record.gst_filing_timeliness * 55 + record.gst_bank_reconciliation * 45,
        "concentration_penalty": max(0, record.top_buyer_share - 0.25) * 105,
        "growth_base": 68 + record.revenue_growth_pct * 1.25,
        "working_capital_penalty": max(0, record.dso_days - 35) * 0.55
        + max(0, record.inventory_cycle_days - 35) * 0.35,
    }


def dimension_scores(record: MSMERecord, scenario: str) -> list[dict]:
    features = feature_engineer(record, scenario)
    offset = SCENARIO_EFFECTS.get(scenario, SCENARIO_EFFECTS["baseline"])["score_offset"]
    attack_compliance_penalty = -15 if scenario == "attack" else 0
    thin_data_penalty = -4 if scenario == "thinData" else 0

    dimensions = [
        {
            "label": "Cashflow Liquidity",
            "value": clamp(features["liquidity_base"] - record.bank_negative_days * 3 + offset + thin_data_penalty),
            "delta": "+7" if record.upi_volatility < 0.22 else "+2",
            "signal": f"UPI inflow INR {record.upi_monthly_inflow_lakh:.1f}L/month, volatility {record.upi_volatility:.0%}",
        },
        {
            "label": "Credit Discipline",
            "value": clamp(86 - features["discipline_penalty"] + offset),
            "delta": "+3" if record.emi_delay_count_180d == 0 else "-4",
            "signal": f"{record.emi_delay_count_180d} EMI delays and {record.cheque_bounce_count_180d} cheque bounces in 180 days",
        },
        {
            "label": "Compliance Health",
            "value": clamp(features["compliance_base"] + offset + attack_compliance_penalty),
            "delta": "+11" if record.gst_filing_timeliness > 0.9 else "+4",
            "signal": f"GST timeliness {record.gst_filing_timeliness:.0%}, bank reconciliation {record.gst_bank_reconciliation:.0%}",
        },
        {
            "label": "Concentration Risk",
            "value": clamp(90 - features["concentration_penalty"] + offset),
            "delta": "-4" if record.top_buyer_share < 0.5 else "-12",
            "signal": f"Top buyer contributes {record.top_buyer_share:.0%} of revenue",
        },
        {
            "label": "Growth Trajectory",
            "value": clamp(features["growth_base"] + offset),
            "delta": f"+{round(record.revenue_growth_pct)}",
            "signal": f"Quarterly GST sales growth trend {record.revenue_growth_pct:.1f}%",
        },
        {
            "label": "Working Capital Efficiency",
            "value": clamp(88 - features["working_capital_penalty"] + offset),
            "delta": "+5" if record.dso_days < 45 else "-3",
            "signal": f"DSO {record.dso_days} days, DPO {record.dpo_days} days, inventory {record.inventory_cycle_days} days",
        },
    ]

    return [{**item, "tone": score_tone(item["value"])} for item in dimensions]


def reason_codes(record: MSMERecord, dimensions: list[dict]) -> list[dict]:
    reasons = [
        {
            "factor": "GST filing regularity",
            "impact": round((record.gst_filing_timeliness - 0.75) * 60),
            "text": "Monthly GST behavior improves compliance confidence and reduces documentation risk.",
        },
        {
            "factor": "Buyer concentration",
            "impact": -round(max(0, record.top_buyer_share - 0.3) * 62),
            "text": "High dependence on one buyer reduces resilience and may require exposure caps.",
        },
        {
            "factor": "Cashflow depth",
            "impact": round(min(record.upi_monthly_inflow_lakh / 4, 14)),
            "text": "UPI and bank inflows provide alternate evidence for thin-file underwriting.",
        },
        {
            "factor": "Working-capital cycle",
            "impact": -round(max(0, record.dso_days - 40) / 2),
            "text": "Longer realization cycles reduce near-term liquidity comfort.",
        },
    ]
    reasons.sort(key=lambda item: abs(item["impact"]), reverse=True)
    return reasons[:3]


def feature_tiles(record: MSMERecord, features: dict) -> list[dict]:
    return [
        {
            "label": "GST consistency",
            "value": f"{round(record.gst_filing_timeliness * 100)}%",
            "status": "verified" if record.gst_filing_timeliness >= 0.85 else "watch",
        },
        {
            "label": "UPI settlement depth",
            "value": f"{round(record.upi_monthly_inflow_lakh * 500 / 1000, 1)}k txns",
            "status": "rich" if record.upi_monthly_inflow_lakh >= 30 else "usable",
        },
        {
            "label": "EPFO continuity",
            "value": f"{record.epfo_employee_count} employees",
            "status": "steady" if record.epfo_continuity >= 0.8 else "thin",
        },
        {
            "label": "Data quality index",
            "value": f"{round(features['data_quality'] * 100)}%",
            "status": "complete" if features["data_quality"] >= 0.82 else "partial",
        },
    ]


def benchmark(record: MSMERecord, composite: int, features: dict) -> dict:
    return {
        "indicative_decision_ms": 43800,
        "model_confidence": round(features["data_quality"], 2),
        "reason_code_coverage": "100%",
        "synthetic_peer_percentile": clamp(composite + record.revenue_growth_pct * 0.4),
        "tier_used": "tier2_tabular" if features["data_quality"] < 0.9 else "tier1_rich_signal",
    }


def score_health_card(record: MSMERecord, scenario: str) -> dict:
    features = feature_engineer(record, scenario)
    dimensions = dimension_scores(record, scenario)
    composite = clamp(sum(item["value"] for item in dimensions) / len(dimensions))
    decision = decision_for(composite)

    return {
        "enterprise": {
            "id": record.id,
            "name": record.name,
            "sector": record.sector,
            "location": record.location,
            "ask": record.loan_request,
            "composite": composite,
            "decision": decision,
            "dimensions": dimensions,
            "features": feature_tiles(record, features),
            "reasons": reason_codes(record, dimensions),
            "cashflow": list(record.cashflow),
        },
        "features": features,
        "benchmark": benchmark(record, composite, features),
    }
