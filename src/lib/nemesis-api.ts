import type { SimulationOverrides } from '../types'

// Vite dev server talks to the local backend; any other host (e.g. the deployed
// FastAPI serving dist/) uses same-origin API calls.
export const NEMESIS_API_BASE =
  import.meta.env.VITE_NEMESIS_API_BASE ??
  (window.location.port === '5173' || window.location.port === '5174'
    ? 'http://127.0.0.1:8000'
    : window.location.origin)

async function getJson(path: string, params: Record<string, string> = {}) {
  const url = new URL(path, NEMESIS_API_BASE)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Nemesis API returned ${response.status} for ${path}`)
  }
  return response.json()
}

async function postJson(path: string, body: unknown) {
  const url = new URL(path, NEMESIS_API_BASE)
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Nemesis API returned ${response.status} for ${path}`)
  }
  return response.json()
}

export function fetchHealthCard(enterpriseId: string, scenario: string) {
  return getJson('/api/v1/health-card', { enterprise_id: enterpriseId, scenario })
}

export function fetchIntegrationSummary(enterpriseId: string, scenario: string) {
  return getJson('/api/v1/integrations/summary', { enterprise_id: enterpriseId, scenario })
}

export function fetchPortfolio(scenario: string) {
  return getJson('/api/v1/portfolio', { scenario })
}

export function postSimulate(enterpriseId: string, scenario: string, overrides: SimulationOverrides) {
  return postJson('/api/v1/simulate', { enterprise_id: enterpriseId, scenario, overrides })
}

export function postSwarmRun(enterpriseId: string, scenario: string) {
  return postJson('/api/v1/swarm/run', { enterprise_id: enterpriseId, scenario })
}

export function fetchMlScore(enterpriseId: string) {
  return getJson('/api/v1/ml/score', { enterprise_id: enterpriseId })
}

export function fetchMlValidation() {
  return getJson('/api/v1/ml/validation')
}

export function fetchModelCard() {
  return getJson('/api/v1/ml/model-card')
}

export function fetchMlPeers(enterpriseId: string) {
  return getJson('/api/v1/ml/peers', { enterprise_id: enterpriseId })
}

export function fetchSectorImage(sector: string) {
  return getJson('/api/v1/media/sector-image', { sector })
}

export function postChat(
  enterpriseId: string,
  scenario: string,
  message: string,
  history: { role: string; content: string }[],
) {
  return postJson('/api/v1/ai/chat', {
    enterprise_id: enterpriseId,
    scenario,
    message,
    history,
  })
}
