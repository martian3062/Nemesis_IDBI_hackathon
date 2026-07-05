import { useEffect, useState } from 'react'
import { GitBranch, Network, Play, ShieldCheck } from 'lucide-react'
import type { ComponentType } from 'react'
import type { Scenario, SwarmRunResult } from '../../types'
import { postSwarmRun } from '../../lib/nemesis-api'
import { MotionSection, MotionGrid, MotionTile } from '../../components/ui/MotionCard'
import { LazyNeuralField } from '../../components/fx/LazyNeuralField'
import { AiSparkle } from '../../components/fx/AiSparkle'

// Simulated agent chatter so the event stream reads as a living pipeline in demos.
const LIVE_EVENT_POOL = [
  'Perceiver revalidated GST-bank reconciliation window',
  'Planner refreshed exposure cap against buyer-concentration limit',
  'Guardian heartbeat: consent scopes verified, no drift detected',
  'Recoverer probed EPFO connector latency: 142ms, healthy',
  'Injection sentinel scanned operator inputs: clean',
  'Telemetry batch flushed to analytics stream',
  'Vector memory refreshed reason-code templates',
  'Connector pool rotated AA session token',
]

function timestamp() {
  return new Date().toLocaleTimeString('en-IN', { hour12: false })
}

type RenderedAgent = {
  name: string
  role: string
  tier: string
  health: number
  detail: string
  icon: ComponentType<{ size?: number | string }>
}

export function SwarmTab({
  agents,
  events,
  enterpriseId,
  scenario,
  isLive,
}: {
  agents: RenderedAgent[]
  events: string[]
  enterpriseId: string
  scenario: Scenario
  isLive: boolean
}) {
  const [liveEvents, setLiveEvents] = useState<{ time: string; text: string }[]>([])
  const [swarmRun, setSwarmRun] = useState<SwarmRunResult | null>(null)
  const [running, setRunning] = useState(false)

  const runLiveSwarm = async () => {
    if (running) return
    setRunning(true)
    try {
      const result = await postSwarmRun(enterpriseId, scenario)
      setSwarmRun(result)
    } catch {
      setSwarmRun(null)
    }
    setRunning(false)
  }

  useEffect(() => {
    setSwarmRun(null)
  }, [enterpriseId, scenario])

  useEffect(() => {
    let index = 0
    const interval = window.setInterval(() => {
      const text = LIVE_EVENT_POOL[index % LIVE_EVENT_POOL.length]
      index += 1
      setLiveEvents((current) => [{ time: timestamp(), text }, ...current].slice(0, 5))
    }, 4000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <MotionSection className="content-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Eraya-inspired cascade</p>
            <h3>Four-agent financial swarm</h3>
          </div>
          <Network size={22} />
        </div>
        <div className="neural-hero glass">
          <LazyNeuralField />
          <div className="neural-hero-copy">
            <AiSparkle />
            <strong>Agentic underwriting core</strong>
            <span>Four small LLMs negotiating over a guarded A2A channel</span>
          </div>
        </div>

        <div className="swarm-run-bar">
          <button type="button" className="primary-button" onClick={runLiveSwarm} disabled={running || !isLive}>
            <Play size={15} />
            {running ? 'Agents negotiating…' : 'Run live LLM swarm'}
          </button>
          {!isLive && <span className="swarm-hint">Backend offline — live swarm needs the API up.</span>}
          {swarmRun && (
            <span className={`mode-pill ${swarmRun.mode === 'live-llm' ? 'live' : ''}`}>
              {swarmRun.mode === 'live-llm' ? `live · ${swarmRun.model}` : 'deterministic fallback'}
            </span>
          )}
        </div>

        {swarmRun && (
          <div className="swarm-outputs">
            {Object.entries(swarmRun.agents).map(([name, agent]) => (
              <div key={name} className="swarm-output">
                <div className="swarm-output-head">
                  <strong>{name}</strong>
                  <small>{agent.model}</small>
                </div>
                <p>{agent.output}</p>
              </div>
            ))}
          </div>
        )}

        <MotionGrid className="agent-grid">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <MotionTile key={agent.name} className="agent-tile">
                <div className="agent-icon">
                  <Icon size={22} />
                </div>
                <div>
                  <strong>{agent.name}</strong>
                  <span>{agent.role}</span>
                  <p>{agent.detail}</p>
                </div>
                <div className="health-bar" aria-label={`${agent.name} health ${agent.health}`}>
                  <i style={{ width: `${agent.health}%` }} />
                </div>
                <small>{agent.tier}</small>
              </MotionTile>
            )
          })}
        </MotionGrid>
      </article>

      <article className="panel compact-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">A2A event stream</p>
            <h3>Decision path</h3>
          </div>
          <GitBranch size={22} />
        </div>
        {swarmRun ? (
          <div className="a2a-log">
            <div className="live-ticker-head">
              <ShieldCheck size={14} />
              <span>Guarded A2A channel</span>
            </div>
            {swarmRun.a2a_log.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`a2a-message ${message.blocked ? 'blocked' : ''}`}>
                <div className="a2a-route">
                  <b>{message.from}</b>
                  <i>→</i>
                  <b>{message.to}</b>
                  <small>{message.guardrail_findings.join(' · ')}</small>
                </div>
                <p>{message.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <ol className="event-list">
            {events.map((event, index) => (
              <li key={event}>
                <span>{index + 1}</span>
                <p>{event}</p>
              </li>
            ))}
          </ol>
        )}

        <div className="live-ticker">
          <div className="live-ticker-head">
            <i className="live-dot" />
            <span>Live agent telemetry</span>
          </div>
          {liveEvents.length === 0 && <p className="ticker-waiting">Listening for agent chatter…</p>}
          {liveEvents.map((event) => (
            <p key={`${event.time}-${event.text}`} className="ticker-row">
              <b>{event.time}</b>
              {event.text}
            </p>
          ))}
        </div>
      </article>
    </MotionSection>
  )
}
