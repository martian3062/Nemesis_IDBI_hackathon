from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from dataclasses import asdict
from datetime import datetime, timezone
from typing import Any

from .data import MSME_DATASET
from .pipeline import build_health_card


def _configured(*names: str) -> bool:
    return all(bool(os.getenv(name)) for name in names)


def _post_json(url: str, headers: dict[str, str], payload: dict, timeout: int = 8) -> dict:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _get_json(url: str, headers: dict[str, str] | None = None, timeout: int = 2) -> dict:
    request = urllib.request.Request(url, headers=headers or {}, method="GET")
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def redact_pii(text: str) -> dict:
    patterns = {
        "email": r"[\w\.-]+@[\w\.-]+\.\w+",
        "phone": r"(?:\+91[-\s]?)?[6-9]\d{9}",
        "pan_like": r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
        "account_like": r"\b\d{10,18}\b",
    }
    findings = []
    redacted = text
    for label, pattern in patterns.items():
        for match in re.findall(pattern, redacted):
            findings.append({"type": label, "value_preview": f"{match[:2]}***{match[-2:]}"})
            redacted = redacted.replace(match, f"[REDACTED_{label.upper()}]")
    return {
        "tool": "Presidio-compatible redaction layer",
        "mode": "regex_fallback",
        "findings": findings,
        "redacted_text": redacted,
    }


def integration_catalog() -> list[dict]:
    return [
        {
            "name": "Groq AI",
            "category": "AI credit officer",
            "status": "live-ready" if _configured("GROQ_API_KEY") else "fallback",
            "env": ["GROQ_API_KEY", "GROQ_MODEL"],
            "purpose": "Generate structured credit memo, borrower-facing improvement advice, and planner rationale.",
        },
        {
            "name": "Firecrawl",
            "category": "External verification",
            "status": "live-ready" if _configured("FIRECRAWL_API_KEY") else "fallback",
            "env": ["FIRECRAWL_API_KEY"],
            "purpose": "Verify MSME website footprint, public supplier/customer signals, and industry context.",
        },
        {
            "name": "Tinybird",
            "category": "Real-time analytics",
            "status": "live-ready" if _configured("TINYBIRD_TOKEN", "TINYBIRD_EVENTS_URL") else "fallback",
            "env": ["TINYBIRD_TOKEN", "TINYBIRD_EVENTS_URL"],
            "purpose": "Stream scoring runs, Guardian blocks, connector health, and conversion metrics.",
        },
        {
            "name": "Open Policy Agent",
            "category": "Policy engine",
            "status": "live-ready" if os.getenv("OPA_URL") else "local-rules",
            "env": ["OPA_URL"],
            "purpose": "Evaluate consent, auto-approval, and high-risk lending policies as external Rego rules.",
        },
        {
            "name": "SHAP",
            "category": "Explainability",
            "status": "reason-code fallback",
            "env": [],
            "purpose": "Upgrade deterministic reason codes into model-attribution explanations.",
        },
        {
            "name": "Great Expectations",
            "category": "Data quality",
            "status": "contract-ready",
            "env": [],
            "purpose": "Validate GST, UPI, EPFO, and statement fields before scoring.",
        },
        {
            "name": "Evidently AI",
            "category": "Model monitoring",
            "status": "report-ready",
            "env": [],
            "purpose": "Track score drift, missing-data drift, and model confidence over time.",
        },
        {
            "name": "Qdrant / Chroma",
            "category": "Vector memory",
            "status": "docker-ready",
            "env": ["QDRANT_URL", "CHROMA_URL"],
            "purpose": "Store policy docs, credit memos, MSME profiles, and explanation templates.",
        },
        {
            "name": "OpenTelemetry + Grafana",
            "category": "Observability",
            "status": "docker-ready",
            "env": ["OTEL_EXPORTER_OTLP_ENDPOINT"],
            "purpose": "Trace each scoring run from connector pull through Guardian audit.",
        },
        {
            "name": "Presidio",
            "category": "PII safety",
            "status": "regex fallback",
            "env": [],
            "purpose": "Redact PAN-like, phone, email, and account-like values before logs and LLM calls.",
        },
        {
            "name": "Docling / Unstructured",
            "category": "Document intelligence",
            "status": "contract-ready",
            "env": [],
            "purpose": "Parse invoice, GST, and bank-statement PDFs into structured underwriting features.",
        },
        {
            "name": "MinIO",
            "category": "Object storage",
            "status": "docker-ready",
            "env": ["MINIO_ENDPOINT", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY"],
            "purpose": "Store uploaded statements, invoices, OCR output, and signed health-card exports.",
        },
        {
            "name": "Zerve",
            "category": "Data science workspace",
            "status": "workflow-ready",
            "env": ["ZERVE_WORKSPACE_URL"],
            "purpose": "Host feature-engineering notebooks, score experiments, and reviewer-facing analysis runs.",
        },
        {
            "name": "LangGraph",
            "category": "Agent orchestration",
            "status": "design-ready",
            "env": [],
            "purpose": "Convert the Perceiver -> Planner -> Guardian -> Recoverer pipeline into a graph workflow.",
        },
    ]


def generate_credit_memo(enterprise_id: str, scenario: str = "baseline") -> dict:
    card = build_health_card(enterprise_id, scenario)
    enterprise = card["enterprise"]
    reasons = enterprise["reasons"]
    safe_context = redact_pii(json.dumps(enterprise, ensure_ascii=True))["redacted_text"]

    prompt = (
        "Write a concise MSME credit memo as JSON with keys summary, decision, mitigants, borrower_advice. "
        f"Use this redacted underwriting context: {safe_context}"
    )

    if _configured("GROQ_API_KEY"):
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        try:
            response = _post_json(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
                    "Content-Type": "application/json",
                },
                {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are a credit officer. Return valid JSON only."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                },
            )
            content = response["choices"][0]["message"]["content"]
            return {
                "tool": "Groq AI",
                "mode": "live",
                "model": model,
                "memo": json.loads(content),
            }
        except (KeyError, json.JSONDecodeError, urllib.error.URLError, TimeoutError, OSError) as exc:
            live_error = str(exc)
    else:
        live_error = "GROQ_API_KEY not configured"

    top_positive = next((item for item in reasons if item["impact"] > 0), reasons[0])
    top_negative = next((item for item in reasons if item["impact"] < 0), reasons[-1])
    return {
        "tool": "Groq AI",
        "mode": "fallback",
        "error": live_error,
        "memo": {
            "summary": f"{enterprise['name']} scores {enterprise['composite']}/100 with {enterprise['decision'].lower()}.",
            "decision": enterprise["decision"],
            "mitigants": [
                top_negative["text"],
                "Route exposure through invoice-backed limits and monitor monthly GST-bank reconciliation.",
            ],
            "borrower_advice": [
                top_positive["text"],
                "Reduce buyer concentration and shorten receivable cycles to improve the next score run.",
            ],
        },
    }


def external_verification(enterprise_id: str) -> dict:
    record = MSME_DATASET.get(enterprise_id, MSME_DATASET["suryam"])
    query_url = f"https://example.com/{record.name.lower().replace(' ', '-')}"

    if _configured("FIRECRAWL_API_KEY"):
        try:
            response = _post_json(
                "https://api.firecrawl.dev/v2/scrape",
                {
                    "Authorization": f"Bearer {os.environ['FIRECRAWL_API_KEY']}",
                    "Content-Type": "application/json",
                },
                {
                    "url": query_url,
                    "formats": ["markdown"],
                    "onlyMainContent": True,
                },
            )
            return {
                "tool": "Firecrawl",
                "mode": "live",
                "target": query_url,
                "signals": [
                    "External page fetched and converted to markdown.",
                    "Ready for supplier, website, and risk-keyword enrichment.",
                ],
                "raw": response,
            }
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            live_error = str(exc)
    else:
        live_error = "FIRECRAWL_API_KEY not configured"

    return {
        "tool": "Firecrawl",
        "mode": "fallback",
        "error": live_error,
        "target": query_url,
        "signals": [
            f"{record.name} has a mock external footprint for demo verification.",
            f"Sector context: {record.sector}; location risk context: {record.location}.",
            "No adverse web signal found in fallback simulation.",
        ],
    }


def analytics_event(enterprise_id: str, scenario: str) -> dict:
    card = build_health_card(enterprise_id, scenario)
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "enterprise_id": enterprise_id,
        "scenario": scenario,
        "score": card["enterprise"]["composite"],
        "guardian_verdict": card["guardian"]["verdict"],
        "tier_used": card["benchmark"]["tier_used"],
    }

    if _configured("TINYBIRD_TOKEN", "TINYBIRD_EVENTS_URL"):
        try:
            response = _post_json(
                os.environ["TINYBIRD_EVENTS_URL"],
                {
                    "Authorization": f"Bearer {os.environ['TINYBIRD_TOKEN']}",
                    "Content-Type": "application/json",
                },
                event,
            )
            return {"tool": "Tinybird", "mode": "live", "event": event, "response": response}
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            live_error = str(exc)
    else:
        live_error = "TINYBIRD_TOKEN or TINYBIRD_EVENTS_URL not configured"

    return {"tool": "Tinybird", "mode": "fallback", "error": live_error, "event": event}


def opa_policy_check(enterprise_id: str, scenario: str) -> dict:
    card = build_health_card(enterprise_id, scenario)
    payload = {
        "input": {
            "score": card["enterprise"]["composite"],
            "verdict": card["guardian"]["verdict"],
            "consent_scopes": card["connectors"]["account_aggregator"]["scopes"],
            "scenario": scenario,
        }
    }
    opa_url = os.getenv("OPA_URL")
    if opa_url:
        try:
            response = _post_json(
                f"{opa_url.rstrip('/')}/v1/data/nemesis/underwriting/allow",
                {"Content-Type": "application/json"},
                payload,
            )
            return {"tool": "OPA", "mode": "live", "policy_input": payload["input"], "result": response}
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            live_error = str(exc)
    else:
        live_error = "OPA_URL not configured"

    allow = card["enterprise"]["composite"] >= 62 and card["guardian"]["verdict"] != "BLOCKED"
    return {
        "tool": "OPA",
        "mode": "local-rules",
        "error": live_error,
        "policy_input": payload["input"],
        "result": {
            "allow": allow,
            "reason": "local fallback: score threshold plus Guardian verdict",
        },
    }


def model_monitor_snapshot() -> dict:
    cards = [build_health_card(record_id, "baseline") for record_id in MSME_DATASET]
    scores = [card["enterprise"]["composite"] for card in cards]
    confidence = [card["benchmark"]["model_confidence"] for card in cards]
    return {
        "tool": "Evidently AI compatible monitor",
        "mode": "computed_snapshot",
        "score_mean": round(sum(scores) / len(scores), 2),
        "score_min": min(scores),
        "score_max": max(scores),
        "confidence_mean": round(sum(confidence) / len(confidence), 2),
        "drift_alerts": [
            "Watch buyer-concentration drift for agro and industrial segments.",
            "Statement-month coverage should remain above 9 months for auto-decision comfort.",
        ],
    }


def data_quality_snapshot() -> dict:
    expectations = []
    for record in MSME_DATASET.values():
        raw = asdict(record)
        checks = {
            "gst_filing_timeliness_between_0_and_1": 0 <= raw["gst_filing_timeliness"] <= 1,
            "upi_inflow_positive": raw["upi_monthly_inflow_lakh"] > 0,
            "statement_months_min_6": raw["statement_months"] >= 6,
            "top_buyer_share_between_0_and_1": 0 <= raw["top_buyer_share"] <= 1,
        }
        expectations.append(
            {
                "enterprise_id": record.id,
                "passed": sum(1 for value in checks.values() if value),
                "total": len(checks),
                "checks": checks,
            }
        )
    return {
        "tool": "Great Expectations compatible contract",
        "mode": "local_validation",
        "expectations": expectations,
    }


def document_intelligence_snapshot() -> dict:
    return {
        "tool": "Docling / Unstructured compatible parser",
        "mode": "contract_stub",
        "supported_docs": ["bank_statement_pdf", "invoice_pdf", "gst_return_pdf", "purchase_order_pdf"],
        "extracted_fields": [
            "invoice_amount",
            "counterparty",
            "due_date",
            "statement_balance",
            "gst_period",
            "cashflow_line_items",
        ],
    }


def memory_snapshot() -> dict:
    qdrant_url = os.getenv("QDRANT_URL")
    chroma_url = os.getenv("CHROMA_URL")
    qdrant_status: str | dict[str, Any] = "not_configured"
    if qdrant_url:
        try:
            qdrant_status = _get_json(f"{qdrant_url.rstrip('/')}/", timeout=1)
        except (urllib.error.URLError, TimeoutError, OSError):
            qdrant_status = "offline_or_not_started"

    return {
        "tool": "Qdrant / Chroma vector memory",
        "mode": "docker-ready",
        "qdrant_url": qdrant_url or "http://localhost:6333",
        "chroma_url": chroma_url or "http://localhost:8001",
        "qdrant_status": qdrant_status,
        "collections": ["credit_memos", "policy_docs", "msme_profiles", "reason_templates"],
    }


def operations_snapshot() -> dict:
    return {
        "observability": {
            "tool": "OpenTelemetry + Prometheus + Grafana",
            "otlp_endpoint": os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317"),
            "metrics": [
                "nemesis_score_runs_total",
                "nemesis_guardian_blocks_total",
                "nemesis_connector_failures_total",
                "nemesis_decision_latency_ms",
            ],
        },
        "storage": {
            "tool": "MinIO",
            "endpoint": os.getenv("MINIO_ENDPOINT", "http://localhost:9000"),
            "buckets": ["documents", "health-cards", "audit-exports"],
        },
        "workspace": {
            "tool": "Zerve",
            "workspace_url": os.getenv("ZERVE_WORKSPACE_URL", "not_configured"),
            "workflows": ["feature_experiment", "scorecard_review", "model_validation_report"],
        },
        "agent_graph": {
            "tool": "LangGraph",
            "nodes": ["perceiver", "planner", "guardian", "recoverer"],
            "edges": ["perceiver->planner", "planner->guardian", "guardian->recoverer"],
        },
    }


def integration_summary(enterprise_id: str, scenario: str) -> dict:
    return {
        "catalog": integration_catalog(),
        "credit_memo": generate_credit_memo(enterprise_id, scenario),
        "external_verification": external_verification(enterprise_id),
        "analytics_event": analytics_event(enterprise_id, scenario),
        "policy": opa_policy_check(enterprise_id, scenario),
        "model_monitor": model_monitor_snapshot(),
        "data_quality": data_quality_snapshot(),
        "document_intelligence": document_intelligence_snapshot(),
        "memory": memory_snapshot(),
        "operations": operations_snapshot(),
    }
