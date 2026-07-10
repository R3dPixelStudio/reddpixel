import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, useEnvironment, useGLTF } from '@react-three/drei' 
import { useExperience } from '../stores/useExperience'
import { goDeeper } from '../core/timeline/cinematicController'
import { worldState } from './worldState'
import { Mesh, DoubleSide } from 'three'

const MobileBakedCube: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const shellRef = useRef<Mesh>(null)
  const { nodes } = useGLTF('/models/mobile_glass_box.glb') as any

  const [colorMap, normalMap, roughnessMap, metalnessMap] = useTexture([
    '/textures/rangiAtlas_color.jpg',
    '/textures/rangiAtlas_normal.png', 
    '/textures/rangiAtlas_roughness.jpg',
    '/textures/rangiAtlas_metallic.jpg'
  ])

  colorMap.flipY = false; normalMap.flipY = false; roughnessMap.flipY = false; metalnessMap.flipY = false;
  
  const envMap = useEnvironment({ files: '/textures/hdrenv.hdr' })
  
  // THE FIX: Early return stops Mobile CPU from choking on invisible math
  useFrame((state) => {
    // Stop processing matrix transforms if the cube is vanished!
    if (currentPhase >= 3) return;

    if (shellRef.current) {
      shellRef.current.rotation.x = worldState.cubeRotX
      shellRef.current.rotation.z = worldState.cubeRotZ
      shellRef.current.rotation.y = worldState.cubeRotY + state.clock.elapsedTime * 0.04
      
      shellRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.04
    }
  })

  return (
    <mesh
      ref={shellRef}
      visible={currentPhase < 3}
      geometry={nodes.geo1.geometry} 
      onPointerUp={(e) => { 
        e.stopPropagation(); 
        if (currentPhase === 0) { 
          document.body.style.cursor = 'auto'; 
          goDeeper(); 
        } 
      }}
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