import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useExperience } from '../../stores/useExperience'

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null)
  const isMobile = useExperience((state) => state.isMobile)

  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    const xTo = gsap.quickTo(cursorRef.current, "x", { duration: 0.15, ease: "power3" })
    const yTo = gsap.quickTo(cursorRef.current, "y", { duration: 0.15, ease: "power3" })

    const moveCursor = (e: MouseEvent) => {
      xTo(e.clientX)
      yTo(e.clientY)
    }

    window.addEventListener('mousemove', moveCursor)
    return () => window.removeEventListener('mousemove', moveCursor)
  }, [isMobile])

  if (isMobile) return null; // Zero DOM rendering on mobile

  return (
    <div 
      ref={cursorRef} 
      className="fixed top-0 left-0 w-4 h-4 border border-red-500/50 rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
    >
      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_#ef4444]" />
    </div>
  )
}

export default CustomCursor