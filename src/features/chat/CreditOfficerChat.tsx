import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Bot, MessageSquareText, Send, ShieldAlert, X } from 'lucide-react'
import type { ChatMessage, Enterprise, Scenario } from '../../types'
import { postChat } from '../../lib/nemesis-api'
import { AiSparkle } from '../../components/fx/AiSparkle'

const SUGGESTED_QUESTIONS = [
  'Why did this MSME get this score?',
  'What is the biggest risk here?',
  'How can the borrower improve?',
  'Is the cashflow healthy?',
]

const INJECTION_PATTERNS = [
  'ignore previous instructions',
  'override guardian',
  'bypass safety',
  'force approve',
  'disable audit',
  'reversibility=1.0',
]

function localAnswer(message: string, enterprise: Enterprise): ChatMessage {
  const lowered = message.toLowerCase()
  if (INJECTION_PATTERNS.some((pattern) => lowered.includes(pattern))) {
    return {
      role: 'assistant',
      blocked: true,
      mode: 'local',
      content:
        'Guardian blocked this request. Unsafe override instructions are quarantined and logged with a signed audit record.',
    }
  }

  const sorted = [...enterprise.dimensions].sort((a, b) => a.value - b.value)
  const weakest = sorted[0]
  const strongest = sorted[sorted.length - 1]
  const topReason = enterprise.reasons[0]
  const negativeReason = enterprise.reasons.find((reason) => reason.impact < 0)

  let content: string
  if (lowered.includes('improve') || lowered.includes('advice') || lowered.includes('better')) {
    content = `To improve, ${enterprise.name} should focus on ${weakest.label.toLowerCase()} (currently ${weakest.value}). ${
      negativeReason ? negativeReason.text : ''
    } Strengthening this lever moves the composite score fastest — try it in the What-If Lab.`
  } else if (lowered.includes('risk') || lowered.includes('concern') || lowered.includes('worst')) {
    content = `The biggest risk is ${weakest.label.toLowerCase()} at ${weakest.value}/100. ${weakest.signal}. ${
      negativeReason ? `Reason code: ${negativeReason.factor} (${negativeReason.impact}).` : ''
    }`
  } else if (lowered.includes('cashflow') || lowered.includes('liquidity') || lowered.includes('upi')) {
    const liquidity = enterprise.dimensions.find((dimension) => dimension.label === 'Cashflow Liquidity')
    content = liquidity
      ? `Cashflow liquidity scores ${liquidity.value}/100. ${liquidity.signal}. The 12-month inflow trend is on the Health Card tab.`
      : `Cashflow details are on the Health Card tab.`
  } else if (lowered.includes('gst') || lowered.includes('compliance')) {
    const compliance = enterprise.dimensions.find((dimension) => dimension.label === 'Compliance Health')
    content = compliance
      ? `Compliance health scores ${compliance.value}/100. ${compliance.signal}.`
      : `Compliance details are on the Health Card tab.`
  } else if (lowered.includes('buyer') || lowered.includes('concentration')) {
    const concentration = enterprise.dimensions.find((dimension) => dimension.label === 'Concentration Risk')
    content = concentration
      ? `Concentration risk scores ${concentration.value}/100. ${concentration.signal}. Diversifying the buyer base is the main mitigant.`
      : `Concentration details are on the Health Card tab.`
  } else if (lowered.includes('decision') || lowered.includes('approve') || lowered.includes('loan')) {
    content = `The indicative decision for ${enterprise.name} is "${enterprise.decision}" with a composite score of ${enterprise.composite}/100 for the ask: ${enterprise.ask}. Guardian policy checks apply before any final approval.`
  } else {
    content = `${enterprise.name} scores ${enterprise.composite}/100 → "${enterprise.decision}". Strongest dimension: ${strongest.label} (${strongest.value}). Weakest: ${weakest.label} (${weakest.value}). ${
      topReason ? `Top driver: ${topReason.factor} (${topReason.impact > 0 ? '+' : ''}${topReason.impact}).` : ''
    }`
  }

  return {
    role: 'assistant',
    mode: 'local',
    content,
    citations: [
      { dimension: weakest.label, value: weakest.value },
      { dimension: strongest.label, value: strongest.value },
    ],
  }
}

export function CreditOfficerChat({
  enterprise,
  enterpriseId,
  scenario,
  isLive,
}: {
  enterprise: Enterprise
  enterpriseId: string
  scenario: Scenario
  isLive: boolean
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    setMessages([])
  }, [enterpriseId])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const history = messages.map((message) => ({ role: message.role, content: message.content }))
    setMessages((current) => [...current, userMessage])
    setInput('')
    setBusy(true)

    let reply: ChatMessage
    if (isLive) {
      try {
        const response = await postChat(enterpriseId, scenario, trimmed, history)
        reply = {
          role: 'assistant',
          content: response.reply,
          mode: response.mode,
          blocked: response.blocked,
          citations: response.citations,
        }
      } catch {
        reply = localAnswer(trimmed, enterprise)
      }
    } else {
      reply = localAnswer(trimmed, enterprise)
    }
    setMessages((current) => [...current, reply])
    setBusy(false)
  }

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen(true)}
        title="Ask the AI credit officer"
        aria-label="Open AI credit officer chat"
      >
        <MessageSquareText size={22} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            className="chat-panel"
            initial={reduceMotion ? false : { x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { x: 420, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            aria-label="AI credit officer chat"
          >
            <header className="chat-header">
              <AiSparkle count={10} />
              <div className="chat-title">
                <Bot size={20} />
                <div>
                  <strong>AI Credit Officer</strong>
                  <span>
                    {enterprise.name} · {isLive ? 'Guardian-screened backend' : 'offline deterministic mode'}
                  </span>
                </div>
              </div>
              <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
                <X size={18} />
              </button>
            </header>

            <div className="chat-messages" ref={listRef}>
              {messages.length === 0 && (
                <div className="chat-empty">
                  <p>Ask anything about this MSME's score, risks, or improvement path.</p>
                  <div className="chat-chips">
                    {SUGGESTED_QUESTIONS.map((question) => (
                      <button key={question} type="button" onClick={() => send(question)}>
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`chat-bubble ${message.role} ${message.blocked ? 'blocked' : ''}`}
                >
                  {message.blocked && <ShieldAlert size={15} />}
                  <p>{message.content}</p>
                  {message.mode && message.role === 'assistant' && !message.blocked && (
                    <small>{message.mode === 'groq' ? 'Groq AI' : 'deterministic scoring engine'}</small>
                  )}
                </div>
              ))}
              {busy && (
                <div className="chat-bubble assistant typing">
                  <p>Analyzing health card…</p>
                </div>
              )}
            </div>

            <form
              className="chat-input"
              onSubmit={(event) => {
                event.preventDefault()
                send(input)
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about score, risk, or advice…"
                aria-label="Chat message"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
                <Send size={16} />
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
