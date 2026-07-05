import type { Scenario, Tone } from '../types'

export function scenarioOffset(scenario: Scenario) {
  if (scenario === 'thinData') return -7
  if (scenario === 'stress') return -13
  if (scenario === 'attack') return -21
  return 0
}

export function scoreTone(score: number): Tone {
  if (score >= 78) return 'good'
  if (score >= 62) return 'watch'
  return 'risk'
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export const scenarioLabels: Record<Scenario, string> = {
  baseline: 'Baseline',
  thinData: 'Thin data',
  stress: 'Stress test',
  attack: 'Attack sim',
}

export const scenarioSequence: Scenario[] = ['baseline', 'thinData', 'stress', 'attack']

export function nextScenario(current: Scenario): Scenario {
  const index = scenarioSequence.indexOf(current)
  return scenarioSequence[(index + 1) % scenarioSequence.length]
}
