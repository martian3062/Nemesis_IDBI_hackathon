# Nemesis IDBI Hackathon

Nemesis is an MSME Financial Health Card and creditworthiness intelligence console built for the IDBI Innovate hackathon. It takes inspiration from the Eraya self-healing agent-swarm architecture and applies that pattern to alternate-data MSME lending.

The current repository contains a runnable full-stack prototype: a React + TypeScript operator console and a FastAPI backend that generates six-dimensional scores, reason codes, connector snapshots, Guardian policy findings, audit signatures, and federated-learning readiness metadata.

## One-Line Pitch

Nemesis converts AA-consented alternate data such as GST, UPI, EPFO, and bank-statement flows into an explainable MSME Financial Health Card, helping IDBI evaluate thin-file and new-to-credit businesses faster, safer, and with auditable reason codes.

## Problem Statement

Many MSMEs are creditworthy but remain under-served because traditional underwriting depends heavily on audited financials, ITR history, bureau depth, and manual document review. This creates four practical problems:

- Thin-file MSMEs can be rejected even when their real transaction behavior is healthy.
- GST, UPI, EPFO, bank, and invoice signals are fragmented across different systems.
- Decisioning takes days or weeks instead of minutes.
- Black-box scoring is difficult to justify in compliance, audit, and customer-facing workflows.

Nemesis addresses this by turning consented alternate data into a structured, explainable, and policy-checked health-card workflow.

## Solution Overview

Nemesis acts as an "enterprise mirror" for MSME lending:

- MSMEs see a transparent financial-health card instead of an opaque approval or rejection.
- IDBI sees hidden creditworthiness through alternate data and behavioral signals.
- Credit teams get reason codes, risk flags, scenario simulation, and audit trails.
- The system keeps working when some connectors are unavailable by using staged fallback logic.

## Current Prototype

The shipped prototype includes a frontend console plus a backend scoring API.

| Section | Purpose |
| --- | --- |
| Health Card | Shows the composite score, enterprise profile, loan request, six score dimensions, and cashflow trend |
| Swarm | Visualizes the four-agent underwriting swarm: Perceiver, Planner, Guardian, and Recoverer |
| Explainability | Shows reason codes, positive/negative score drivers, and counterfactual stress tests |
| Guardian | Demonstrates consent, policy, injection-defense, and tamper-evident audit controls |
| Federated | Shows a future multi-bank federated-learning view where model learning happens without raw data pooling |
| Architecture | Shows the consent, feature, swarm, scoring, and lending-rail workflow |
| API | Lists live backend endpoints and connector readiness |
| Integrations | Shows Groq, Firecrawl, Tinybird, OPA, SHAP, Great Expectations, Evidently, Qdrant/Chroma, OpenTelemetry, Presidio, Docling/Unstructured, MinIO, Zerve, and LangGraph readiness |

## Implemented Backend

The `backend/` folder now contains a FastAPI service with deterministic scoring and mock integrations.

| Module | What It Does |
| --- | --- |
| `backend/app/data.py` | Holds synthetic MSME records and scenario definitions |
| `backend/app/connectors.py` | Simulates AA, GSTN, UPI, EPFO, bank statement, OCEN, and ULI payloads |
| `backend/app/scoring.py` | Builds features, six score dimensions, composite score, reason codes, and benchmark metadata |
| `backend/app/guardian.py` | Performs policy checks, prompt-injection detection, and HMAC audit signing |
| `backend/app/integrations.py` | Optional AI, web verification, analytics, policy, monitoring, privacy, vector memory, document, storage, and workspace adapters |
| `backend/app/pipeline.py` | Orchestrates connectors, scoring, Guardian review, events, architecture, and federated status |
| `backend/app/main.py` | Exposes the FastAPI endpoints |

### API Endpoints

```text
GET  /api/v1/health
GET  /api/v1/enterprises
GET  /api/v1/health-card?enterprise_id=suryam&scenario=baseline
POST /api/v1/scenario/run
GET  /api/v1/connectors/snapshot
GET  /api/v1/audit/latest
GET  /api/v1/federated/status
GET  /api/v1/architecture
GET  /api/v1/integrations/catalog
GET  /api/v1/integrations/summary
GET  /api/v1/ai/credit-memo
GET  /api/v1/verification/external
POST /api/v1/analytics/event
GET  /api/v1/policy/check
GET  /api/v1/model/monitor
GET  /api/v1/data-quality
GET  /api/v1/document-intelligence
GET  /api/v1/memory/status
GET  /api/v1/ops/status
POST /api/v1/privacy/redact
```

### Supported Scenarios

```text
baseline   Normal consented alternate-data scoring
thinData   Missing/partial connector data with Recoverer fallback
stress     Liquidity and concentration stress-test state
attack     Prompt-injection and unsafe override simulation
```

## Key Features

- Six-dimensional MSME score:
  - Cashflow Liquidity
  - Credit Discipline
  - Compliance Health
  - Concentration Risk
  - Growth Trajectory
  - Working Capital Efficiency
- Composite score with approve, review, and risk signaling.
- Alternate-data feature cards for GST, UPI, EPFO, and bank-statement coverage.
- SHAP-style reason-code surface for human-readable credit explanations.
- Scenario runner for baseline, thin-data, stress-test, and attack-simulation states.
- Guardian audit seal for policy-checked decisions.
- Agent-swarm architecture inspired by Eraya.
- Federated-learning concept for cross-bank model improvement without raw-data sharing.
- Optional AI credit memo through Groq with deterministic fallback.
- Optional external MSME verification through Firecrawl with fallback signals.
- Tinybird-ready scoring event stream.
- OPA-ready external policy evaluation with local rules fallback.
- Great Expectations-style data quality contracts.
- Evidently-style model monitor snapshot.
- Presidio-compatible PII redaction fallback.
- Qdrant/Chroma vector-memory readiness.
- MinIO document/export storage readiness.
- OpenTelemetry, Prometheus, Grafana, and Jaeger observability-ready services.
- Zerve and LangGraph workflow readiness.

## Advanced Tool Integrations

All advanced integrations are demo-safe. If the API key or service is present, Nemesis uses the live adapter. If it is absent, Nemesis returns a structured fallback response so the hackathon flow still works.

| Tool | Nemesis Use | Live Unlock |
| --- | --- | --- |
| Groq AI | AI credit officer memo, planner rationale, borrower improvement advice | `GROQ_API_KEY` |
| Firecrawl | External web footprint and supplier/context verification | `FIRECRAWL_API_KEY` |
| Tinybird | Real-time scoring and Guardian event analytics | `TINYBIRD_TOKEN`, `TINYBIRD_EVENTS_URL` |
| Open Policy Agent | External Rego policy checks for consent and auto-approval | `OPA_URL` |
| SHAP | Future model-attribution upgrade for current reason codes | Python ML layer |
| Great Expectations | Connector and feature data-quality validation contracts | Local contracts |
| Evidently AI | Score drift, confidence drift, and monitoring reports | Local snapshot / future reports |
| Qdrant / Chroma | Vector memory for credit memos, policy docs, profiles, templates | Docker or URLs |
| OpenTelemetry + Grafana | Agent and scoring observability | Docker Compose |
| Presidio | PII redaction before logs, prompts, and audit exports | Regex fallback now |
| Docling / Unstructured | Invoice, statement, GST, and purchase-order parsing | Contract stub now |
| MinIO | Object storage for documents and health-card exports | Docker Compose |
| Zerve | Data science workflows and score experiment workspaces | `ZERVE_WORKSPACE_URL` |
| LangGraph | Future graph orchestration for Perceiver -> Planner -> Guardian -> Recoverer | Design-ready |

## Architecture

Nemesis is designed as a layered system. The current repository implements the frontend prototype, while the architecture below describes the complete target solution.

```mermaid
flowchart TB
    A[MSME / Relationship Manager] --> B[Consent Orchestration]
    B --> C1[GST Connector]
    B --> C2[UPI / NPCI Connector]
    B --> C3[EPFO Connector]
    B --> C4[Bank Statement Parser]
    B --> C5[Invoice / Document OCR]

    C1 --> D[Ingestion and Normalization Bus]
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D

    D --> E[Feature Engineering Layer]
    E --> F[Agent Swarm Core]

    F --> G1[Perceiver Agent]
    F --> G2[Planner Agent]
    F --> G3[Guardian Agent]
    F --> G4[Recoverer Agent]

    G1 --> H[Six-Dimension Scoring Engine]
    G2 --> H
    G3 --> I[Policy, Consent, XAI, Audit]
    G4 --> H

    H --> J[Explainability Layer]
    I --> J
    J --> K[Nemesis Health Card UI]
    J --> L[IDBI LOS / LMS / OCEN / ULI APIs]

    M[Federated Learning Coordinator] --> H
    N[Bank / NBFC Model Nodes] --> M
```

## Architectural Layers

| Layer | Component | Responsibility |
| --- | --- | --- |
| L1 | Consent and ingestion | Pull AA-consented GST, UPI, EPFO, bank statement, invoice, and document data |
| L2 | Data normalization | Convert raw connector responses into stable MSME timelines and entity profiles |
| L3 | Feature engineering | Generate liquidity, compliance, concentration, growth, and working-capital features |
| L4 | Agent swarm | Coordinate perception, planning, policy checks, and fallback recovery |
| L5 | Scoring engine | Produce six-dimensional score plus composite creditworthiness score |
| L6 | Explainability | Convert model outputs into reason codes, score drivers, and counterfactuals |
| L7 | Delivery | Serve UI, APIs, audit records, LOS integration, OCEN, ULI, and AA workflows |
| L8 | Federated learning | Improve models across institutions without sharing raw customer data |

## Agent Swarm Design

Nemesis reuses the Eraya idea of a resilient four-agent swarm, adapted for banking and MSME underwriting.

| Agent | Role in Nemesis | Example Output |
| --- | --- | --- |
| Perceiver Agent | Reads consented data, detects quality gaps, maps raw signals into structured features | "GST-bank reconciliation confidence: 96%" |
| Planner Agent | Selects scoring path, credit product, mitigants, and exposure recommendation | "Approve with buyer concentration cap" |
| Guardian Agent | Enforces consent scope, explainability, RBI-aligned policy rules, and injection defense | "Blocked unsafe override; signed audit record" |
| Recoverer Agent | Keeps the workflow alive when data is missing, partial, delayed, or inconsistent | "Fallback to thin-file deterministic score" |

## Three-Tier Scoring Cascade

Nemesis is designed to avoid one-point failure in scoring. Each agent can degrade gracefully through three tiers.

```mermaid
flowchart LR
    A[Incoming MSME Signal] --> B{Data Quality and Runtime Budget}
    B -->|Rich data / full model available| C[Tier 1: ML / Deep Model / LLM-Assisted Planning]
    B -->|Moderate data / CPU path| D[Tier 2: XGBoost, Tabular Models, Rules + Calibration]
    B -->|Thin data / connector failure| E[Tier 3: Deterministic Policy and Fallback Score]
    C --> F[Health Card Score]
    D --> F
    E --> F
    F --> G[Guardian Audit + Reason Codes]
```

Tier behavior:

- Tier 1: richer model path for complete data and advanced planning.
- Tier 2: reliable tabular scoring path for normal underwriting.
- Tier 3: deterministic fallback for thin-file or connector-failure scenarios.

## End-to-End Workflow

```mermaid
sequenceDiagram
    participant MSME
    participant NemesisUI
    participant Consent
    participant Ingestion
    participant Swarm
    participant Scorer
    participant Guardian
    participant IDBI

    MSME->>NemesisUI: Starts loan / health-card journey
    NemesisUI->>Consent: Requests AA and source consent
    Consent->>Ingestion: Shares scoped data tokens
    Ingestion->>Swarm: Sends normalized GST, UPI, EPFO, bank data
    Swarm->>Scorer: Builds features and selects score path
    Scorer->>Guardian: Sends score, risk flags, and recommendation
    Guardian->>Guardian: Checks consent, policy, injection, XAI, audit
    Guardian->>NemesisUI: Returns signed health-card result
    NemesisUI->>IDBI: Sends decision package to LOS / OCEN / ULI
```

## Data Workflow

1. Consent capture: MSME authorizes scoped access through AA and source-specific connectors.
2. Data pull: GST, UPI, EPFO, bank, invoice, and document signals are fetched.
3. Entity resolution: Business identity, account, GSTIN, employer, and invoice entities are matched.
4. Normalization: Raw records are converted into monthly and transaction-level time series.
5. Feature generation: The current backend derives liquidity, discipline, compliance, concentration, growth, working-capital, and data-quality features.
6. Score calculation: The scoring cascade generates six dimension scores and a composite score.
7. Explainability: Score drivers are converted into human-readable reason codes.
8. Guardian review: Consent scope, policy rules, safety checks, and audit signing are applied.
9. Delivery: The Health Card appears in the UI and can be sent into IDBI systems through APIs.

## Six-Dimension Score Model

| Dimension | What It Measures | Example Signals |
| --- | --- | --- |
| Cashflow Liquidity | Ability to sustain cash inflows and absorb short-term shocks | UPI inflow volatility, bank balance trend, recurring credits |
| Credit Discipline | Repayment behavior and financial reliability | EMI delays, cheque returns, overdraft behavior |
| Compliance Health | Timeliness and consistency of formal reporting | GST filing regularity, GST-bank reconciliation, tax continuity |
| Concentration Risk | Dependence on a small set of buyers or suppliers | Top-buyer share, invoice HHI, customer churn |
| Growth Trajectory | Momentum and stability of business expansion | GST sales CAGR, transaction count growth, repeat-customer share |
| Working Capital Efficiency | Operating-cycle quality and capital usage | DSO, DPO, inventory cycle, invoice aging |

## Explainability and Reason Codes

Nemesis is designed so every score can be explained to both the lender and the MSME.

Example reason-code outputs:

- Positive: "GST filing regularity improved the compliance score because monthly returns were submitted on time for 12 months."
- Positive: "UPI settlement depth improved liquidity confidence because transaction count and receipt consistency are high."
- Negative: "Buyer concentration reduced the composite score because the top buyer contributes more than 40% of revenue."
- Negative: "Working-capital efficiency is under watch because invoice realization time increased in the last quarter."

## Guardian and Security Model

The Guardian layer is the policy and safety control plane.

| Control | Purpose |
| --- | --- |
| Consent scope enforcement | Prevents use of data outside the MSME-approved purpose |
| RBI-aligned explainability | Ensures every score has a reason-code trail |
| High-risk action gate | Blocks unsafe automated recommendations without review |
| Prompt-injection defense | Scans operator/model text for override or manipulation attempts |
| Tamper-evident audit | Signs important decision envelopes with an audit seal |
| Partial-data warning | Marks outputs where connector gaps reduce score confidence |

## Federated Learning Vision

Nemesis can support federated learning for consortium-scale model improvement:

- Raw MSME data stays within each participating institution.
- Local model nodes train on their own data.
- Only encrypted or aggregated model updates are shared.
- IDBI can benefit from broader learning without centralizing sensitive borrower data.

```mermaid
flowchart LR
    A[IDBI Model Node] --> D[Secure Aggregation]
    B[NBFC Model Node] --> D
    C[Co-op Bank Model Node] --> D
    D --> E[Global MSME Risk Model Update]
    E --> A
    E --> B
    E --> C
```

## Prototype UI Map

| UI Area | User Question It Answers |
| --- | --- |
| Composite score card | Is this MSME likely creditworthy? |
| Dimension radar | Which parts of the business are strong or weak? |
| Feature tiles | Which alternate-data sources are supporting the score? |
| Cashflow trend | Is liquidity improving, stable, or deteriorating? |
| Swarm view | Which agent made which part of the decision? |
| Explainability view | Why did the score move up or down? |
| Guardian view | Was the decision policy-checked and auditable? |
| Federated view | How can the model improve without raw-data pooling? |

## Repository Structure

```text
Nemesis_IDBI_hackathon/
|-- backend/
|   |-- app/
|   |   |-- connectors.py     # AA, GST, UPI, EPFO, OCEN, ULI mock connectors
|   |   |-- data.py           # Synthetic MSME records
|   |   |-- guardian.py       # Policy checks and HMAC audit signing
|   |   |-- integrations.py   # Optional Groq, Firecrawl, Tinybird, OPA, monitoring, memory adapters
|   |   |-- main.py           # FastAPI entrypoint
|   |   |-- pipeline.py       # End-to-end health-card orchestration
|   |   `-- scoring.py        # Feature engineering and six-dimension scoring
|   |-- README.md
|   `-- requirements.txt
|-- data/
|   `-- synthetic_msme_sample.csv
|-- ops/
|   |-- opa/
|   |   `-- underwriting.rego
|   `-- prometheus.yml
|-- public/
|   |-- favicon.svg
|   `-- icons.svg
|-- src/
|   |-- lib/
|   |   `-- nemesis-api.ts    # Frontend API client with fallback behavior
|   |-- App.tsx              # Main Nemesis prototype UI
|   |-- App.css              # Product dashboard styling
|   |-- index.css            # Global CSS reset and app base
|   `-- main.tsx             # React entrypoint
|-- index.html
|-- docker-compose.yml
|-- Dockerfile.frontend
|-- .env.example
|-- package.json
|-- package-lock.json
|-- tsconfig.json
|-- vite.config.ts
`-- README.md
```

## Technology Stack

Current prototype:

- React 19
- TypeScript
- Vite
- Lucide React icons
- Custom SVG-based radar and sparkline visualizations
- Responsive CSS for desktop and mobile layouts
- FastAPI backend
- deterministic MSME score engine
- mock AA, GST, UPI, EPFO, OCEN, and ULI connector payloads
- Guardian policy engine with HMAC audit signing
- synthetic MSME data sample
- Docker Compose stack for backend, frontend, OPA, Qdrant, Chroma, MinIO, Prometheus, Grafana, and Jaeger

Target production stack:

- Frontend: React / Next.js
- Backend: FastAPI or Django REST
- Data processing: Python, pandas, Polars
- ML scoring: XGBoost, TabTransformer, scikit-learn
- Explainability: SHAP-style reason-code layer
- Federated learning: Flower or PySyft
- Security: HMAC audit signing, consent policy layer, injection scanning
- Integrations: AA, GSTN, NPCI UPI, EPFO, OCEN, ULI, IDBI LOS/LMS

## Run Locally

Install dependencies:

```powershell
npm install
```

Start the frontend:

```powershell
npm run dev
```

Open the Vite URL shown in the terminal. The default is usually:

```text
http://localhost:5173
```

Start the backend in a second terminal:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The frontend automatically uses `http://127.0.0.1:8000` when the backend is running. If the backend is off, the UI falls back to static demo data.

## Full Integrated Demo Stack

Copy environment placeholders:

```powershell
Copy-Item .env.example .env
```

Start the full stack:

```powershell
npm run compose:up
```

Services:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8000/docs` |
| OPA | `http://localhost:8181` |
| Qdrant | `http://localhost:6333` |
| Chroma | `http://localhost:8001` |
| MinIO API | `http://localhost:9000` |
| MinIO Console | `http://localhost:9001` |
| Prometheus | `http://localhost:9090` |
| Grafana | `http://localhost:3001` |
| Jaeger | `http://localhost:16686` |

Stop the stack:

```powershell
npm run compose:down
```

## Build

```powershell
npm run build
```

## Lint

```powershell
npm run lint
```

## Backend Validation

```powershell
python -m compileall backend
```

## Hackathon Slide Mapping

Use this mapping for the IDBI prototype submission deck.

| Slide | Recommended Content |
| --- | --- |
| 1 | Team details, project name, problem statement |
| 2 | Brief idea and one-line pitch |
| 3 | Opportunity, differentiation, and USP |
| 4 | Feature list and product modules |
| 5 | End-to-end process flow |
| 6 | UI wireframes or screenshots |
| 7 | Architecture diagram |
| 8 | Technologies used |
| 9 | Estimated implementation cost |
| 10 | Prototype screenshots |
| 11 | Performance targets and benchmarking |
| 12 | Future development roadmap |
| 13 | GitHub, demo video, and product links |
| 14 | Security, compliance, and audit appendix |
| 15 | Closing / thank-you slide |

## Implementation Roadmap

| Phase | Deliverable |
| --- | --- |
| Week 1 | Synthetic MSME dataset, source schemas, consent-flow stub |
| Week 2 | Feature pipeline for GST, UPI, EPFO, and bank-statement signals |
| Week 3 | Baseline scoring model and six-dimension health-card output |
| Week 4 | Explainability layer, reason-code generation, and stress tests |
| Week 5 | Guardian policy engine, audit signing, and attack-simulation checks |
| Week 6 | IDBI sandbox integration, demo polish, deck, and video |

## Expected Impact

| Metric | Target |
| --- | --- |
| Indicative score time | Under 90 seconds |
| Full underwriting package | Under 24 hours after complete data availability |
| Reason-code coverage | 100% of generated decisions |
| Thin-file MSME support | Score using alternate data when bureau depth is low |
| Privacy posture | Federated-learning-ready, without raw cross-bank data pooling |

## GitHub

Repository:

```text
https://github.com/martian3062/Nemesis_IDBI_hackathon
```

## Status

This repository currently contains a polished frontend prototype plus a runnable FastAPI backend with mock connectors, deterministic scoring, reason codes, Guardian audit signing, architecture metadata, and federated-learning status. Real AA/GSTN/NPCI/EPFO production credentials, model training on institution data, and IDBI sandbox wiring remain future integration work.
