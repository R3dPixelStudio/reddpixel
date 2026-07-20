import React, { useRef } from 'react'
import { Mesh } from 'three'
import { useExperience } from '../stores/useExperience'
import MobileBakedCube from './MobileBakedCube'
import DesktopProceduralCube from './DesktopProceduralCube'

const GlassShell: React.FC = () => {
  const useMobileCube = useExperience((state) => state.isLowEnd)
  const shellRef = useRef<Mesh>(null)

  // Renderer quality follows measured GPU capability, never the CSS breakpoint.
  // Capable phones can therefore use the exact procedural desktop cube while
  // the Canvas still keeps its mobile DPR and feature limits.
  if (useMobileCube) {
    return <MobileBakedCube />
  }

  return <DesktopProceduralCube shellRef={shellRef} />
}

export default GlassShell
