from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class MSMERecord:
    id: str
    name: str
    sector: str
    location: str
    loan_request: str
    gst_filing_timeliness: float
    gst_bank_reconciliation: float
    upi_monthly_inflow_lakh: float
    upi_volatility: float
    bank_avg_balance_lakh: float
    bank_negative_days: int
    epfo_employee_count: int
    epfo_continuity: float
    emi_delay_count_180d: int
    cheque_bounce_count_180d: int
    top_buyer_share: float
    revenue_growth_pct: float
    dso_days: int
    dpo_days: int
    inventory_cycle_days: int
    statement_months: int
    cashflow: tuple[int, ...]


MSME_DATASET: dict[str, MSMERecord] = {
    "suryam": MSMERecord(
        id="suryam",
        name="Suryam Precision Tools",
        sector="Auto components",
        location="Ludhiana, PB",
        loan_request="INR 42L working-capital line",
        gst_filing_timeliness=0.97,
        gst_bank_reconciliation=0.94,
        upi_monthly_inflow_lakh=36.8,
        upi_volatility=0.18,
        bank_avg_balance_lakh=11.6,
        bank_negative_days=1,
        epfo_employee_count=23,
        epfo_continuity=0.92,
        emi_delay_count_180d=0,
        cheque_bounce_count_180d=0,
        top_buyer_share=0.43,
        revenue_growth_pct=16.0,
        dso_days=41,
        dpo_days=33,
        inventory_cycle_days=28,
        statement_months=14,
        cashflow=(45, 51, 56, 61, 58, 67, 72, 78, 82, 85, 91, 96),
    ),
    "meghdoot": MSMERecord(
        id="meghdoot",
        name="Meghdoot Agro Foods",
        sector="Food processing",
        location="Nashik, MH",
        loan_request="INR 28L invoice-backed loan",
        gst_filing_timeliness=0.88,
        gst_bank_reconciliation=0.86,
        upi_monthly_inflow_lakh=18.4,
        upi_volatility=0.32,
        bank_avg_balance_lakh=5.2,
        bank_negative_days=5,
        epfo_employee_count=11,
        epfo_continuity=0.73,
        emi_delay_count_180d=1,
        cheque_bounce_count_180d=0,
        top_buyer_share=0.61,
        revenue_growth_pct=10.0,
        dso_days=56,
        dpo_days=39,
        inventory_cycle_days=46,
        statement_months=9,
        cashflow=(42, 48, 63, 74, 88, 81, 59, 53, 61, 66, 72, 78),
    ),
    "neelkanth": MSMERecord(
        id="neelkanth",
        name="Neelkanth Textiles",
        sector="Textile processing",
        location="Surat, GJ",
        loan_request="INR 35L machinery upgrade",
        gst_filing_timeliness=0.81,
        gst_bank_reconciliation=0.79,
        upi_monthly_inflow_lakh=24.1,
        upi_volatility=0.27,
        bank_avg_balance_lakh=7.8,
        bank_negative_days=3,
        epfo_employee_count=18,
        epfo_continuity=0.84,
        emi_delay_count_180d=1,
        cheque_bounce_count_180d=1,
        top_buyer_share=0.39,
        revenue_growth_pct=7.0,
        dso_days=49,
        dpo_days=37,
        inventory_cycle_days=52,
        statement_months=12,
        cashflow=(50, 53, 55, 54, 57, 62, 65, 63, 68, 70, 71, 75),
    ),
}


SCENARIO_EFFECTS = {
    "baseline": {
        "score_offset": 0,
        "data_quality_offset": 0.0,
        "label": "Baseline",
    },
    "thinData": {
        "score_offset": -7,
        "data_quality_offset": -0.18,
        "label": "Thin data",
    },
    "stress": {
        "score_offset": -13,
        "data_quality_offset": -0.08,
        "label": "Stress test",
    },
    "attack": {
        "score_offset": -21,
        "data_quality_offset": -0.12,
        "label": "Attack sim",
    },
}
