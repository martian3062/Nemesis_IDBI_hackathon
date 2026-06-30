from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone
from hashlib import sha256

from .data import MSMERecord


def _token(prefix: str, enterprise_id: str) -> str:
    digest = sha256(f"{prefix}:{enterprise_id}:nemesis-demo".encode()).hexdigest()
    return f"{prefix}_{digest[:16]}"


def account_aggregator_consent(record: MSMERecord, scenario: str) -> dict:
    scopes = ["gst", "bank_statement", "upi", "epfo"]
    if scenario == "thinData":
        scopes.remove("epfo")
    return {
        "consent_id": _token("aa", record.id),
        "status": "active",
        "purpose": "MSME creditworthiness assessment",
        "scopes": scopes,
        "expires_at": "2026-07-30T23:59:59Z",
    }


def gst_connector(record: MSMERecord, scenario: str) -> dict:
    available = scenario != "attack"
    return {
        "source": "GSTN mock",
        "available": available,
        "filing_timeliness": record.gst_filing_timeliness if available else None,
        "bank_reconciliation": record.gst_bank_reconciliation if available else None,
        "last_pull_at": datetime.now(timezone.utc).isoformat(),
    }


def upi_connector(record: MSMERecord) -> dict:
    return {
        "source": "NPCI UPI mock",
        "available": True,
        "monthly_inflow_lakh": record.upi_monthly_inflow_lakh,
        "volatility": record.upi_volatility,
        "settlement_depth": f"{round(record.upi_monthly_inflow_lakh * 500)} txns",
    }


def epfo_connector(record: MSMERecord, scenario: str) -> dict:
    available = scenario != "thinData"
    return {
        "source": "EPFO mock",
        "available": available,
        "employee_count": record.epfo_employee_count if available else None,
        "continuity": record.epfo_continuity if available else None,
    }


def bank_statement_connector(record: MSMERecord) -> dict:
    return {
        "source": "Bank statement parser",
        "available": True,
        "statement_months": record.statement_months,
        "avg_balance_lakh": record.bank_avg_balance_lakh,
        "negative_days": record.bank_negative_days,
    }


def ocen_payload(record: MSMERecord, score: int, decision: str) -> dict:
    return {
        "network": "OCEN-ready loan payload",
        "loan_product": "working_capital" if "working" in record.loan_request.lower() else "term_or_invoice",
        "requested_amount": record.loan_request,
        "indicative_score": score,
        "recommended_action": decision,
        "los_handoff_id": _token("los", record.id),
    }


def uli_payload(record: MSMERecord) -> dict:
    return {
        "network": "ULI-ready data pull stub",
        "borrower_ref": _token("uli", record.id),
        "data_domains": ["identity", "gst", "banking", "cashflow", "employment"],
        "status": "sandbox_stub",
    }


def collect_connector_snapshot(record: MSMERecord, scenario: str, score: int, decision: str) -> dict:
    return {
        "raw_profile": asdict(record),
        "account_aggregator": account_aggregator_consent(record, scenario),
        "gst": gst_connector(record, scenario),
        "upi": upi_connector(record),
        "epfo": epfo_connector(record, scenario),
        "bank_statement": bank_statement_connector(record),
        "ocen": ocen_payload(record, score, decision),
        "uli": uli_payload(record),
    }
