import React, { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useExperience, MODES } from '../stores/useExperience'
import TimelineBridge from '../core/timeline/TimelineBridge'
import GlassShell from './GlassShell'
import InnerWorldEnvironment from './InnerWorldEnvironment'
import GemAura from './GemAura'
import { useCubeInteraction } from './useCubeInteraction'

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
  const isMobile = useExperience((state) => state.isMobile)
  const isLowEnd = useExperience((state) => state.isLowEnd)
  const isCubeReady = useExperience((state) => state.isCubeReady)
  const useMobileLighting = isMobile || isLowEnd
  useCubeInteraction()

  return (
    <>
      <TimelineBridge />
      <ambientLight intensity={useMobileLighting ? 3.8 : 8.4} />
      <directionalLight position={[4, 6, 8]} intensity={useMobileLighting ? 3.8 : 5.5} />
      <GemAura />
      <GlassShell />
      <InnerWorldEnvironment />
      {!isCubeReady && <SceneCompiler />}
    </>
  )
}

const Experience: React.FC<{ onFailure: () => void }> = ({ onFailure }) => {
  const isMobile = useExperience((state) => state.isMobile)
  const isLowEnd = useExperience((state) => state.isLowEnd)
  const useConservativeCanvas = isMobile || isLowEnd
  const isCubeReady = useExperience((state) => state.isCubeReady)
  const phase = useExperience((state) => state.currentPhase)
  const mode = useExperience((state) => state.mode)
  const isMobilePanel = isMobile && phase > 0 && mode === MODES.EXPLORE
  const isSceneSettling = useExperience((state) => state.isSceneSettling)
  const isCubeInteracting = useExperience((state) => state.isCubeInteracting)
  const isContentView = useExperience((state) => state.isContentView)
  const isSceneObscured = useExperience((state) => state.isSceneObscured)
  const isTransitioning = useExperience((state) => state.isTransitioning)
  const [isVisible, setIsVisible] = React.useState(!document.hidden)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const syncVisibility = () => setIsVisible(!document.hidden)
    document.addEventListener('visibilitychange', syncVisibility)
    return () => document.removeEventListener('visibilitychange', syncVisibility)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('webglcontextlost', onFailure)
    return () => canvas.removeEventListener('webglcontextlost', onFailure)
  }, [onFailure])

  return (
    <div id="webgl-root" aria-hidden="true" className="webgl-layer fixed inset-0 z-0">
      <Canvas
        ref={canvasRef}
        fallback={<p>The 3D scene is unavailable. Open the portfolio text view to explore the work.</p>}
        frameloop={isVisible && !isContentView && (!isCubeReady || isTransitioning || isSceneSettling || isCubeInteracting || (!isSceneObscured && (!isMobilePanel || phase === 2))) ? 'always' : 'never'}
        dpr={isLowEnd ? 1 : isMobile ? [1, 1.25] : [1, 1.5]}
        style={{ touchAction: 'none' }}
        gl={{
          antialias: !isLowEnd,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 45, near: 0.01, far: 500, position: [0, 0, 12] }}
        shadows={!useConservativeCanvas}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Experience

