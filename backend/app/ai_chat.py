from __future__ import annotations

import json
import os
import urllib.error

from .guardian import detect_injection
from .integrations import _configured, _post_json, redact_pii
from .pipeline import build_health_card


def _deterministic_reply(message: str, card: dict) -> dict:
    enterprise = card["enterprise"]
    dimensions = enterprise["dimensions"]
    reasons = enterprise["reasons"]
    lowered = message.lower()

    sorted_dims = sorted(dimensions, key=lambda item: item["value"])
    weakest = sorted_dims[0]
    strongest = sorted_dims[-1]
    top_negative = next((reason for reason in reasons if reason["impact"] < 0), None)
    top_positive = next((reason for reason in reasons if reason["impact"] > 0), None)

    def dim(label: str) -> dict | None:
        return next((item for item in dimensions if item["label"] == label), None)

    if any(word in lowered for word in ("improve", "advice", "better", "increase")):
        reply = (
            f"To improve, {enterprise['name']} should focus on {weakest['label'].lower()} "
            f"(currently {weakest['value']}/100). "
            + (top_negative["text"] + " " if top_negative else "")
            + "This lever moves the composite score fastest; the What-If Lab shows the exact impact."
        )
    elif any(word in lowered for word in ("risk", "concern", "worst", "weak")):
        reply = (
            f"The biggest risk is {weakest['label'].lower()} at {weakest['value']}/100. "
            f"{weakest['signal']}."
            + (f" Reason code: {top_negative['factor']} ({top_negative['impact']})." if top_negative else "")
        )
    elif any(word in lowered for word in ("cashflow", "liquidity", "upi", "inflow")):
        liquidity = dim("Cashflow Liquidity")
        reply = (
            f"Cashflow liquidity scores {liquidity['value']}/100. {liquidity['signal']}."
            if liquidity
            else "Cashflow details are on the Health Card tab."
        )
    elif any(word in lowered for word in ("gst", "compliance", "filing")):
        compliance = dim("Compliance Health")
        reply = (
            f"Compliance health scores {compliance['value']}/100. {compliance['signal']}."
            if compliance
            else "Compliance details are on the Health Card tab."
        )
    elif any(word in lowered for word in ("buyer", "concentration", "customer")):
        concentration = dim("Concentration Risk")
        reply = (
            f"Concentration risk scores {concentration['value']}/100. {concentration['signal']}. "
            "Diversifying the buyer base is the main mitigant."
            if concentration
            else "Concentration details are on the Health Card tab."
        )
    elif any(word in lowered for word in ("decision", "approve", "loan", "score", "why")):
        reply = (
            f"The indicative decision for {enterprise['name']} is \"{enterprise['decision']}\" with a "
            f"composite score of {enterprise['composite']}/100 for the ask: {enterprise['ask']}. "
            + (
                f"Top driver: {top_positive['factor']} (+{top_positive['impact']})."
                if top_positive
                else ""
            )
            + " Guardian policy checks apply before any final approval."
        )
    else:
        reply = (
            f"{enterprise['name']} scores {enterprise['composite']}/100 -> \"{enterprise['decision']}\". "
            f"Strongest dimension: {strongest['label']} ({strongest['value']}). "
            f"Weakest: {weakest['label']} ({weakest['value']})."
        )

    return {
        "reply": reply,
        "mode": "deterministic",
        "blocked": False,
        "citations": [
            {"dimension": weakest["label"], "value": weakest["value"]},
            {"dimension": strongest["label"], "value": strongest["value"]},
        ],
    }


def chat_with_credit_officer(
    enterprise_id: str,
    scenario: str,
    message: str,
    history: list[dict] | None = None,
) -> dict:
    injection_hits = detect_injection(message)
    if injection_hits:
        return {
            "reply": (
                "Guardian blocked this request. Unsafe override instructions are quarantined "
                "and logged with a signed audit record."
            ),
            "mode": "guardian",
            "blocked": True,
            "patterns": injection_hits,
            "citations": [],
        }

    card = build_health_card(enterprise_id, scenario)

    if _configured("GROQ_API_KEY"):
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        safe_context = redact_pii(json.dumps(card["enterprise"], ensure_ascii=True))["redacted_text"]
        system_prompt = (
            "You are the Nemesis AI credit officer for IDBI Bank. Answer questions about one MSME "
            "using only this redacted underwriting context: "
            f"{safe_context}. "
            "Be concise (under 120 words), cite dimension scores, and never promise final approval; "
            "all decisions pass Guardian policy checks."
        )
        messages = [{"role": "system", "content": system_prompt}]
        for turn in (history or [])[-6:]:
            if turn.get("role") in {"user", "assistant"} and turn.get("content"):
                messages.append({"role": turn["role"], "content": str(turn["content"])[:2000]})
        messages.append({"role": "user", "content": message[:2000]})
        try:
            response = _post_json(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
                    "Content-Type": "application/json",
                },
                {"model": model, "messages": messages, "temperature": 0.3},
            )
            reply = response["choices"][0]["message"]["content"]
            reply_injections = detect_injection(reply)
            if not reply_injections:
                return {"reply": reply, "mode": "groq", "blocked": False, "citations": []}
        except (KeyError, json.JSONDecodeError, urllib.error.URLError, TimeoutError, OSError):
            pass

    return _deterministic_reply(message, card)
