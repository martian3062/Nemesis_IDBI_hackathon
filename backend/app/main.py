from __future__ import annotations

import threading
from pathlib import Path

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .env import load_env_file

load_env_file()

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
    sector_image,
)
from .ai_chat import chat_with_credit_officer
from .pipeline import (
    ARCHITECTURE_NODES,
    FEDERATED_SNAPSHOT,
    build_health_card,
    list_enterprises,
)
from .ml_model import get_model, score_enterprise
from .data import MSME_DATASET
from .portfolio import build_portfolio
from .simulation import run_simulation
from .swarm import run_swarm


class ScenarioRequest(BaseModel):
    enterprise_id: str = Field(default="suryam")
    scenario: str = Field(default="baseline")


class RedactionRequest(BaseModel):
    text: str = Field(default="Contact owner at owner@example.com or +919876543210")


class SimulationOverrides(BaseModel):
    gst_filing_timeliness: float | None = Field(default=None, ge=0.0, le=1.0)
    top_buyer_share: float | None = Field(default=None, ge=0.0, le=1.0)
    upi_monthly_inflow_lakh: float | None = Field(default=None, ge=0.0, le=200.0)
    emi_delay_count_180d: int | None = Field(default=None, ge=0, le=24)
    dso_days: int | None = Field(default=None, ge=0, le=180)
    bank_avg_balance_lakh: float | None = Field(default=None, ge=0.0, le=100.0)


class SimulationRequest(BaseModel):
    enterprise_id: str = Field(default="suryam")
    scenario: str = Field(default="baseline")
    overrides: SimulationOverrides = Field(default_factory=SimulationOverrides)


class ChatTurn(BaseModel):
    role: str = Field(default="user")
    content: str = Field(default="")


class ChatRequest(BaseModel):
    enterprise_id: str = Field(default="suryam")
    scenario: str = Field(default="baseline")
    message: str = Field(default="Why did this MSME get this score?", max_length=4000)
    history: list[ChatTurn] = Field(default_factory=list)


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


@app.post("/api/v1/simulate")
def simulate(request: SimulationRequest) -> dict:
    return run_simulation(
        request.enterprise_id,
        request.scenario,
        request.overrides.model_dump(exclude_none=True),
    )


@app.get("/api/v1/portfolio")
def portfolio(scenario: str = "baseline") -> dict:
    return build_portfolio(scenario)


@app.post("/api/v1/ai/chat")
def ai_chat(request: ChatRequest) -> dict:
    return chat_with_credit_officer(
        request.enterprise_id,
        request.scenario,
        request.message,
        [turn.model_dump() for turn in request.history],
    )


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


@app.post("/api/v1/swarm/run")
def swarm_run(request: ScenarioRequest) -> dict:
    return run_swarm(request.enterprise_id, request.scenario)


@app.get("/api/v1/ml/score")
def ml_score(enterprise_id: str = "suryam") -> dict:
    record = MSME_DATASET.get(enterprise_id, MSME_DATASET["suryam"])
    return score_enterprise(record)


@app.get("/api/v1/ml/validation")
def ml_validation() -> dict:
    return get_model().validation()


@app.get("/api/v1/ml/model-card")
def ml_model_card() -> dict:
    return get_model().model_card()


@app.get("/api/v1/ml/peers")
def ml_peers(enterprise_id: str = "suryam") -> dict:
    from .hf_foundation import nearest_peers

    return nearest_peers(enterprise_id)


@app.get("/api/v1/media/sector-image")
def media_sector_image(sector: str = "manufacturing") -> dict:
    return sector_image(sector)


@app.post("/api/v1/privacy/redact")
def privacy_redact(request: RedactionRequest) -> dict:
    return redact_pii(request.text)


# Serve the built React frontend (repo-root dist/) under /nemesis_idbi so a single
# uvicorn process can host the whole prototype on one port and coexist with other
# apps on the deployment host. The Vite base path matches this mount point.
FRONTEND_BASE = "/nemesis_idbi"
_DIST_DIR = Path(__file__).resolve().parent.parent.parent / "dist"
if _DIST_DIR.is_dir():

    @app.get("/")
    def root_redirect() -> RedirectResponse:
        return RedirectResponse(url=f"{FRONTEND_BASE}/")

    app.mount(FRONTEND_BASE, StaticFiles(directory=str(_DIST_DIR), html=True), name="frontend")


def _warm_ml_cache() -> None:
    """Pre-compute ML scores (incl. TabPFN) for every MSME so the Credit Model
    tab is instant from the first click. Runs in a background daemon thread."""
    try:
        for record in MSME_DATASET.values():
            score_enterprise(record)
    except Exception:
        pass


threading.Thread(target=_warm_ml_cache, daemon=True).start()
