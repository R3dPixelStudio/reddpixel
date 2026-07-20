import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useExperience, MODES } from '../../stores/useExperience'

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

const CONTACT_LINKS = [
  {
    label: 'TELEGRAM',
    mark: '➤',
    markClassName: '-rotate-[18deg] text-[13px]',
    action: 'MESSAGE ME',
    detail: '@ReddPixel',
    href: 'https://t.me/ReddPixel',
    external: true,
    ariaLabel: 'Message Arash on Telegram. Opens in a new tab.',
  },
  {
    label: 'LINKEDIN',
    mark: 'in',
    markClassName: 'text-[11px] font-black tracking-[-0.08em]',
    action: 'CONNECT WITH ME',
    detail: 'ARASH MOHAMMADI',
    href: 'https://www.linkedin.com/in/arash-mohammadi-26454b197',
    external: true,
    ariaLabel: 'Connect with Arash on LinkedIn. Opens in a new tab.',
  },
  {
    label: 'GMAIL',
    mark: 'M',
    markClassName: 'text-[11px] font-black',
    action: 'EMAIL ME',
    detail: 'arashmohammadi9775@gmail.com',
    href: 'mailto:arashmohammadi9775@gmail.com',
    external: false,
    ariaLabel: 'Email Arash at arashmohammadi9775@gmail.com.',
  },
]

const INITIAL_MESSAGE: Message = {
  id: 0,
  sender: 'ai',
  text: "Greetings. I am the Oracle, an AI guide to Arash Mohammadi's work—not Arash himself. Ask me about his skills, projects, experience, availability, or ways to get in touch.",
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
  return 'The Oracle link is temporarily unavailable. Please try again in a moment.'
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
        container?.style.setProperty('--keyboard-offset', `${inset}px`)
        container?.style.setProperty('--oracle-viewport-height', `${viewport.height}px`)
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
      container?.style.removeProperty('--keyboard-offset')
      container?.style.removeProperty('--oracle-viewport-height')
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

  useGSAP(
    () => {
      gsap.set(containerRef.current, { autoAlpha: 0 })

      timelineRef.current = gsap
        .timeline({ paused: true })
        .to(containerRef.current, { autoAlpha: 1, duration: 0.1 })
        .fromTo('.split-node', { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(2)' })
        .fromTo(
          '.split-line',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.5, ease: 'expo.out' },
          '-=0.2',
        )
        .fromTo('.chat-portal', { height: 0 }, { height: '70vh', duration: 0.9, ease: 'power3.inOut' }, '-=0.1')
        .to('.split-line', { opacity: 0, scaleX: 0, duration: 0.4 }, '-=0.8')
        .fromTo(
          '.chat-element',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' },
          '-=0.3',
        )
    },
    { scope: containerRef },
  )

  useGSAP(
    () => {
      if (!timelineRef.current) return

      if (isExplore) {
        timelineRef.current.timeScale(1).play()
      } else if (timelineRef.current.progress() > 0) {
        timelineRef.current.timeScale(2).reverse()
      }
    },
    { scope: containerRef, dependencies: [isExplore] },
  )

  useEffect(() => {
    if (!isExplore) return

    const scrollFrame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })

    return () => window.cancelAnimationFrame(scrollFrame)
  }, [isExplore, isTyping, messages])

  const appendOracleMessage = (text: string, isError = false) => {
    if (!isMountedRef.current) return

    setMessages((currentMessages) => [
      ...currentMessages,
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
      .filter((message) => message.sender === 'user' && !message.isError)
      .slice(-6)
      .map((message) => ({ role: 'user' as const, content: message.text }))

    setMessages((currentMessages) => [
      ...currentMessages,
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
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      focusTimerRef.current = null
    }, 300)
  }

  return (
    <div
      ref={containerRef}
      aria-hidden={!isExplore}
      inert={!isExplore}
      className="oracle-contact-shell invisible fixed inset-0 z-40 flex items-center justify-center p-3 opacity-0 transition-[padding] duration-300 ease-out pointer-events-none sm:p-10"
    >
      <div
        className={`relative flex w-full max-w-3xl flex-col items-center ${
          isExplore ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div className="split-node z-20 h-0 w-0 origin-bottom scale-0 border-r-[12px] border-b-[12px] border-l-[12px] border-r-transparent border-b-red-600 border-l-transparent drop-shadow-[0_0_15px_#dc2626]" />

        <div className="split-line absolute top-1/2 left-1/2 z-0 h-px w-[120%] origin-center -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-red-500 to-transparent md:w-[150%]" />

        <div className="chat-portal flex w-full items-center justify-center overflow-hidden" style={{ height: 0 }}>
          <div className="oracle-chat-window chat-window relative flex w-full shrink-0 flex-col border-r border-l border-red-900/50 bg-[#050000]/90 shadow-[0_0_50px_rgba(220,38,38,0.1)] backdrop-blur-md">
            <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80" />

            <div className="chat-element flex shrink-0 items-center gap-4 border-b border-red-900/40 bg-black/40 p-4 sm:p-5">
              <div className="relative h-10 w-10 shrink-0 rotate-45 border border-red-500/50 p-1">
                <div className={`absolute inset-0 bg-red-600/20 ${isExplore ? 'animate-pulse' : ''}`} />
                <div className="flex h-full w-full -rotate-45 items-center justify-center border border-red-500/30 bg-red-950">
                  <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-[0.2em] text-red-100">THE ORACLE</h2>
                <p className="mt-0.5 text-[8px] tracking-[0.18em] text-red-500/80 uppercase sm:text-[9px]">
                  Portfolio Neural Link : Active
                </p>
              </div>
              <div className="ml-auto hidden items-center gap-2 text-[7px] tracking-[0.18em] text-red-500/50 uppercase sm:flex">
                <span className="h-1.5 w-1.5 rotate-45 bg-red-600 shadow-[0_0_8px_#dc2626]" />
                AI GUIDE
              </div>
            </div>

            <div className="chat-element shrink-0 border-b border-red-900/30 bg-black/25 px-2 pt-1.5 pb-2 sm:px-4 sm:pt-2">
              <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5 text-[6px] tracking-[0.16em] uppercase sm:text-[7px]">
                <span className="text-red-200/75">Contact Arash Directly</span>
                <span className="shrink-0 text-red-600/65">// Human Channels</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {CONTACT_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    aria-label={link.ariaLabel}
                    tabIndex={isExplore ? undefined : -1}
                    className="group/contact relative flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1 overflow-hidden border border-red-900/50 bg-[#050000]/70 px-1 py-1.5 text-center transition-colors duration-300 hover:border-red-500/70 focus-visible:border-red-400 focus-visible:outline-none sm:min-h-14 sm:flex-row sm:justify-start sm:gap-2 sm:px-3 sm:py-2 sm:text-left"
                  >
                    <span className="absolute inset-0 origin-left scale-x-0 bg-red-950/60 transition-transform duration-300 group-hover/contact:scale-x-100 group-focus-visible/contact:scale-x-100" />
                    <span
                      aria-hidden="true"
                      className="relative z-10 flex h-6 w-6 shrink-0 rotate-45 items-center justify-center border border-red-500/65 bg-red-950/75 text-red-200 shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-colors duration-300 group-hover/contact:border-red-400 group-hover/contact:text-white group-focus-visible/contact:border-red-400 group-focus-visible/contact:text-white"
                    >
                      <span className="-rotate-45">
                        <span className={`block leading-none ${link.markClassName}`}>{link.mark}</span>
                      </span>
                    </span>

                    <span className="relative z-10 min-w-0 text-center sm:text-left">
                      <span className="block text-[5px] font-bold tracking-[0.14em] text-red-500/75 sm:text-[6px]">
                        {link.label}
                      </span>
                      <span className="mt-0.5 block text-[7px] font-bold leading-none tracking-[0.08em] text-red-100 sm:text-[8px]">
                        {link.action}
                      </span>
                      <span className="mt-1 block break-all text-[5px] leading-tight tracking-[0.03em] text-red-500/65 sm:text-[6px] sm:tracking-[0.06em]">
                        {link.detail}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={isTyping}
              className="chat-element hide-scrollbar flex flex-1 flex-col space-y-5 overflow-y-auto p-4 sm:p-6"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${
                    message.id === INITIAL_MESSAGE.id
                      ? ''
                      : message.sender === 'user'
                        ? 'oracle-message-enter-user'
                        : 'oracle-message-enter-ai'
                  }`}
                >
                  <div className={`flex max-w-[88%] flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'} sm:max-w-[80%]`}>
                    <span className="mb-1 px-1 text-[7px] tracking-[0.2em] text-red-500/55 uppercase">
                      {message.sender === 'user' ? 'YOU' : message.isError ? 'ORACLE // LINK' : 'ORACLE'}
                    </span>
                    <div
                      dir="auto"
                      className={`relative px-4 py-3 text-start text-xs leading-relaxed font-light sm:text-sm ${
                        message.sender === 'user'
                          ? 'rounded-[14px_2px_14px_14px] border border-red-800/40 bg-gradient-to-br from-red-950/55 to-black/50 text-red-50 shadow-[0_8px_24px_rgba(80,0,0,0.2)]'
                          : message.isError
                            ? 'rounded-[2px_14px_14px_14px] border border-amber-700/30 bg-black/70 text-amber-100/80'
                            : 'rounded-[2px_14px_14px_14px] border border-red-500/25 bg-black/70 text-red-100 shadow-[0_8px_24px_rgba(0,0,0,0.3)]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute top-2 h-2 w-2 rotate-45 ${
                          message.sender === 'user'
                            ? '-right-1 border-t border-r border-red-800/40 bg-red-950'
                            : '-left-1 border-b border-l border-red-500/25 bg-black'
                        }`}
                      />
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="oracle-message-enter-ai flex w-full justify-start" aria-label="The Oracle is composing a reply">
                  <div className="flex items-center gap-1.5 rounded-[2px_14px_14px_14px] border border-red-500/20 bg-black/70 px-4 py-3">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="oracle-typing-dot h-1.5 w-1.5 rotate-45 bg-red-500 shadow-[0_0_6px_#ef4444]"
                        style={{ animationDelay: `${dot * 140}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <p className="chat-element shrink-0 border-t border-red-900/30 bg-black/50 px-3 py-1 text-[6px] tracking-[0.08em] text-red-500/55 sm:px-4 sm:text-[7px]">
              AI replies are processed by Groq. Do not submit sensitive information.
            </p>

            <form onSubmit={handleSend} className="chat-element flex shrink-0 gap-2 border-t border-red-900/40 bg-black/60 p-3 sm:gap-4 sm:p-4">
              <div className="relative min-w-0 flex-1">
                <label htmlFor="oracle-message" className="sr-only">
                  Message the Oracle
                </label>
                <input
                  id="oracle-message"
                  type="text"
                  dir="auto"
                  value={input}
                  maxLength={MESSAGE_LIMIT}
                  disabled={!isExplore || isTyping}
                  onChange={(event) => setInput(event.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="Transmit inquiry..."
                  autoComplete="off"
                  className="h-12 w-full min-w-0 border border-red-900/50 bg-[#050000] px-4 pr-12 text-xs text-red-100 transition-colors placeholder:text-red-900 focus:border-red-500 focus:outline-none sm:px-5"
                />
                <span className="pointer-events-none absolute right-3 bottom-1.5 text-[7px] tracking-wider text-red-900">
                  {input.length}/{MESSAGE_LIMIT}
                </span>
              </div>
              <button
                type="submit"
                aria-label="Send message"
                disabled={!isExplore || !input.trim() || isTyping}
                className="group/send flex h-12 w-12 shrink-0 rotate-45 items-center justify-center border border-red-500/50 bg-red-950/50 text-red-300 transition-all duration-300 hover:border-red-400 hover:bg-red-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-red-950/50"
              >
                <span aria-hidden="true" className="-rotate-45 text-sm transition-transform group-hover/send:-translate-y-0.5">
                  &#9650;
                </span>
              </button>
            </form>
          </div>
        </div>

        <div className="split-node z-20 h-0 w-0 origin-top scale-0 border-t-[12px] border-r-[12px] border-l-[12px] border-t-red-600 border-r-transparent border-l-transparent drop-shadow-[0_0_15px_#dc2626]" />
      </div>
    </div>
  )
}

export default ContactPhaseUI
