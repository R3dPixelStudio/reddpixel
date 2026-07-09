import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, useEnvironment, useGLTF } from '@react-three/drei' 
import { useExperience } from '../stores/useExperience'
import { goDeeper } from '../core/timeline/cinematicController'
import { worldState } from './worldState'
import { Mesh, DoubleSide } from 'three'

const MobileBakedCube: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const shellRef = useRef<Mesh>(null)
  const setCubeReady = useExperience((state) => state.setCubeReady)
  const { nodes } = useGLTF('/models/mobile_glass_box.glb') as any

  const [colorMap, normalMap, roughnessMap, metalnessMap] = useTexture([
    '/textures/atlas_color.jpg',
    '/textures/atlas_normal.png', 
    '/textures/atlas_roughness.jpg',
    '/textures/atlas_melatic.jpg'
  ])

  colorMap.flipY = false; normalMap.flipY = false; roughnessMap.flipY = false; metalnessMap.flipY = false;
  
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCubeReady()
      })
    })
  }, [setCubeReady])
  //const envMap = useEnvironment({ preset: 'city' }) 
  const envMap = useEnvironment({ files: '/textures/hdrenv.hdr' })
  // Adding weightless floating and slow rotation!
  useFrame((state) => {
    if (shellRef.current) {
      // Base rotations from the cinematic GSAP controller
      shellRef.current.rotation.x = worldState.cubeRotX
      shellRef.current.rotation.z = worldState.cubeRotZ
      
      // Combine GSAP rotation with a slow, constant time-based spin!
      shellRef.current.rotation.y = worldState.cubeRotY + state.clock.elapsedTime * 0.04
      
      // Gentle floating up and down (bobbing effect)
      if (currentPhase < 3) {
         shellRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.04
      }
    }
  })
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCubeReady()
      })
    })
  }, [setCubeReady])

  return (
    <mesh
      ref={shellRef}
      visible={currentPhase < 3}
      geometry={nodes.geo1.geometry} 
      onClick={(e) => { e.stopPropagation(); if (currentPhase === 0) { document.body.style.cursor = 'auto'; goDeeper(); } }}
      onPointerOver={() => { if (currentPhase === 0) document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}
    >
      <meshStandardMaterial 
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        metalnessMap={metalnessMap}
        normalScale={[0.6, 0.6]} 
        envMap={envMap}
        envMapIntensity={0.8}    
        transparent={true}
        opacity={0.85}           
        color="#8a8a8a"          
        side={DoubleSide}
      />
    </mesh>
  )
}

useGLTF.preload('/models/mobile_glass_box.glb')
export default MobileBakedCube