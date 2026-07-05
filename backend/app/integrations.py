from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict
from datetime import datetime, timezone
from typing import Any

from .data import MSME_DATASET
from .pipeline import build_health_card


def _configured(*names: str) -> bool:
    return all(bool(os.getenv(name)) for name in names)


# Some API edges (e.g. Groq's) reject urllib's default Python User-Agent with 403.
_USER_AGENT = "nemesis-prototype/1.0"


def _post_json(url: str, headers: dict[str, str], payload: dict, timeout: int = 8) -> dict:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url, data=body, headers={"User-Agent": _USER_AGENT, **headers}, method="POST"
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _get_json(url: str, headers: dict[str, str] | None = None, timeout: int = 2) -> dict:
    request = urllib.request.Request(
        url, headers={"User-Agent": _USER_AGENT, **(headers or {})}, method="GET"
    )
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
            "name": "TinyFish",
            "category": "Agentic web intelligence",
            "status": "live-ready" if _configured("TINYFISH_API_KEY") else "fallback",
            "env": ["TINYFISH_API_KEY", "TINYFISH_EVENTS_URL"],
            "purpose": "Run web agents for MSME footprint checks and stream scoring/Guardian events.",
        },
        {
            "name": "Sarvam AI",
            "category": "Vernacular AI",
            "status": "live-ready" if _configured("SARVAM_API_KEY") else "fallback",
            "env": ["SARVAM_API_KEY"],
            "purpose": "Deliver credit-officer answers and borrower advice in Indian languages, voice-ready.",
        },
        {
            "name": "Pinecone",
            "category": "Vector memory (managed)",
            "status": "live-ready" if _configured("PINECONE_API_KEY") else "fallback",
            "env": ["PINECONE_API_KEY"],
            "purpose": "Managed vector index for credit memos, policy docs, and decision templates.",
        },
        {
            "name": "Zerve AI",
            "category": "Data-science workspace",
            "status": "live-ready" if _configured("ZERVE_API_KEY") else "fallback",
            "env": ["ZERVE_API_KEY", "ZERVE_WORKSPACE_URL"],
            "purpose": "Host feature experiments, scorecard reviews, and model validation workflows.",
        },
        {
            "name": "Pexels",
            "category": "Media enrichment",
            "status": "live-ready" if _configured("PEXELS_API_KEY") else "fallback",
            "env": ["PEXELS_API_KEY"],
            "purpose": "Fetch sector imagery for health cards, reports, and borrower-facing screens.",
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
            "name": "LangGraph",
            "category": "Agent orchestration",
            "status": "design-ready",
            "env": [],
            "purpose": "Convert the Perceiver -> Planner -> Guardian -> Recoverer pipeline into a graph workflow.",
        },
    ]


def _as_text(value: Any) -> str:
    """Flatten any JSON value into a readable string."""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return "; ".join(f"{str(k).replace('_', ' ')}: {_as_text(v)}" for k, v in value.items())
    if isinstance(value, list):
        return "; ".join(_as_text(item) for item in value)
    return str(value)


def _as_str_list(value: Any) -> list[str]:
    """Flatten any JSON value into a list of readable strings."""
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        return [f"{str(k).replace('_', ' ')}: {_as_text(v)}" for k, v in value.items()]
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            if isinstance(item, (dict, list)):
                out.extend(_as_str_list(item))
            else:
                out.append(_as_text(item))
        return out
    return [str(value)]


def _normalize_memo(memo: Any, enterprise: dict) -> dict:
    """Coerce an arbitrary LLM memo JSON into the strict shape the UI expects."""
    if not isinstance(memo, dict):
        memo = {}
    summary = memo.get("summary")
    mitigants = _as_str_list(memo.get("mitigants"))[:5]
    advice = _as_str_list(memo.get("borrower_advice") or memo.get("advice"))[:5]
    return {
        "summary": _as_text(summary)
        if summary is not None
        else f"{enterprise['name']} scored {enterprise['composite']}/100 with {enterprise['decision'].lower()}.",
        "decision": _as_text(memo.get("decision", enterprise["decision"])),
        "mitigants": mitigants or ["Cap exposure until buyer concentration improves."],
        "borrower_advice": advice or ["Diversify the buyer base and shorten receivable cycles."],
    }


def generate_credit_memo(enterprise_id: str, scenario: str = "baseline") -> dict:
    card = build_health_card(enterprise_id, scenario)
    enterprise = card["enterprise"]
    reasons = enterprise["reasons"]
    safe_context = redact_pii(json.dumps(enterprise, ensure_ascii=True))["redacted_text"]

    prompt = (
        "Write a concise MSME credit memo as strict JSON with exactly these keys: "
        '"summary" (one string sentence), "decision" (one short string), '
        '"mitigants" (array of short strings), "borrower_advice" (array of short strings). '
        "Every array element must be a plain string, not an object. "
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
                "memo": _normalize_memo(json.loads(content), enterprise),
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

    if _configured("TINYFISH_API_KEY", "TINYFISH_EVENTS_URL"):
        try:
            response = _post_json(
                os.environ["TINYFISH_EVENTS_URL"],
                {
                    "Authorization": f"Bearer {os.environ['TINYFISH_API_KEY']}",
                    "Content-Type": "application/json",
                },
                event,
            )
            return {"tool": "TinyFish", "mode": "live", "event": event, "response": response}
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            live_error = str(exc)
    elif _configured("TINYFISH_API_KEY"):
        return {
            "tool": "TinyFish",
            "mode": "key-configured",
            "event": event,
            "note": "API key detected; set TINYFISH_EVENTS_URL to stream events to a live endpoint.",
        }
    else:
        live_error = "TINYFISH_API_KEY not configured"

    return {"tool": "TinyFish", "mode": "fallback", "error": live_error, "event": event}


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
        "tool": "Qdrant / Chroma / Pinecone vector memory",
        "mode": "docker-ready",
        "qdrant_url": qdrant_url or "http://localhost:6333",
        "chroma_url": chroma_url or "http://localhost:8001",
        "qdrant_status": qdrant_status,
        "pinecone_status": "key-configured" if _configured("PINECONE_API_KEY") else "not_configured",
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
            "tool": "Zerve AI",
            "status": "key-configured" if _configured("ZERVE_API_KEY") else "not_configured",
            "workspace_url": os.getenv("ZERVE_WORKSPACE_URL", "not_configured"),
            "workflows": ["feature_experiment", "scorecard_review", "model_validation_report"],
        },
        "agent_graph": {
            "tool": "LangGraph",
            "nodes": ["perceiver", "planner", "guardian", "recoverer"],
            "edges": ["perceiver->planner", "planner->guardian", "guardian->recoverer"],
        },
    }


def sector_image(sector: str) -> dict:
    if _configured("PEXELS_API_KEY"):
        query = urllib.parse.quote(f"{sector} industry india")
        try:
            data = _get_json(
                f"https://api.pexels.com/v1/search?query={query}&per_page=1&orientation=landscape",
                {"Authorization": os.environ["PEXELS_API_KEY"]},
                timeout=6,
            )
            photos = data.get("photos") or []
            if photos:
                photo = photos[0]
                return {
                    "tool": "Pexels",
                    "mode": "live",
                    "image_url": photo["src"]["medium"],
                    "thumb_url": photo["src"]["small"],
                    "photographer": photo.get("photographer", ""),
                    "alt": photo.get("alt", sector),
                }
        except (KeyError, json.JSONDecodeError, urllib.error.URLError, TimeoutError, OSError):
            pass
    return {"tool": "Pexels", "mode": "fallback", "image_url": None, "thumb_url": None}


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
