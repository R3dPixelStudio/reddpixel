import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useExperience, MODES } from '../../stores/useExperience'

import { CONTACT_LINKS, PROFILE } from '../../content/portfolio'
import Signature from '../art/Signature'

function DirectLinks() {
  return <div className="direct-contact-links">
    {CONTACT_LINKS.map(link => <a key={link.label} href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener noreferrer' : undefined} aria-label={link.ariaLabel}><strong>{link.label === 'EMAIL' ? 'Email / Start a project' : link.label.charAt(0) + link.label.slice(1).toLowerCase()}</strong><span>{link.detail}</span><i aria-hidden="true">↗</i></a>)}
    {!PROFILE.youtube && <p className="social-pending">YouTube · Coming later</p>}
  </div>
}

type MessageSender = 'ai' | 'user'

interface Message {
  id: number
  sender: MessageSender
  text: string
  isError?: boolean
}

interface ChatApiError {
  code?: string
  message?: string
  retryAfter?: number
}

interface ChatApiPayload {
  reply?: string
  error?: string | ChatApiError
}

const MESSAGE_LIMIT = 500

const INITIAL_MESSAGE: Message = {
  id: 0,
  sender: 'ai',
  text: "Hey, welcome to Arash's little corner of the web. Have an idea you want to build, or just curious how this cube works? I'm listening.",
}

const isPersian = (text: string) => /[\u0600-\u06ff]/u.test(text)
const GERMAN_MARKERS = new Set([
  'arbeit',
  'arbeitet',
  'beruf',
  'bitte',
  'deutsch',
  'erfahrung',
  'fähigkeiten',
  'guten',
  'hallo',
  'kenntnisse',
  'kontakt',
  'können',
  'kannst',
  'nutzt',
  'projekt',
  'projekte',
  'seine',
  'sprachen',
  'spricht',
  'technologien',
  'verfügbar',
  'welche',
  'welcher',
  'welches',
  'warum',
  'womit',
])

const isGerman = (text: string) => {
  if (/[äöüß]/iu.test(text)) return true
  const words = text.toLocaleLowerCase('de-DE').match(/\p{L}+/gu) ?? []
  return words.some((word) => GERMAN_MARKERS.has(word))
}

const getLocalizedError = (code: string, userMessage: string, retryAfter?: number) => {
  const seconds = Math.max(1, Math.ceil(retryAfter ?? 10))
  const isBusy = code === 'RATE_LIMITED' || code === 'PROVIDER_BUSY'

  if (isPersian(userMessage)) {
    if (isBusy) return `اوراکل کمی شلوغ است. لطفاً ${seconds} ثانیه دیگر دوباره تلاش کنید.`
    if (code === 'OFFLINE') return 'اتصال اینترنت برقرار نیست. پس از اتصال دوباره پیام را ارسال کنید.'
    if (code === 'TIMEOUT') return 'پاسخ اوراکل بیش از حد طول کشید. لطفاً دوباره تلاش کنید.'
    return 'ارتباط اوراکل موقتاً قطع شد. لطفاً چند لحظه دیگر دوباره تلاش کنید.'
  }

  if (isGerman(userMessage)) {
    if (isBusy) return `Das Orakel ist gerade beschäftigt. Bitte versuche es in ${seconds} Sekunden erneut.`
    if (code === 'OFFLINE') return 'Du bist offline. Stelle die Verbindung wieder her und sende die Nachricht erneut.'
    if (code === 'TIMEOUT') return 'Die Antwort des Orakels hat zu lange gedauert. Bitte versuche es erneut.'
    return 'Die Verbindung zum Orakel ist vorübergehend unterbrochen. Bitte versuche es gleich noch einmal.'
  }

  if (isBusy) return `The Oracle is handling several inquiries. Please try again in ${seconds} seconds.`
  if (code === 'OFFLINE') return 'You appear to be offline. Reconnect and send the message again.'
  if (code === 'TIMEOUT') return 'The Oracle took too long to answer. Please try again.'
  return 'I can’t reach the AI service right now. Try again shortly, or use the direct contact links to reach Arash.'
}

const parsePayload = (rawText: string): ChatApiPayload | null => {
  if (!rawText) return null

  try {
    return JSON.parse(rawText) as ChatApiPayload
  } catch {
    return null
  }
}

const parseRetryAfter = (value: string | null) => {
  if (!value) return undefined
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined
}

const getApiError = (payload: ChatApiPayload | null, status: number, retryAfterHeader: string | null) => {
  const fallbackRetryAfter = parseRetryAfter(retryAfterHeader)

  if (typeof payload?.error === 'string') {
    return {
      code: status === 429 ? 'RATE_LIMITED' : 'TEMPORARY_FAILURE',
      retryAfter: fallbackRetryAfter,
    }
  }

  if (payload?.error && typeof payload.error === 'object') {
    return {
      code: payload.error.code ?? (status === 429 ? 'RATE_LIMITED' : 'TEMPORARY_FAILURE'),
      retryAfter: payload.error.retryAfter ?? fallbackRetryAfter,
    }
  }

  return {
    code: status === 429 ? 'RATE_LIMITED' : 'TEMPORARY_FAILURE',
    retryAfter: fallbackRetryAfter,
  }
}

const ContactPhaseUI: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const mode = useExperience((state) => state.mode)
  const reducedMotion = useExperience((state) => state.reducedMotion)
  const mobile = useExperience((state) => state.isMobile)
  const isExplore = mode === MODES.EXPLORE && currentPhase === 3

  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeRequestRef = useRef<AbortController | null>(null)
  const requestTimeoutRef = useRef<number | null>(null)
  const focusTimerRef = useRef<number | null>(null)
  const requestEpochRef = useRef(0)
  const nextMessageIdRef = useRef(1)
  const isMountedRef = useRef(true)

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const container = containerRef.current

    let updateFrame: number | null = null

    const updateKeyboardInset = () => {
      if (updateFrame !== null) window.cancelAnimationFrame(updateFrame)

      updateFrame = window.requestAnimationFrame(() => {
        const keyboardHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        const inset = keyboardHeight > 50 ? keyboardHeight : 0
        container?.toggleAttribute('data-keyboard-open', inset > 0)
        container?.style.setProperty('--keyboard-offset', `${inset}px`)
        updateFrame = null
      })
    }

    updateKeyboardInset()
    viewport.addEventListener('resize', updateKeyboardInset)
    viewport.addEventListener('scroll', updateKeyboardInset)

    return () => {
      viewport.removeEventListener('resize', updateKeyboardInset)
      viewport.removeEventListener('scroll', updateKeyboardInset)
      if (updateFrame !== null) window.cancelAnimationFrame(updateFrame)
      container?.removeAttribute('data-keyboard-open')
      container?.style.removeProperty('--keyboard-offset')
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      activeRequestRef.current?.abort()
      activeRequestRef.current = null

      if (requestTimeoutRef.current !== null) clearTimeout(requestTimeoutRef.current)
      if (focusTimerRef.current !== null) clearTimeout(focusTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (isExplore) return
    requestEpochRef.current += 1
    activeRequestRef.current?.abort()
  }, [isExplore])

  useGSAP(() => {
    timelineRef.current = gsap.timeline({ paused: true })
      .fromTo(containerRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 })
      .fromTo('.oracle-minimal-card', { y: 24 }, { y: 0, duration: 0.6, ease: 'power3.out' }, 0)
  }, { scope: containerRef })
  useGSAP(
    () => {
      if (!timelineRef.current) return

      if (isExplore) {
        timelineRef.current.timeScale(reducedMotion ? 1000 : 1).play()
      } else if (timelineRef.current.progress() > 0) {
        timelineRef.current.timeScale(reducedMotion ? 1000 : 2).reverse()
      }
    },
    { scope: containerRef, dependencies: [isExplore, reducedMotion] },
  )

  useEffect(() => {
    if (!isExplore) return

    const scrollFrame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' })
    })

    return () => window.cancelAnimationFrame(scrollFrame)
  }, [isExplore, isTyping, messages, reducedMotion])

  const appendOracleMessage = (text: string, isError = false) => {
    if (!isMountedRef.current) return

    setMessages((currentMessages) => [
      ...currentMessages.slice(-39),
      {
        id: nextMessageIdRef.current++,
        sender: 'ai',
        text,
        isError,
      },
    ])
  }

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault()

    const userText = input.trim()
    if (!isExplore || !userText || activeRequestRef.current) return

    const conversationHistory = messages
      .filter((message) => message.id !== INITIAL_MESSAGE.id && !message.isError)
      .slice(-8)
      .map((message) => ({ role: message.sender === 'user' ? 'user' as const : 'assistant' as const, content: message.text }))

    setMessages((currentMessages) => [
      ...currentMessages.slice(-39),
      {
        id: nextMessageIdRef.current++,
        sender: 'user',
        text: userText,
      },
    ])
    setInput('')

    if (!navigator.onLine) {
      appendOracleMessage(getLocalizedError('OFFLINE', userText), true)
      return
    }

    const controller = new AbortController()
    const requestEpoch = requestEpochRef.current
    activeRequestRef.current = controller
    setIsTyping(true)
    requestTimeoutRef.current = window.setTimeout(() => controller.abort(), 20000)

    const requestIsCurrent = () => {
      const state = useExperience.getState()
      return (
        isMountedRef.current &&
        requestEpochRef.current === requestEpoch &&
        activeRequestRef.current === controller &&
        state.currentPhase === 3 &&
        state.mode === MODES.EXPLORE
      )
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userText,
          history: conversationHistory,
        }),
      })

      const payload = parsePayload(await response.text())
      if (!requestIsCurrent()) return

      if (response.ok && typeof payload?.reply === 'string' && payload.reply.trim()) {
        appendOracleMessage(payload.reply.trim())
        return
      }

      const apiError = getApiError(payload, response.status, response.headers.get('Retry-After'))
      appendOracleMessage(getLocalizedError(apiError.code, userText, apiError.retryAfter), true)
    } catch (error) {
      if (!requestIsCurrent()) return

      const code = error instanceof DOMException && error.name === 'AbortError' ? 'TIMEOUT' : 'TEMPORARY_FAILURE'
      appendOracleMessage(getLocalizedError(code, userText), true)
    } finally {
      if (requestTimeoutRef.current !== null) {
        clearTimeout(requestTimeoutRef.current)
        requestTimeoutRef.current = null
      }

      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null
        if (isMountedRef.current) setIsTyping(false)
      }
    }
  }

  const handleInputFocus = () => {
    if (focusTimerRef.current !== null) clearTimeout(focusTimerRef.current)

    focusTimerRef.current = window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' })
      focusTimerRef.current = null
    }, 300)
  }

  return <section ref={containerRef} data-active={isExplore} aria-label="Chat and contact" aria-hidden={!isExplore} inert={!isExplore} className="oracle-contact-shell phase-panel invisible">
    {mobile ? <details className="contact-direct direct-contact-mobile"><summary><span aria-hidden="true">✦</span> Connect with Arash <span className="direct-toggle" aria-hidden="true">+</span></summary><DirectLinks /></details> : <aside className="contact-direct direct-contact-desktop"><Signature /><p className="eyebrow">DIRECT / HUMAN</p><h2>Make contact.</h2><p className="direct-intro">A project, a collaboration, a hello.</p><DirectLinks /></aside>}
    <div className="oracle-minimal-card">
      <header className="oracle-header"><div><p className="eyebrow">REDDPIXEL / AI GUIDE</p><h2>The Oracle<span aria-hidden="true"> ✦</span></h2><p>Talk ideas. Ask about the work.</p></div></header>
      <div className="oracle-conversation" role="log" aria-live="polite" aria-relevant="additions" aria-busy={isTyping}>
        {messages.map((message) => <div key={message.id} className={`oracle-message ${message.sender === 'user' ? 'message-user' : 'message-ai'} ${message.isError ? 'message-note' : ''}`}>
          <span className="message-label">{message.sender === 'user' ? 'YOU' : message.isError ? 'CONNECTION NOTE' : 'ORACLE'}</span>
          <p dir="auto">{message.text}</p>
        </div>)}
        {isTyping && <div role="status" className="oracle-composing">Thinking<span aria-hidden="true"> · · ·</span></div>}
        <div ref={messagesEndRef} />
      </div>
      {messages.length === 1 && <div className="oracle-suggestions">{['What can Arash build?', 'Tell me about the visuals'].map((question) => <button key={question} type="button" onClick={() => { setInput(question); document.getElementById('oracle-message')?.focus() }}>{question}</button>)}</div>}
      <form onSubmit={handleSend} className="oracle-compose">
        <label htmlFor="oracle-message" className="sr-only">Message the Oracle</label>
        <input id="oracle-message" type="text" dir="auto" value={input} maxLength={MESSAGE_LIMIT} disabled={!isExplore || isTyping} onChange={(event) => setInput(event.target.value)} onFocus={handleInputFocus} placeholder="Ask me something…" autoComplete="off" />
        <button type="submit" aria-label="Send message" disabled={!isExplore || !input.trim() || isTyping}>↑</button>
      </form>
      <p className="oracle-privacy">AI guide, not Arash. Replies via Groq · Please keep sensitive details out.</p>
    </div>
  </section>
}

export default ContactPhaseUI


