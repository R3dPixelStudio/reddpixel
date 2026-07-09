import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, PlaneGeometry, ShaderMaterial, Mesh } from 'three'
import gsap from 'gsap'
import { useExperience } from '../stores/useExperience'

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform float uLanding;

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float dist = length(uv);

    float angle = atan(uv.y, uv.x);
    float rays = sin(angle * 6.0 + uTime * 0.2) * 0.5 + 0.5;
    rays *= sin(angle * 12.0 - uTime * 0.1) * 0.5 + 0.5;

    float coreGlow = smoothstep(1.0, 0.0, dist);
    float haloGlow = smoothstep(0.8, 0.2, dist);

    vec3 deepRed = vec3(0.08, 0.0, 0.01);
    vec3 brightRed = vec3(0.4, 0.0, 0.05);

    vec3 finalColor = mix(deepRed, brightRed, haloGlow);
    finalColor += vec3(1.0, 0.1, 0.2) * rays * coreGlow * 0.2;

    float alpha = (coreGlow * 0.6 + rays * 0.2) * uLanding;

    gl_FragColor = vec4(finalColor, alpha);
}
`

const GemAura: React.FC = () => {
  const meshRef = useRef<Mesh>(null)
  const currentPhase = useExperience((state) => state.currentPhase)
  const phaseDriver = useRef({ value: 1 })

  useEffect(() => {
    gsap.killTweensOf(phaseDriver.current)
    gsap.to(phaseDriver.current, {
      value: currentPhase === 0 ? 1 : 0,
      duration: 1.5,
      ease: 'power3.inOut'
    })
  }, [currentPhase])

  const { geometry, material } = useMemo(() => {
    const geo = new PlaneGeometry(18, 18) 
    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: { value: 0 }, uLanding: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    return { geometry: geo, material: mat }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as ShaderMaterial
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uLanding.value = phaseDriver.current.value

    meshRef.current.quaternion.copy(state.camera.quaternion)
    const cameraPos = state.camera.position.clone()
    const dir = cameraPos.normalize().multiplyScalar(-4) 
    meshRef.current.position.copy(dir)
  })

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      material={material} 
      raycast={() => null} 
      // THE MEMORY LEAK FIX: We hide the geometry instead of destroying it!
      visible={currentPhase < 2} 
    />
  )
}

export default GemAura