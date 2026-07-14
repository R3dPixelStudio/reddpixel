import React, { useRef } from 'react'
import { Mesh } from 'three'
import { useExperience } from '../stores/useExperience'
import MobileBakedCube from './MobileBakedCube'
import DesktopProceduralCube from './DesktopProceduralCube'

const GlassShell: React.FC = () => {
  const useMobileCube = useExperience((state) => state.isMobile || state.isLowEnd)
  const shellRef = useRef<Mesh>(null)

  // Every phone uses the bounded transmission path. Low-end desktops also get
  // it, while capable desktop GPUs retain the full procedural material.
  if (useMobileCube) {
    return <MobileBakedCube />
  }

  return <DesktopProceduralCube shellRef={shellRef} />
}

export default GlassShell