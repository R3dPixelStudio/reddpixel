import React, { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useExperience } from '../stores/useExperience'
import TimelineBridge from '../core/timeline/TimelineBridge'
import GlassShell from './GlassShell'
import InnerWorldEnvironment from './InnerWorldEnvironment'
import GemAura from './GemAura' 

// ========================================================
// THE SCENE COMPILER
// ========================================================
const SceneCompiler: React.FC = () => {
  const { gl, scene, camera } = useThree()
  const setCubeReady = useExperience((state) => state.setCubeReady)

  useEffect(() => {
    // 1. Force the GPU to synchronously compile materials
    gl.compile(scene, camera)

    // 2. We give the GPU a tiny breather (500ms) to upload the heavy textures 
    // to VRAM before we drop the loading screen curtain. No more black voids!
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        setCubeReady()
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [gl, scene, camera, setCubeReady])

  return null
}

const Scene: React.FC = () => {
  return (
    <>
      <TimelineBridge />
      <ambientLight intensity={2.4} />
      <directionalLight position={[4, 6, 8]} intensity={4.5} />
      <GemAura /> 
      <GlassShell />
      <InnerWorldEnvironment />
      <SceneCompiler />
    </>
  )
}

const Experience: React.FC = () => {
  const isLowEnd = useExperience((state) => state.isLowEnd)

  return (
    <div id="webgl-root" className="webgl-layer fixed inset-0 z-0">
      <Canvas
        // DO NOT force 1.5 dpr on a potato phone. Let it breathe at 1.0!
        dpr={isLowEnd ? 1 : [1, 1.5]}
        gl={{
          antialias: !isLowEnd,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 45, near: 0.01, far: 500, position: [0, 0, 12] }}
        shadows={!isLowEnd}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Experience