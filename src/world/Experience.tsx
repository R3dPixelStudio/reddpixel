import React, { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useExperience } from '../stores/useExperience'
import TimelineBridge from '../core/timeline/TimelineBridge'
import GlassShell from './GlassShell'
import InnerWorldEnvironment from './InnerWorldEnvironment'
import GemAura from './GemAura' 

// ========================================================
// THE SCENE COMPILER
// This guarantees shaders are compiled and painted!
// ========================================================
const SceneCompiler: React.FC = () => {
  const { gl, scene, camera } = useThree()
  const setCubeReady = useExperience((state) => state.setCubeReady)

  useEffect(() => {
    // 1. Force the GPU to synchronously compile all materials currently in the scene.
    // This prevents the massive stutter that happens when procedural shaders render for the first time.
    gl.compile(scene, camera)

    // 2. Wait for the browser to physically paint the compiled frame to the screen.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 3. ONLY NOW do we tell App.tsx to drop the loading screen.
        setCubeReady()
      })
    })
  }, [gl, scene, camera, setCubeReady])

  return null
}

const Scene: React.FC = () => {
  return (
    <>
      <TimelineBridge />
      <ambientLight intensity={2.4} />
      <directionalLight position={[4, 6, 8]} intensity={4.5} />
      
      {/* Background Phase 0 Atmosphere */}
      <GemAura /> 
      
      {/* The Core Artifacts */}
      <GlassShell />
      <InnerWorldEnvironment />

      {/* We place the Compiler at the very end of the Scene so it evaluates 
        all the geometry and lights that were declared above it.
      */}
      <SceneCompiler />
    </>
  )
}

const Experience: React.FC = () => {
  const isLowEnd = useExperience((state) => state.isLowEnd)

  return (
    <div id="webgl-root" className="webgl-layer fixed inset-0 z-0">
      <Canvas
        dpr={isLowEnd ? 1.5 : [1.5, 2]}
        gl={{
          antialias: !isLowEnd, // Saves massive bandwidth on mobile
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 45, near: 0.01, far: 500, position: [0, 0, 12] }}
        shadows={!isLowEnd} // Off entirely on mobile!
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Experience