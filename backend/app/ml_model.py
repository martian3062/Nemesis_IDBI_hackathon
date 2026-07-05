"""Real ML credit model for the MSME Financial Health Card.

Trains, on a reproducible synthetic labeled dataset, two banker-credible models:
  * a logistic-regression scorecard (exact additive, coefficient-based reason codes)
  * a gradient-boosted model (HistGradientBoosting) for lift

and reports full credit-risk validation (AUROC, KS, Gini, calibration, gains,
PSI) plus a business-impact table. An optional Hugging Face tabular foundation
model (TabPFN, <200M params) is loaded lazily and used as a third opinion; if it
is unavailable the rest of the model layer keeps working.

The models train once at import time on CPU in well under a second.
"""

from __future__ import annotations

import math
import os
from dataclasses import asdict
from functools import lru_cache
from typing import Any

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.preprocessing import StandardScaler

from .data import MSMERecord

# Features fed to the model, in a fixed order. Higher raw value is not always
# "better"; the model learns direction. Labels are human-facing.
FEATURES: list[tuple[str, str]] = [
    ("gst_filing_timeliness", "GST filing timeliness"),
    ("gst_bank_reconciliation", "GST-bank reconciliation"),
    ("upi_monthly_inflow_lakh", "UPI monthly inflow"),
    ("upi_volatility", "UPI inflow volatility"),
    ("bank_avg_balance_lakh", "Average bank balance"),
    ("bank_negative_days", "Negative-balance days"),
    ("epfo_employee_count", "EPFO employee count"),
    ("epfo_continuity", "EPFO continuity"),
    ("emi_delay_count_180d", "EMI delays (180d)"),
    ("cheque_bounce_count_180d", "Cheque bounces (180d)"),
    ("top_buyer_share", "Buyer concentration"),
    ("revenue_growth_pct", "Revenue growth"),
    ("dso_days", "Receivable days (DSO)"),
    ("inventory_cycle_days", "Inventory cycle days"),
    ("statement_months", "Bank statement coverage"),
]
FEATURE_KEYS = [key for key, _ in FEATURES]
FEATURE_LABELS = {key: label for key, label in FEATURES}

# Latent risk weights (in standardized feature space) used only to synthesize
# default labels. Positive weight => higher value raises default probability.
_RISK_WEIGHTS = {
    "gst_filing_timeliness": -0.62,
    "gst_bank_reconciliation": -0.34,
    "upi_monthly_inflow_lakh": -0.30,
    "upi_volatility": 0.70,
    "bank_avg_balance_lakh": -0.42,
    "bank_negative_days": 0.30,
    "epfo_employee_count": -0.16,
    "epfo_continuity": -0.34,
    "emi_delay_count_180d": 0.50,
    "cheque_bounce_count_180d": 0.44,
    "top_buyer_share": 0.60,
    "revenue_growth_pct": -0.40,
    "dso_days": 0.34,
    "inventory_cycle_days": 0.20,
    "statement_months": -0.26,
}


def record_to_vector(record: MSMERecord) -> np.ndarray:
    raw = asdict(record)
    return np.array([float(raw[key]) for key in FEATURE_KEYS], dtype=float)


def _sample_population(n: int, seed: int) -> np.ndarray:
    """Draw a realistic MSME feature population."""
    rng = np.random.default_rng(seed)
    cols = {
        "gst_filing_timeliness": np.clip(rng.beta(6, 2, n), 0.3, 1.0),
        "gst_bank_reconciliation": np.clip(rng.beta(5, 2, n), 0.3, 1.0),
        "upi_monthly_inflow_lakh": np.clip(rng.gamma(3.0, 8.0, n), 1, 120),
        "upi_volatility": np.clip(rng.beta(2, 5, n), 0.05, 0.85),
        "bank_avg_balance_lakh": np.clip(rng.gamma(2.2, 3.4, n), 0.3, 40),
        "bank_negative_days": rng.poisson(3, n).astype(float),
        "epfo_employee_count": np.clip(rng.gamma(2.0, 8.0, n), 0, 120).round(),
        "epfo_continuity": np.clip(rng.beta(5, 2, n), 0.2, 1.0),
        "emi_delay_count_180d": rng.poisson(0.8, n).astype(float),
        "cheque_bounce_count_180d": rng.poisson(0.5, n).astype(float),
        "top_buyer_share": np.clip(rng.beta(2.4, 3.0, n), 0.1, 0.95),
        "revenue_growth_pct": np.clip(rng.normal(9, 8, n), -20, 45),
        "dso_days": np.clip(rng.normal(48, 15, n), 10, 120),
        "inventory_cycle_days": np.clip(rng.normal(42, 16, n), 5, 120),
        "statement_months": np.clip(rng.integers(4, 19, n), 3, 24).astype(float),
    }
    return np.column_stack([cols[key] for key in FEATURE_KEYS])


def _synth_labels(x: np.ndarray, seed: int) -> np.ndarray:
    """Generate default labels from a latent logit plus noise (~14% base rate)."""
    rng = np.random.default_rng(seed + 1)
    # Standardize each column so weights act in a comparable space.
    mean = x.mean(axis=0)
    std = x.std(axis=0) + 1e-9
    z = (x - mean) / std
    weights = np.array([_RISK_WEIGHTS[key] for key in FEATURE_KEYS])
    # Signal scale + noise land AUROC in the realistic 0.80-0.84 range with a
    # ~15% base default rate and non-saturated probabilities.
    logit = -2.05 + (z * weights).sum(axis=1) * 0.92
    logit += rng.normal(0, 0.75, size=x.shape[0])
    prob = 1 / (1 + np.exp(-logit))
    return (rng.random(x.shape[0]) < prob).astype(int)


def _ks_stat(y_true: np.ndarray, scores: np.ndarray) -> float:
    fpr, tpr, _ = roc_curve(y_true, scores)
    return float(np.max(tpr - fpr))


def _psi(expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
    quantiles = np.quantile(expected, np.linspace(0, 1, bins + 1))
    quantiles[0], quantiles[-1] = -np.inf, np.inf
    exp_pct = np.histogram(expected, quantiles)[0] / len(expected)
    act_pct = np.histogram(actual, quantiles)[0] / len(actual)
    exp_pct = np.clip(exp_pct, 1e-4, None)
    act_pct = np.clip(act_pct, 1e-4, None)
    return float(np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct)))


def pd_to_score(pd_value: float) -> int:
    """Map probability of default to a 300-900 style credit score."""
    pd_value = min(max(pd_value, 1e-4), 1 - 1e-4)
    odds = (1 - pd_value) / pd_value
    score = 600 + 40 / math.log(2) * math.log(odds)
    return int(max(300, min(900, round(score))))


def score_band(pd_value: float) -> str:
    if pd_value < 0.08:
        return "A · Prime"
    if pd_value < 0.16:
        return "B · Near-prime"
    if pd_value < 0.30:
        return "C · Watch"
    return "D · Sub-prime"


def decision_for_pd(pd_value: float) -> str:
    if pd_value < 0.12:
        return "Indicative approve"
    if pd_value < 0.28:
        return "Review with mitigants"
    return "Manual review required"


class CreditModel:
    def __init__(self, seed: int = 7, n: int = 2600):
        x = _sample_population(n, seed)
        y = _synth_labels(x, seed)
        # guard against a degenerate all-one-class draw
        if y.sum() == 0 or y.sum() == len(y):
            y[: max(1, len(y) // 8)] = 1

        split = int(0.75 * n)
        self.x_train, self.x_test = x[:split], x[split:]
        self.y_train, self.y_test = y[:split], y[split:]

        self.scaler = StandardScaler().fit(self.x_train)
        xs_train = self.scaler.transform(self.x_train)
        xs_test = self.scaler.transform(self.x_test)

        self.logistic = LogisticRegression(max_iter=2000, C=1.0)
        self.logistic.fit(xs_train, self.y_train)

        self.gbm = HistGradientBoostingClassifier(
            max_depth=3, learning_rate=0.08, max_iter=220, l2_regularization=1.0, random_state=seed
        )
        self.gbm.fit(self.x_train, self.y_train)

        self.base_rate = float(y.mean())
        self._compute_validation(xs_test, xs_train)

    # -- attribution -------------------------------------------------------
    def _standardize(self, vector: np.ndarray) -> np.ndarray:
        return self.scaler.transform(vector.reshape(1, -1))[0]

    def logistic_pd(self, vector: np.ndarray) -> float:
        return float(self.logistic.predict_proba(self._standardize(vector).reshape(1, -1))[0, 1])

    def gbm_pd(self, vector: np.ndarray) -> float:
        return float(self.gbm.predict_proba(vector.reshape(1, -1))[0, 1])

    def attributions(self, vector: np.ndarray) -> list[dict]:
        """Exact additive logistic contributions: coef * standardized value."""
        z = self._standardize(vector)
        contributions = self.logistic.coef_[0] * z
        rows = []
        for key, contrib in zip(FEATURE_KEYS, contributions):
            rows.append(
                {
                    "feature": FEATURE_LABELS[key],
                    # negative contribution to logit => lowers default risk => good
                    "points": round(float(-contrib) * 40, 1),
                    "direction": "protective" if contrib < 0 else "risk",
                }
            )
        rows.sort(key=lambda r: abs(r["points"]), reverse=True)
        return rows

    # -- validation --------------------------------------------------------
    def _compute_validation(self, xs_test: np.ndarray, xs_train: np.ndarray) -> None:
        p_test = self.logistic.predict_proba(xs_test)[:, 1]
        p_train = self.logistic.predict_proba(xs_train)[:, 1]
        gbm_p_test = self.gbm.predict_proba(self.x_test)[:, 1]

        auc = float(roc_auc_score(self.y_test, p_test))
        gbm_auc = float(roc_auc_score(self.y_test, gbm_p_test))
        fpr, tpr, _ = roc_curve(self.y_test, p_test)
        # thin the ROC curve for the UI
        idx = np.linspace(0, len(fpr) - 1, min(len(fpr), 40)).astype(int)
        roc_points = [{"fpr": round(float(fpr[i]), 3), "tpr": round(float(tpr[i]), 3)} for i in idx]

        # calibration by predicted-PD decile
        order = np.argsort(p_test)
        calib = []
        for chunk in np.array_split(order, 10):
            calib.append(
                {
                    "predicted": round(float(p_test[chunk].mean()), 3),
                    "observed": round(float(self.y_test[chunk].mean()), 3),
                }
            )

        # gains / lift by score decile (best score first)
        score_desc = np.argsort(-(1 - p_test))  # low PD first == best
        total_bads = max(1, int(self.y_test.sum()))
        gains = []
        cum_bad = 0
        for d, chunk in enumerate(np.array_split(score_desc[::-1], 10), start=1):
            cum_bad += int(self.y_test[chunk].sum())
            gains.append({"decile": d, "capture": round(cum_bad / total_bads, 3)})

        self.validation_data = {
            "auroc": round(auc, 3),
            "gini": round(2 * auc - 1, 3),
            "ks": round(_ks_stat(self.y_test, p_test), 3),
            "gbm_auroc": round(gbm_auc, 3),
            "gbm_gini": round(2 * gbm_auc - 1, 3),
            "psi_train_test": round(_psi(p_train, p_test), 4),
            "base_default_rate": round(self.base_rate, 3),
            "n_train": int(len(self.y_train)),
            "n_test": int(len(self.y_test)),
            "roc_curve": roc_points,
            "calibration": calib,
            "gains": gains,
        }
        self._p_test = p_test
        self._score_test = np.array([pd_to_score(p) for p in p_test])

    def business_impact(self, cutoff_pd: float) -> dict:
        approved = self._p_test <= cutoff_pd
        approval_rate = float(approved.mean())
        approved_bad_rate = float(self.y_test[approved].mean()) if approved.any() else 0.0
        # crude "traditional underwriting" baseline: thick-file only proxy via
        # high statement coverage feature (last column) + low volatility
        stmt = self.x_test[:, FEATURE_KEYS.index("statement_months")]
        vol = self.x_test[:, FEATURE_KEYS.index("upi_volatility")]
        traditional = (stmt >= 12) & (vol <= 0.3)
        trad_rate = float(traditional.mean())
        return {
            "cutoff_pd": round(cutoff_pd, 3),
            "approval_rate": round(approval_rate, 3),
            "approved_bad_rate": round(approved_bad_rate, 3),
            "traditional_approval_rate": round(trad_rate, 3),
            "uplift_pct_points": round((approval_rate - trad_rate) * 100, 1),
        }

    def validation(self) -> dict:
        data = dict(self.validation_data)
        data["business_impact"] = [self.business_impact(c) for c in (0.10, 0.15, 0.20, 0.28)]
        return data

    def model_card(self) -> dict:
        return {
            "model_name": "Nemesis MSME PD Scorecard",
            "version": "1.0.0",
            "champion": "Logistic-regression scorecard (interpretable, additive)",
            "challenger": "HistGradientBoosting (non-linear lift)",
            "foundation_model": tabpfn_status(),
            "training_data": "Reproducible synthetic MSME population (seeded)",
            "target": "12-month probability of default (PD)",
            "features": [FEATURE_LABELS[k] for k in FEATURE_KEYS],
            "intended_use": "Indicative MSME creditworthiness triage from alternate data",
            "limitations": "Synthetic training data; production use requires bureau-labelled outcomes and fair-lending review.",
            "metrics": {
                "auroc": self.validation_data["auroc"],
                "ks": self.validation_data["ks"],
                "gini": self.validation_data["gini"],
            },
        }


@lru_cache(maxsize=1)
def get_model() -> CreditModel:
    return CreditModel()


# --- Hugging Face tabular foundation model (TabPFN, <200M, token-gated) ------
_TABPFN: Any = None
_TABPFN_TRIED = False


def _load_tabpfn():
    global _TABPFN, _TABPFN_TRIED
    if _TABPFN_TRIED:
        return _TABPFN
    _TABPFN_TRIED = True
    if not os.getenv("TABPFN_TOKEN"):
        _TABPFN = None
        return None
    try:
        from tabpfn import TabPFNClassifier  # type: ignore

        model = get_model()
        clf = TabPFNClassifier(device="cpu")
        # TabPFN is a prior-fitted foundation model: fit only stores the context.
        # Keep the context small so CPU in-context inference stays fast.
        clf.fit(model.x_train[:200], model.y_train[:200])
        _TABPFN = clf
    except Exception:
        _TABPFN = None
    return _TABPFN


def tabpfn_pd(vector: np.ndarray) -> float | None:
    clf = _load_tabpfn()
    if clf is None:
        return None
    try:
        return float(clf.predict_proba(vector.reshape(1, -1))[0, 1])
    except Exception:
        return None


def tabpfn_status() -> str:
    return (
        "TabPFN (HF tabular foundation model) active"
        if _load_tabpfn() is not None
        else "TabPFN not loaded (sklearn ensemble active)"
    )


@lru_cache(maxsize=64)
def score_enterprise(record: MSMERecord) -> dict:
    model = get_model()
    vector = record_to_vector(record)
    logistic = model.logistic_pd(vector)
    gbm = model.gbm_pd(vector)
    tabpfn = tabpfn_pd(vector)
    parts = [logistic, gbm] + ([tabpfn] if tabpfn is not None else [])
    ensemble = float(np.mean(parts))
    models = {
        "logistic_scorecard": round(logistic, 4),
        "gradient_boosting": round(gbm, 4),
    }
    if tabpfn is not None:
        models["tabpfn_foundation"] = round(tabpfn, 4)
    return {
        "enterprise_id": record.id,
        "name": record.name,
        "pd": round(ensemble, 4),
        "credit_score": pd_to_score(ensemble),
        "band": score_band(ensemble),
        "decision": decision_for_pd(ensemble),
        "models": models,
        "attributions": model.attributions(vector),
    }
