import React, { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useExperience, MODES } from '../../stores/useExperience'

interface Message {
  sender: 'ai' | 'user'
  text: string
}

const ContactPhaseUI: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const mode = useExperience((state) => state.mode)
  const isExplore = mode === MODES.EXPLORE && currentPhase === 3
  
  const containerRef = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Greetings, traveler. I am the Architect's digital shadow. Speak your inquiry, and I shall fetch the answers from the databanks." }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  // THE NEW SPELL: Track the keyboard's height!
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  // 1. THE SEER'S EYE: Watch the Visual Viewport to detect the Virtual Keyboard
  useEffect(() => {
    // Safety check for SSR, though Vite handles this well
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const viewport = window.visualViewport;

    const handleResize = () => {
      // The difference between the layout window and the visual window is the keyboard!
      const offset = window.innerHeight - viewport.height;
      // If the difference is larger than 50px, the keyboard is likely open.
      setKeyboardOffset(offset > 50 ? offset : 0);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  // 2. THE FORGE: Build timeline completely isolated from state!
  useGSAP(() => {
    gsap.set(containerRef.current, { autoAlpha: 0 })
    
    tl.current = gsap.timeline({ paused: true })
      .to(containerRef.current, { autoAlpha: 1, duration: 0.1 })
      .fromTo('.split-node', 
         { scale: 0 }, 
         { scale: 1, duration: 0.5, ease: 'back.out(2)' }
      )
      .fromTo('.split-line', 
         { scaleX: 0, opacity: 0 }, 
         { scaleX: 1, opacity: 1, duration: 0.5, ease: 'expo.out' }, 
         "-=0.2"
      )
      .fromTo('.chat-portal', 
         { height: 0 }, 
         { height: '70vh', duration: 0.9, ease: 'power3.inOut' }, 
         "-=0.1"
      )
      .to('.split-line', { opacity: 0, scaleX: 0, duration: 0.4 }, "-=0.8")
      .fromTo('.chat-element', 
         { y: 20, opacity: 0 }, 
         { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' }, 
         "-=0.3"
      )
  }, { scope: containerRef })

  // 3. THE CONDUCTOR: Pure playback logic!
  useEffect(() => {
    if (!tl.current) return;
    if (isExplore) {
       tl.current.timeScale(1).play()
    } else {
       tl.current.timeScale(2).reverse()
    }
  }, [isExplore])
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // 4. THE ORACLE'S BRAIN
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return
    
    const userMsg = input.trim()
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }])
    setInput('')
    setIsTyping(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      })

      const data = await response.json()

      if (response.ok && data.reply) {
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }])
      } else {
        throw new Error(data.error || "Failed to fetch response from backend")
      }
    } catch (error) {
      console.error("Oracle Error:", error)
      setMessages(prev => [...prev, { sender: 'ai', text: "The neural link was disrupted by a stray cosmic ray. Please try your inquiry again." }])
    } finally {
      setIsTyping(false)
    }
  }

  // A small helper to ensure we scroll the input into view when tapped!
  const handleInputFocus = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300); // Wait for the keyboard animation to finish
  }

  return (
    // THE FIX: We apply dynamic paddingBottom based on the keyboard's height!
    // Added transition-all so it slides up smoothly like magic.
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-10 pointer-events-none transition-all duration-300 ease-out"
      style={{ paddingBottom: keyboardOffset > 0 ? `${keyboardOffset}px` : '' }}
    >
      
      <div className="relative flex flex-col items-center w-full max-w-3xl pointer-events-auto">

        {/* TOP NODE HALF */}
        <div className="split-node z-20 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[12px] border-transparent border-b-red-600 drop-shadow-[0_0_15px_#dc2626] origin-bottom scale-0" />

        <div className="split-line absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] md:w-[150%] h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent z-0 origin-center" />

        <div className="chat-portal flex items-center justify-center w-full overflow-hidden" style={{ height: 0 }}>
            
            <div className="chat-window flex flex-col w-full h-[70vh] flex-shrink-0 bg-[#050000]/90 backdrop-blur-md border-l border-r border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
              
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80" />

              {/* Header */}
              <div className="chat-element flex items-center gap-4 p-5 border-b border-red-900/40 bg-black/40">
                <div className="relative w-10 h-10 border border-red-500/50 p-1 rotate-45 flex-shrink-0">
                    <div className="absolute inset-0 bg-red-600/20 animate-pulse" />
                    <div className="w-full h-full bg-red-950 border border-red-500/30 -rotate-45 flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]" />
                    </div>
                </div>
                <div>
                    <h2 className="text-sm font-bold tracking-[0.2em] text-red-100">THE ORACLE</h2>
                    <p className="text-[9px] text-red-500/80 tracking-widest uppercase mt-0.5">Gemini Neural Link : Active</p>
                </div>
              </div>

              {/* Chat History */}
              <div className="chat-element flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar flex flex-col">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`relative max-w-[80%] p-4 text-xs md:text-sm tracking-wide leading-relaxed font-light ${
                        msg.sender === 'user' 
                        ? 'bg-red-950/20 border border-red-900/30 text-red-100 rounded-[20px_0px_20px_20px]' 
                        : 'bg-black/60 border border-red-500/20 text-red-200 rounded-[0px_20px_20px_20px]'
                      }`}>
                        {msg.text}
                      </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex w-full justify-start">
                      <div className="flex gap-1 p-4 bg-black/60 border border-red-500/20 rounded-[0px_20px_20px_20px]">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-100" />
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-200" />
                      </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} className="chat-element p-4 border-t border-red-900/40 bg-black/60 flex gap-4">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onFocus={handleInputFocus} // THE FIX: Keep it scrolled into view!
                  placeholder="Transmit inquiry..." 
                  className="flex-1 bg-[#050000] border border-red-900/50 rounded-full px-6 py-3 text-xs text-red-100 focus:outline-none focus:border-red-500 transition-colors placeholder:text-red-900"
                />
                <button type="submit" disabled={!input.trim() || isTyping} className="w-12 h-12 flex items-center justify-center bg-red-950/50 border border-red-500/50 rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">
                  ▲
                </button>
              </form>
            </div>
        </div>

        {/* BOTTOM NODE HALF */}
        <div className="split-node z-20 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-transparent border-t-red-600 drop-shadow-[0_0_15px_#dc2626] origin-top scale-0" />

      </div>
    </div>
  )
}

export default ContactPhaseUI