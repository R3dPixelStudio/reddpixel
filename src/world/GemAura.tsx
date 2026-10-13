import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, PlaneGeometry, ShaderMaterial, Mesh, Vector3 } from 'three'
import { outerSceneVisibility } from './outerScene'
import { worldState } from './worldState'
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

    float coreGlow = 1.0 - smoothstep(0.0, 1.0, dist);
    float haloGlow = 1.0 - smoothstep(0.2, 0.8, dist);

    vec3 deepRed = vec3(0.08, 0.0, 0.01);
    vec3 brightRed = vec3(0.4, 0.0, 0.05);

    vec3 finalColor = mix(deepRed, brightRed, haloGlow);
    finalColor += vec3(1.0, 0.1, 0.2) * rays * coreGlow * 0.28;

    float alpha = (coreGlow * 0.30 + rays * 0.10) * uLanding;

    gl_FragColor = vec4(finalColor, alpha);
}
`

const GemAura: React.FC = () => {
  const meshRef = useRef<Mesh>(null)
  const cameraDirection = useRef(new Vector3())

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

  useEffect(() => {

    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state) => {
    if (!meshRef.current) return
    const visibility = outerSceneVisibility(state.camera.position.z)
    meshRef.current.visible = visibility > .002
    if (visibility <= .002) return
    const mat = meshRef.current.material as ShaderMaterial
    mat.uniforms.uTime.value = useExperience.getState().reducedMotion ? 5 : state.clock.elapsedTime
    mat.uniforms.uLanding.value = visibility * (1 - worldState.aboutQuiet * .78)

    meshRef.current.quaternion.copy(state.camera.quaternion)
    cameraDirection.current.copy(state.camera.position).normalize().multiplyScalar(-4)
    meshRef.current.position.copy(cameraDirection.current)
  })

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      material={material} 
      raycast={() => null} 
    />
  )
}

export default GemAura
