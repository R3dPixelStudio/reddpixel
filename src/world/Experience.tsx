import React, { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useExperience } from '../stores/useExperience'
import TimelineBridge from '../core/timeline/TimelineBridge'
import GlassShell from './GlassShell'
import InnerWorldEnvironment from './InnerWorldEnvironment'
import GemAura from './GemAura' 

// ========================================================
// THE SCENE COMPILER
// ========================================================
// The old version called gl.compile() then assumed 500ms was
// always enough for the GPU to finish uploading textures / linking
// shaders before flipping isCubeReady. That's a guess about wall
// clock time, and it doesn't hold on slower mobile GPUs -- when
// the real work takes longer than 500ms, the loader hides while
// the canvas is still catching up, which is the black screen.
// Waiting for a few REAL rendered frames after compiling adapts to
// however fast this specific device actually is, instead of
// guessing a constant.
const FRAMES_TO_CONFIRM = 3

const SceneCompiler: React.FC = () => {
  const { gl, scene, camera } = useThree()
  const setCubeReady = useExperience((state) => state.setCubeReady)
  const framesLeft = useRef(FRAMES_TO_CONFIRM)

  useEffect(() => {
    // Front-load shader program linking so the first real frame
    // below isn't the one paying that cost.
    gl.compile(scene, camera)
  }, [gl, scene, camera])

  useFrame(() => {
    if (framesLeft.current <= 0) return
    framesLeft.current -= 1
    if (framesLeft.current === 0) setCubeReady()
  })

  return null
}

const Scene: React.FC = () => {
  const ismobile = useExperience((state) => state.isMobile )
  return (
    <>
      <TimelineBridge />
      <ambientLight intensity={8.4} />
      <directionalLight position={ismobile ? [4, 1, 8] : [4, 6, 8]} intensity={4.5} />
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
        dpr={isLowEnd ? 1 : [1, 1.5]}
        style={{ touchAction: 'none' }}
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