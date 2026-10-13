import { useState } from 'react'
import { GIRIH_PATH } from '../../content/ornament'

export default function AboutSignature() {
  const [physical, setPhysical] = useState(false)
  return <button type="button" className="about-signature-switch" data-physical={physical} aria-pressed={physical} aria-label="Switch between digital and physical signature" onClick={() => setPhysical(value => !value)}>
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <defs><radialGradient id="about-glass"><stop stopColor="#c5823c" /><stop offset=".45" stopColor="#9c1737" /><stop offset="1" stopColor="#240913" /></radialGradient></defs>
      <g className="signature-glass" transform="translate(10 10)"><path d={GIRIH_PATH} fill="url(#about-glass)" /><path d="M50 15 61 39 85 50 61 61 50 85 39 61 15 50 39 39Z" fill="#145a5f" /><path d="M50 30 70 50 50 70 30 50Z" fill="#ab4834" /></g>
      <g className="signature-circuit"><path d="M10 35H32L45 48M10 85H32L45 72M110 35H88L75 48M110 85H88L75 72M35 10V32L48 45M85 10V32L72 45M35 110V88L48 75M85 110V88L72 75" /><path d="M45 45H75V75H45Z M52 52H68V68H52Z" /><circle cx="10" cy="35" r="3" /><circle cx="110" cy="85" r="3" /><circle cx="85" cy="10" r="3" /><circle cx="35" cy="110" r="3" /></g>
      <path className="signature-outline" d="M60 3 117 60 60 117 3 60Z" />
    </svg>
    <span>{physical ? 'PHYSICAL / SYSTEMS' : 'DIGITAL / EXPERIENCE'}<small>Turn the pattern ↗</small></span>
  </button>
}
