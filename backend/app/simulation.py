from __future__ import annotations

from dataclasses import replace

from .data import MSME_DATASET, SCENARIO_EFFECTS
from .scoring import decision_for, dimension_scores, clamp, reason_codes


SIMULATABLE_FIELDS = {
    "gst_filing_timeliness": (0.0, 1.0),
    "top_buyer_share": (0.0, 1.0),
    "upi_monthly_inflow_lakh": (0.0, 200.0),
    "emi_delay_count_180d": (0, 24),
    "dso_days": (0, 180),
    "bank_avg_balance_lakh": (0.0, 100.0),
}


def _composite(dimensions: list[dict]) -> int:
    return clamp(sum(item["value"] for item in dimensions) / len(dimensions))


def run_simulation(enterprise_id: str, scenario: str, overrides: dict) -> dict:
    if enterprise_id not in MSME_DATASET:
        enterprise_id = "suryam"
    if scenario not in SCENARIO_EFFECTS:
        scenario = "baseline"

    record = MSME_DATASET[enterprise_id]

    cleaned: dict = {}
    for field, value in overrides.items():
        if field not in SIMULATABLE_FIELDS or value is None:
            continue
        low, high = SIMULATABLE_FIELDS[field]
        bounded = max(low, min(high, value))
        if isinstance(low, int) and isinstance(high, int):
            bounded = int(round(bounded))
        cleaned[field] = bounded

    simulated_record = replace(record, **cleaned) if cleaned else record

    baseline_dimensions = dimension_scores(record, scenario)
    simulated_dimensions = dimension_scores(simulated_record, scenario)
    baseline_composite = _composite(baseline_dimensions)
    simulated_composite = _composite(simulated_dimensions)

    return {
        "enterprise_id": enterprise_id,
        "scenario": scenario,
        "overrides_applied": cleaned,
        "baseline": {
            "composite": baseline_composite,
            "decision": decision_for(baseline_composite),
            "dimensions": baseline_dimensions,
        },
        "simulated": {
            "composite": simulated_composite,
            "decision": decision_for(simulated_composite),
            "dimensions": simulated_dimensions,
            "reasons": reason_codes(simulated_record, simulated_dimensions),
        },
        "deltas": [
            {
                "label": baseline_dim["label"],
                "before": baseline_dim["value"],
                "after": simulated_dim["value"],
            }
            for baseline_dim, simulated_dim in zip(baseline_dimensions, simulated_dimensions)
        ],
    }
