from __future__ import annotations

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .integrations import (
    analytics_event,
    data_quality_snapshot,
    document_intelligence_snapshot,
    external_verification,
    generate_credit_memo,
    integration_catalog,
    integration_summary,
    memory_snapshot,
    model_monitor_snapshot,
    opa_policy_check,
    operations_snapshot,
    redact_pii,
)
from .pipeline import (
    ARCHITECTURE_NODES,
    FEDERATED_SNAPSHOT,
    build_health_card,
    list_enterprises,
)


class ScenarioRequest(BaseModel):
    enterprise_id: str = Field(default="suryam")
    scenario: str = Field(default="baseline")


class RedactionRequest(BaseModel):
    text: str = Field(default="Contact owner at owner@example.com or +919876543210")


app = FastAPI(
    title="Nemesis MSME Financial Health API",
    version="0.2.0",
    description="Hackathon prototype API for alternate-data MSME scoring, Guardian audit, and lending connector stubs.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "nemesis-msme-health-api",
        "version": "0.2.0",
    }


@app.get("/metrics")
def metrics() -> Response:
    body = "\n".join(
        [
            "# HELP nemesis_service_up Nemesis backend service availability",
            "# TYPE nemesis_service_up gauge",
            "nemesis_service_up 1",
            "# HELP nemesis_demo_integrations_total Number of modeled integration adapters",
            "# TYPE nemesis_demo_integrations_total gauge",
            f"nemesis_demo_integrations_total {len(integration_catalog())}",
            "",
        ]
    )
    return Response(content=body, media_type="text/plain; version=0.0.4")


@app.get("/api/v1/enterprises")
def enterprises() -> dict:
    return {"items": list_enterprises()}


@app.get("/api/v1/health-card")
def health_card(enterprise_id: str = "suryam", scenario: str = "baseline") -> dict:
    return build_health_card(enterprise_id, scenario)


@app.post("/api/v1/scenario/run")
def run_scenario(request: ScenarioRequest) -> dict:
    return build_health_card(request.enterprise_id, request.scenario)


@app.get("/api/v1/architecture")
def architecture() -> dict:
    return {"layers": ARCHITECTURE_NODES}


@app.get("/api/v1/federated/status")
def federated_status() -> dict:
    return {
        "strategy": "secure aggregation simulation",
        "raw_data_policy": "raw borrower data remains at each institution",
        "rounds": FEDERATED_SNAPSHOT,
    }


@app.get("/api/v1/connectors/snapshot")
def connector_snapshot(enterprise_id: str = "suryam", scenario: str = "baseline") -> dict:
    return build_health_card(enterprise_id, scenario)["connectors"]


@app.get("/api/v1/audit/latest")
def latest_audit(enterprise_id: str = "suryam", scenario: str = "baseline") -> dict:
    card = build_health_card(enterprise_id, scenario)
    return card["guardian"]


@app.get("/api/v1/integrations/catalog")
def integrations_catalog() -> dict:
    return {"items": integration_catalog()}


@app.get("/api/v1/integrations/summary")
def integrations_summary(enterprise_id: str = "suryam", scenario: str = "baseline") -> dict:
    return integration_summary(enterprise_id, scenario)


@app.get("/api/v1/ai/credit-memo")
def ai_credit_memo(enterprise_id: str = "suryam", scenario: str = "baseline") -> dict:
    return generate_credit_memo(enterprise_id, scenario)


@app.get("/api/v1/verification/external")
def verification_external(enterprise_id: str = "suryam") -> dict:
    return external_verification(enterprise_id)


@app.post("/api/v1/analytics/event")
def analytics_run_event(request: ScenarioRequest) -> dict:
    return analytics_event(request.enterprise_id, request.scenario)


@app.get("/api/v1/policy/check")
def policy_check(enterprise_id: str = "suryam", scenario: str = "baseline") -> dict:
    return opa_policy_check(enterprise_id, scenario)


@app.get("/api/v1/model/monitor")
def model_monitor() -> dict:
    return model_monitor_snapshot()


@app.get("/api/v1/data-quality")
def data_quality() -> dict:
    return data_quality_snapshot()


@app.get("/api/v1/document-intelligence")
def document_intelligence() -> dict:
    return document_intelligence_snapshot()


@app.get("/api/v1/memory/status")
def memory_status() -> dict:
    return memory_snapshot()


@app.get("/api/v1/ops/status")
def ops_status() -> dict:
    return operations_snapshot()


@app.post("/api/v1/privacy/redact")
def privacy_redact(request: RedactionRequest) -> dict:
    return redact_pii(request.text)
