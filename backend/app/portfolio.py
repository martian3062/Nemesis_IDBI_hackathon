from __future__ import annotations

import re

from .data import MSME_DATASET, SCENARIO_EFFECTS
from .scoring import clamp, decision_for, dimension_scores, reason_codes, score_tone


_EXPOSURE_PATTERN = re.compile(r"(\d+(?:\.\d+)?)L")

_BUCKETS = [("0-40", 0, 40), ("40-50", 40, 50), ("50-62", 50, 62), ("62-78", 62, 78), ("78-100", 78, 101)]


def _exposure_lakh(loan_request: str) -> float:
    match = _EXPOSURE_PATTERN.search(loan_request)
    return float(match.group(1)) if match else 0.0


def _alerts_for(record) -> list[dict]:
    alerts: list[dict] = []
    if record.top_buyer_share > 0.55:
        alerts.append(
            {
                "id": f"{record.id}-concentration",
                "enterprise_id": record.id,
                "enterprise_name": record.name,
                "severity": "high",
                "message": f"Top buyer carries {round(record.top_buyer_share * 100)}% of revenue",
                "dimension": "Concentration Risk",
            }
        )
    if record.emi_delay_count_180d > 0:
        alerts.append(
            {
                "id": f"{record.id}-discipline",
                "enterprise_id": record.id,
                "enterprise_name": record.name,
                "severity": "high" if record.emi_delay_count_180d >= 2 else "medium",
                "message": f"{record.emi_delay_count_180d} EMI delays in the last 180 days",
                "dimension": "Credit Discipline",
            }
        )
    if record.bank_negative_days >= 5:
        alerts.append(
            {
                "id": f"{record.id}-liquidity",
                "enterprise_id": record.id,
                "enterprise_name": record.name,
                "severity": "medium",
                "message": f"{record.bank_negative_days} negative-balance days observed",
                "dimension": "Cashflow Liquidity",
            }
        )
    return alerts


def build_portfolio(scenario: str = "baseline") -> dict:
    if scenario not in SCENARIO_EFFECTS:
        scenario = "baseline"

    items = []
    alerts = []
    for record in MSME_DATASET.values():
        dimensions = dimension_scores(record, scenario)
        composite = clamp(sum(item["value"] for item in dimensions) / len(dimensions))
        reasons = reason_codes(record, dimensions)
        top_negative = next((reason for reason in reasons if reason["impact"] < 0), None)
        items.append(
            {
                "id": record.id,
                "name": record.name,
                "sector": record.sector,
                "location": record.location,
                "composite": composite,
                "tone": score_tone(composite),
                "decision": decision_for(composite),
                "top_risk_factor": top_negative["factor"] if top_negative else "No dominant risk factor",
                "ask": record.loan_request,
                "growth_pct": record.revenue_growth_pct,
            }
        )
        alerts.extend(_alerts_for(record))

    items.sort(key=lambda item: item["composite"])

    distribution = [
        {
            "bucket": label,
            "count": sum(1 for item in items if low <= item["composite"] < high),
        }
        for label, low, high in _BUCKETS
    ]

    tier_counts = {
        tone: sum(1 for item in items if item["tone"] == tone) for tone in ("good", "watch", "risk")
    }

    return {
        "scenario": scenario,
        "summary": {
            "count": len(items),
            "avg_score": clamp(sum(item["composite"] for item in items) / len(items)),
            "tier_counts": tier_counts,
            "total_exposure_lakh": round(
                sum(_exposure_lakh(record.loan_request) for record in MSME_DATASET.values())
            ),
        },
        "items": items,
        "alerts": alerts,
        "distribution": distribution,
    }
