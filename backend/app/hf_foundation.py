"""Hugging Face foundation model integration (<200M params).

Uses sentence-transformers/all-MiniLM-L6-v2 (~22M) to embed a natural-language
profile of each MSME and find its nearest semantic peers. This gives underwriters
a "compared to similar businesses" view and a peer-consistency signal.

Fully fallback-safe: if the model or sentence-transformers is unavailable, peer
similarity is computed in standardized feature space with numpy instead, so the
endpoint always returns useful results.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import numpy as np

from .data import MSME_DATASET, MSMERecord
from .ml_model import FEATURE_KEYS, get_model, record_to_vector

HF_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"

_MODEL: Any = None
_MODEL_TRIED = False


def profile_text(record: MSMERecord) -> str:
    return (
        f"{record.sector} MSME in {record.location}. "
        f"{record.epfo_employee_count} employees. "
        f"GST filing timeliness {round(record.gst_filing_timeliness * 100)}%. "
        f"UPI inflow {record.upi_monthly_inflow_lakh:.1f} lakh per month with "
        f"{round(record.upi_volatility * 100)}% volatility. "
        f"Top buyer {round(record.top_buyer_share * 100)}% of revenue. "
        f"Revenue growth {record.revenue_growth_pct:.0f}%. "
        f"Receivable days {record.dso_days}. "
        f"{record.emi_delay_count_180d} EMI delays in 180 days."
    )


def _load_model():
    global _MODEL, _MODEL_TRIED
    if _MODEL_TRIED:
        return _MODEL
    _MODEL_TRIED = True
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore

        _MODEL = SentenceTransformer(HF_MODEL_ID, device="cpu")
    except Exception:
        _MODEL = None
    return _MODEL


def status() -> str:
    return (
        f"{HF_MODEL_ID} (22M, Hugging Face) active"
        if _load_model() is not None
        else "all-MiniLM-L6-v2 unavailable — feature-space peer fallback"
    )


@lru_cache(maxsize=1)
def _embeddings() -> tuple[list[str], np.ndarray, str]:
    """Return (ids, embedding matrix, mode) for every MSME in the dataset."""
    ids = list(MSME_DATASET.keys())
    model = _load_model()
    if model is not None:
        texts = [profile_text(MSME_DATASET[i]) for i in ids]
        vecs = np.asarray(model.encode(texts, normalize_embeddings=True), dtype=float)
        return ids, vecs, "semantic"
    # fallback: standardized feature vectors
    scaler = get_model().scaler
    raw = np.array([record_to_vector(MSME_DATASET[i]) for i in ids], dtype=float)
    z = scaler.transform(raw)
    z = z / (np.linalg.norm(z, axis=1, keepdims=True) + 1e-9)
    return ids, z, "feature-space"


def nearest_peers(enterprise_id: str, k: int = 3) -> dict:
    from .ml_model import score_enterprise

    if enterprise_id not in MSME_DATASET:
        enterprise_id = "suryam"
    ids, vecs, mode = _embeddings()
    idx = ids.index(enterprise_id)
    sims = vecs @ vecs[idx]
    order = np.argsort(-sims)

    peers = []
    self_pd = score_enterprise(MSME_DATASET[enterprise_id])["pd"]
    for j in order:
        if ids[j] == enterprise_id:
            continue
        record = MSME_DATASET[ids[j]]
        peer_pd = score_enterprise(record)["pd"]
        peers.append(
            {
                "id": record.id,
                "name": record.name,
                "sector": record.sector,
                "similarity": round(float(sims[j]), 3),
                "pd": peer_pd,
            }
        )
        if len(peers) >= k:
            break

    peer_avg_pd = round(float(np.mean([p["pd"] for p in peers])), 4) if peers else self_pd
    return {
        "enterprise_id": enterprise_id,
        "model": HF_MODEL_ID,
        "mode": mode,
        "self_pd": self_pd,
        "peer_avg_pd": peer_avg_pd,
        "consistency": "in line with peers" if abs(self_pd - peer_avg_pd) < 0.08 else "diverges from peers",
        "peers": peers,
    }


# feature count reused so callers can display model metadata
FEATURE_COUNT = len(FEATURE_KEYS)
