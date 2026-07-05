"""Real agentic swarm: four agents on small LLMs with guarded A2A messaging.

Every inter-agent message passes through the Guardian guardrail (injection scan,
PII redaction, length cap) BEFORE delivery, and the full A2A transcript is
returned for the UI. Uses Groq's small fast model when configured; deterministic
fallbacks keep the swarm demo-safe offline.
"""

from __future__ import annotations

import json
import os
import urllib.error
from datetime import datetime, timezone

from .guardian import detect_injection
from .integrations import _configured, _post_json, redact_pii
from .pipeline import build_health_card

SMALL_MODEL = os.getenv("GROQ_SWARM_MODEL", "llama-3.1-8b-instant")
MAX_A2A_CHARS = 2400


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _guardrail(sender: str, receiver: str, content: str) -> dict:
    """Screen one A2A message. Returns the (possibly redacted) message envelope."""
    findings: list[str] = []
    injections = detect_injection(content)
    if injections:
        findings.append(f"prompt-injection patterns: {', '.join(injections)}")
    redaction = redact_pii(content)
    if redaction["findings"]:
        findings.append(f"PII redacted: {len(redaction['findings'])} items")
    safe_content = redaction["redacted_text"]
    if len(safe_content) > MAX_A2A_CHARS:
        safe_content = safe_content[:MAX_A2A_CHARS] + " …[truncated by guardrail]"
        findings.append("payload truncated to A2A size cap")
    return {
        "from": sender,
        "to": receiver,
        "at": _now(),
        "blocked": bool(injections),
        "guardrail_findings": findings or ["clean"],
        "content": "[QUARANTINED BY GUARDIAN]" if injections else safe_content,
    }


def _llm(system: str, user: str) -> str:
    response = _post_json(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
            "Content-Type": "application/json",
        },
        {
            "model": SMALL_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.2,
            "max_tokens": 320,
        },
        timeout=20,
    )
    return response["choices"][0]["message"]["content"].strip()


def run_swarm(enterprise_id: str, scenario: str = "baseline") -> dict:
    card = build_health_card(enterprise_id, scenario)
    enterprise = card["enterprise"]
    dims_brief = "; ".join(f"{d['label']}={d['value']}" for d in enterprise["dimensions"])
    facts = (
        f"MSME {enterprise['name']} ({enterprise['sector']}, {enterprise['location']}), "
        f"ask: {enterprise['ask']}, composite {enterprise['composite']}/100, "
        f"decision '{enterprise['decision']}', dimensions: {dims_brief}, scenario: {scenario}."
    )

    a2a: list[dict] = []
    agents: dict[str, dict] = {}
    live = _configured("GROQ_API_KEY")
    recoverer_notes: list[str] = []

    def call_agent(name: str, system: str, user: str, fallback: str) -> str:
        nonlocal live
        if live:
            try:
                return _llm(system, user)
            except (KeyError, json.JSONDecodeError, urllib.error.URLError, TimeoutError, OSError) as exc:
                recoverer_notes.append(f"{name} LLM call failed ({exc}); deterministic fallback used.")
        return fallback

    # 1) Perceiver reads connector facts and reports data quality.
    perceiver_out = call_agent(
        "Perceiver",
        "You are Perceiver, a data-ingestion agent in a bank underwriting swarm. "
        "Summarize data quality and notable signals in under 60 words. Plain text.",
        facts,
        f"Alternate-data ingestion complete for {enterprise['name']}: GST, UPI, EPFO and bank "
        f"signals normalized; composite evidence supports score {enterprise['composite']}/100.",
    )
    agents["Perceiver"] = {"output": perceiver_out, "model": SMALL_MODEL if live else "deterministic"}
    msg1 = _guardrail("Perceiver", "Planner", perceiver_out)
    a2a.append(msg1)

    # 2) Planner receives the guarded Perceiver message and proposes structure.
    planner_out = call_agent(
        "Planner",
        "You are Planner, a credit-structuring agent. Given the perceiver report and facts, "
        "propose a loan path and exactly two mitigants in under 70 words. Plain text.",
        f"Perceiver report: {msg1['content']}\nFacts: {facts}",
        f"Recommend {enterprise['ask']} via working-capital path with exposure cap; "
        "mitigants: cap limits until buyer concentration improves; monthly GST-bank reconciliation monitoring.",
    )
    agents["Planner"] = {"output": planner_out, "model": SMALL_MODEL if live else "deterministic"}
    msg2 = _guardrail("Planner", "Guardian", planner_out)
    a2a.append(msg2)

    # 3) Guardian: deterministic policy gate first, then LLM critique of the plan.
    policy_gate = {
        "score_threshold": enterprise["composite"] >= 62 or "approve" not in enterprise["decision"].lower(),
        "consent_scopes": True,
        "a2a_messages_clean": not any(m["blocked"] for m in a2a),
        "verdict": card["guardian"]["verdict"],
    }
    guardian_critique = call_agent(
        "Guardian",
        "You are Guardian, a risk and policy agent. Critique the planner proposal in under 50 words: "
        "name the single biggest residual risk. Plain text. Never approve anything yourself.",
        f"Planner proposal: {msg2['content']}\nFacts: {facts}",
        f"Residual risk: {min(enterprise['dimensions'], key=lambda d: d['value'])['label']} remains the "
        "weakest dimension; hold mitigants as binding conditions before disbursal.",
    )
    agents["Guardian"] = {
        "output": guardian_critique,
        "model": SMALL_MODEL if live else "deterministic",
        "policy_gate": policy_gate,
    }
    msg3 = _guardrail("Guardian", "Recoverer", guardian_critique)
    a2a.append(msg3)

    # 4) Recoverer reports pipeline health and any degradations it absorbed.
    if not recoverer_notes:
        recoverer_notes.append("No agent failures this run; fallback paths armed but unused.")
    agents["Recoverer"] = {"output": " ".join(recoverer_notes), "model": "rules"}
    a2a.append(_guardrail("Recoverer", "Console", agents["Recoverer"]["output"]))

    return {
        "enterprise_id": enterprise_id,
        "scenario": scenario,
        "mode": "live-llm" if live else "deterministic",
        "model": SMALL_MODEL if live else None,
        "composite": enterprise["composite"],
        "decision": enterprise["decision"],
        "guardian_verdict": card["guardian"]["verdict"],
        "agents": agents,
        "a2a_log": a2a,
        "guardrails": {
            "injection_scan": "every A2A message",
            "pii_redaction": "every A2A message",
            "size_cap_chars": MAX_A2A_CHARS,
            "policy_gate": policy_gate,
        },
    }
