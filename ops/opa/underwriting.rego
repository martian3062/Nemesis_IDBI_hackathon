package nemesis.underwriting

default allow := false

required_scopes := {"gst", "bank_statement", "upi"}

allow if {
  input.score >= 62
  input.verdict != "BLOCKED"
  required_scopes - {scope | scope := input.consent_scopes[_]} == set()
}

deny[msg] if {
  input.score < 62
  msg := "score below auto-decision threshold"
}

deny[msg] if {
  input.verdict == "BLOCKED"
  msg := "guardian blocked decision path"
}

deny[msg] if {
  missing := required_scopes - {scope | scope := input.consent_scopes[_]}
  count(missing) > 0
  msg := sprintf("missing consent scopes: %v", [missing])
}
