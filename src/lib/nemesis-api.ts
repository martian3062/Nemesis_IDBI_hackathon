export const NEMESIS_API_BASE =
  import.meta.env.VITE_NEMESIS_API_BASE ?? 'http://127.0.0.1:8000'

export async function fetchHealthCard(enterpriseId: string, scenario: string) {
  const url = new URL('/api/v1/health-card', NEMESIS_API_BASE)
  url.searchParams.set('enterprise_id', enterpriseId)
  url.searchParams.set('scenario', scenario)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Nemesis API returned ${response.status}`)
  }
  return response.json()
}

export async function fetchIntegrationSummary(enterpriseId: string, scenario: string) {
  const url = new URL('/api/v1/integrations/summary', NEMESIS_API_BASE)
  url.searchParams.set('enterprise_id', enterpriseId)
  url.searchParams.set('scenario', scenario)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Nemesis integrations API returned ${response.status}`)
  }
  return response.json()
}
