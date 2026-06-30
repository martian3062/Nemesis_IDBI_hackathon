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
```

## Scenarios

```text
baseline
thinData
stress
attack
```

The frontend can run without this backend because it has a static fallback, but when this API is running the dashboard uses live scored responses.
