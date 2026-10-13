import { useLayoutEffect, useRef } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AmbientLight, DirectionalLight, MathUtils } from 'three'
import { useExperience } from '../stores/useExperience'
import { REFLECTION_LAYER, outerSceneVisibility } from './outerScene'

export default function CubeLighting() {
  const conservative = useExperience(state => state.isMobile || state.isLowEnd)
  const ambient = useRef<AmbientLight>(null)
  const key = useRef<DirectionalLight>(null)
  useLayoutEffect(() => {
    ambient.current?.layers.enable(REFLECTION_LAYER)
    key.current?.layers.enable(REFLECTION_LAYER)
  }, [])
  useFrame(({ scene, camera }, delta) => {
    const state = useExperience.getState()
    const exterior = outerSceneVisibility(camera.position.z)
    const blend = state.reducedMotion ? 1 : 1 - Math.exp(-3 * Math.min(delta, .1))
    if (ambient.current) ambient.current.intensity = MathUtils.lerp(ambient.current.intensity, MathUtils.lerp(conservative ? 3.8 : 8.4, .8, exterior), blend)
    if (key.current) key.current.intensity = MathUtils.lerp(key.current.intensity, MathUtils.lerp(conservative ? 3.8 : 5.5, conservative ? 4.5 : 7, exterior), blend)
    scene.environmentIntensity = MathUtils.lerp(scene.environmentIntensity, MathUtils.lerp(.3, .9, exterior), blend)
  })
  return <>
    <ambientLight ref={ambient} intensity={.8} />
    <directionalLight ref={key} position={[4,6,8]} color="#ffe6d5" intensity={4.5} />
    {/* Capture these studio strips once. No live reflection camera or HDR download. */}
    <Environment frames={1} resolution={conservative ? 64 : 128} background={false}>
      <Lightformer position={[-3,3,4]} target={[0,0,0]} scale={[.6,5,1]} color="#fff1df" intensity={5} />
      <Lightformer position={[3,2,1]} target={[0,0,0]} scale={[1.2,5,1]} color="#ffe2bd" intensity={10} />
      <Lightformer position={[-2,1,-3]} target={[0,0,0]} scale={[2,3,1]} color="#ff1537" intensity={4} />
      <Lightformer position={[0,5,0]} target={[0,0,0]} scale={[4,.6,1]} color="#fff5ea" intensity={3} />
    </Environment>
  </>
}


