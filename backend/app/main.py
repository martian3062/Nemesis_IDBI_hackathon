from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .pipeline import (
    ARCHITECTURE_NODES,
    FEDERATED_SNAPSHOT,
    build_health_card,
    list_enterprises,
)


class ScenarioRequest(BaseModel):
    enterprise_id: str = Field(default="suryam")
    scenario: str = Field(default="baseline")


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
