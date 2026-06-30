from __future__ import annotations

from .connectors import collect_connector_snapshot
from .data import MSME_DATASET, SCENARIO_EFFECTS
from .guardian import guardian_review
from .scoring import score_health_card


SWARM_AGENTS = [
    {
        "name": "Perceiver",
        "role": "AA, GST, UPI, EPFO ingestion",
        "tier": "Tier 2 CPU",
        "health": 98,
        "detail": "Normalizes consented data and flags gaps before scoring.",
    },
    {
        "name": "Planner",
        "role": "Credit action planner",
        "tier": "Tier 1 LLM-ready",
        "health": 94,
        "detail": "Chooses score path, loan structure, and mitigants.",
    },
    {
        "name": "Guardian",
        "role": "Policy and injection defense",
        "tier": "Always-on rules",
        "health": 100,
        "detail": "Blocks unsafe recommendations and signs each decision.",
    },
    {
        "name": "Recoverer",
        "role": "Partial-data fallback",
        "tier": "Tier 3 light",
        "health": 91,
        "detail": "Keeps decisioning alive when connectors fail or data is thin.",
    },
]


ARCHITECTURE_NODES = [
    {
        "layer": "L1",
        "name": "Consent and source connectors",
        "components": ["AA", "GSTN", "NPCI UPI", "EPFO", "Bank parser"],
        "status": "mocked in backend",
    },
    {
        "layer": "L2",
        "name": "Feature engineering",
        "components": ["cashflow", "compliance", "concentration", "working capital"],
        "status": "implemented as deterministic score features",
    },
    {
        "layer": "L3",
        "name": "Swarm and scoring",
        "components": ["Perceiver", "Planner", "Guardian", "Recoverer"],
        "status": "implemented as orchestrated pipeline",
    },
    {
        "layer": "L4",
        "name": "Delivery and lending rails",
        "components": ["Health Card UI", "OCEN payload", "ULI payload", "LOS handoff"],
        "status": "API-ready stubs",
    },
]


FEDERATED_SNAPSHOT = [
    {"bank": "IDBI sandbox", "auc": "0.86", "drift": "low", "samples": "18.2k"},
    {"bank": "NBFC partner A", "auc": "0.83", "drift": "medium", "samples": "11.7k"},
    {"bank": "Co-op bank node", "auc": "0.81", "drift": "medium", "samples": "7.4k"},
]


def event_stream(scenario: str, score: int, verdict: str) -> list[str]:
    events = [
        "AA consent token issued for GST, bank, EPFO, and UPI scopes",
        "Perceiver mapped alternate-data features into six score dimensions",
        "Planner selected working-capital path and mitigants",
        f"Scoring cascade completed with composite score {score}",
        f"Guardian returned {verdict} and signed the decision envelope",
    ]
    if scenario == "thinData":
        events.insert(2, "Recoverer activated partial-data fallback for missing EPFO scope")
    if scenario == "attack":
        events.insert(3, "Injection sentinel detected unsafe override attempt")
    return events


def build_health_card(enterprise_id: str, scenario: str = "baseline") -> dict:
    if enterprise_id not in MSME_DATASET:
        enterprise_id = "suryam"
    if scenario not in SCENARIO_EFFECTS:
        scenario = "baseline"

    record = MSME_DATASET[enterprise_id]
    scored = score_health_card(record, scenario)
    enterprise = scored["enterprise"]
    connectors = collect_connector_snapshot(record, scenario, enterprise["composite"], enterprise["decision"])
    guardian = guardian_review(
        enterprise_id=enterprise_id,
        scenario=scenario,
        score=enterprise["composite"],
        decision=enterprise["decision"],
        consent=connectors["account_aggregator"],
        benchmark=scored["benchmark"],
    )

    return {
        "scenario": {
            "key": scenario,
            "label": SCENARIO_EFFECTS[scenario]["label"],
        },
        "enterprise": enterprise,
        "connectors": connectors,
        "guardian": guardian,
        "benchmark": scored["benchmark"],
        "swarm_agents": SWARM_AGENTS,
        "events": event_stream(scenario, enterprise["composite"], guardian["verdict"]),
        "federated_rounds": FEDERATED_SNAPSHOT,
        "architecture_nodes": ARCHITECTURE_NODES,
    }


def list_enterprises() -> list[dict]:
    return [
        {
            "id": record.id,
            "name": record.name,
            "sector": record.sector,
            "location": record.location,
            "loan_request": record.loan_request,
        }
        for record in MSME_DATASET.values()
    ]
