# Nemesis Backend

FastAPI prototype backend for the Nemesis IDBI hackathon project.

It provides a runnable API surface for:

- MSME health-card scoring
- six-dimensional score generation
- reason-code output
- Guardian policy and audit signing
- Account Aggregator, GST, UPI, EPFO, OCEN, and ULI mock connector snapshots
- federated-learning readiness status
- architecture metadata for the frontend
- Groq, Firecrawl, Tinybird, OPA, monitoring, privacy, vector memory, storage, and workflow integration adapters

## Run

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Useful Endpoints

```text
GET  /api/v1/health
GET  /api/v1/enterprises
GET  /api/v1/health-card?enterprise_id=suryam&scenario=baseline
POST /api/v1/scenario/run
GET  /api/v1/connectors/snapshot
GET  /api/v1/audit/latest
GET  /api/v1/federated/status
GET  /api/v1/architecture
GET  /api/v1/integrations/summary
GET  /api/v1/ai/credit-memo
GET  /api/v1/verification/external
GET  /api/v1/policy/check
GET  /api/v1/model/monitor
GET  /api/v1/data-quality
GET  /api/v1/document-intelligence
GET  /api/v1/memory/status
GET  /api/v1/ops/status
POST /api/v1/privacy/redact
```

## Scenarios

```text
baseline
thinData
stress
attack
```

The frontend can run without this backend because it has a static fallback, but when this API is running the dashboard uses live scored responses.

## Optional Live Integrations

Set these environment variables to enable live providers. Without them, the API returns deterministic fallback payloads.

```text
GROQ_API_KEY
FIRECRAWL_API_KEY
TINYBIRD_TOKEN
TINYBIRD_EVENTS_URL
OPA_URL
QDRANT_URL
CHROMA_URL
MINIO_ENDPOINT
OTEL_EXPORTER_OTLP_ENDPOINT
ZERVE_WORKSPACE_URL
```
