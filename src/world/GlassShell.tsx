import React, { useRef } from 'react'
import { Mesh } from 'three'
import { useExperience } from '../stores/useExperience'
import MobileBakedCube from './MobileBakedCube'
import DesktopProceduralCube from './DesktopProceduralCube'

const GlassShell: React.FC = () => {
  const isLowEnd = useExperience((state) => state.isLowEnd)
  const shellRef = useRef<Mesh>(null)

  // Render the heavily optimized static cube for Mobile, 
  // and the complex WebGL shader for Desktop.
  if (isLowEnd) {
    return <MobileBakedCube />
  }

  return <DesktopProceduralCube shellRef={shellRef} />
}

export default GlassShell