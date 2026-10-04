import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import type { Mesh } from 'three'
import DesktopProceduralCube from '../world/DesktopProceduralCube'
import GemAura from '../world/GemAura'
import { useExperience } from '../stores/useExperience'

function Glass() {
  const shell = useRef<Mesh>(null)
  return <><ambientLight intensity={1.6} /><pointLight position={[0, 0, 0]} intensity={12} color="#ff6c50" /><spotLight position={[3, 5, 5]} intensity={50} angle={.8} /><DesktopProceduralCube shellRef={shell} presentation /><GemAura /></>
}
class ArtBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}
export default function JournalArt() {
  const host = useRef<HTMLDivElement>(null)
  const [intersecting, setIntersecting] = useState(false)
  const [visible, setVisible] = useState(!document.hidden)
  const [motion, setMotion] = useState(!matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => { setMotion(!media.matches); useExperience.getState().setReducedMotion(media.matches) }
    const updateVisibility = () => setVisible(!document.hidden)
    const observer = new IntersectionObserver(entries => setIntersecting(entries.some(entry => entry.isIntersecting)), { threshold: .05 })
    if (host.current) observer.observe(host.current)
    updateMotion(); media.addEventListener('change', updateMotion); document.addEventListener('visibilitychange', updateVisibility)
    return () => { observer.disconnect(); media.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', updateVisibility) }
  }, [])
  return <div ref={host} className="journal-webgl"><ArtBoundary onFailure={() => host.current?.closest('.journal-art')?.removeAttribute('data-webgl-ready')}><Canvas camera={{ position: [0, 0, 5.5], fov: 36 }} dpr={1} gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }} frameloop={intersecting && visible ? motion ? 'always' : 'demand' : 'never'} onCreated={({ gl }) => { gl.setClearColor('#090507', 0); host.current?.closest('.journal-art')?.setAttribute('data-webgl-ready', 'true') }}><Glass /></Canvas></ArtBoundary></div>
}
