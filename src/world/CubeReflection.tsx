import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, type BufferGeometry, type MeshPhysicalMaterial } from 'three'
import { cubeInteraction } from './cubeInteraction'
import { worldState } from './worldState'
import { FLOOR_Y, REFLECTION_LAYER, outerSceneVisibility } from './outerScene'
import GoldFrame from './GoldFrame'

export default function CubeReflection({ geometry, sourceMaterial }: { geometry: BufferGeometry; sourceMaterial: MeshPhysicalMaterial }) {
  const mesh = useRef<Mesh>(null)
  const material = useMemo(() => {
    const reflected = sourceMaterial.clone()
    // This copy is only rendered into the small ground buffer, never through glass.
    reflected.transmission = 0
    reflected.transparent = true
    reflected.depthWrite = true
    reflected.toneMapped = false
    reflected.onBeforeCompile = (shader, renderer) => {
      sourceMaterial.onBeforeCompile(shader, renderer)
      shader.vertexShader = 'varying vec3 vGroundCopyPos;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundCopyPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
      shader.fragmentShader = 'varying vec3 vGroundCopyPos;\n' + shader.fragmentShader.replace('void main() {', `void main() {
        vec3 groundRay = vGroundCopyPos - cameraPosition;
        float groundT = (${FLOOR_Y.toFixed(2)} - cameraPosition.y) / groundRay.y;
        vec2 groundPoint = (cameraPosition + groundRay * groundT).xz;
        if (groundPoint.y > 2.9 || length(groundPoint) > 5.5) discard;
      `)
      shader.fragmentShader = shader.fragmentShader.replace(/roughnessFactor = mix\(0\.0(?:45|4),/g, 'roughnessFactor = mix(0.2,')
    }
    reflected.customProgramCacheKey = () => sourceMaterial.customProgramCacheKey() + '-ground-copy-v2'
    return reflected
  }, [sourceMaterial])
  useLayoutEffect(() => { mesh.current?.traverse(object => object.layers.set(REFLECTION_LAYER)) }, [])
  useEffect(() => () => material.dispose(), [material])
  useFrame(({ camera }) => {
    if (!mesh.current) return
    const visibility = outerSceneVisibility(camera.position.z)
    mesh.current.visible = visibility > .002
    mesh.current.position.x = worldState.cubeX
    ;(mesh.current.material as MeshPhysicalMaterial).opacity = visibility
    mesh.current.rotation.set(worldState.cubeRotX + cubeInteraction.rotationX, worldState.cubeRotY + cubeInteraction.rotationY, worldState.cubeRotZ)
  })
  return <group position={[0, FLOOR_Y * 2, 0]} scale={[1,-1,1]}>
    <mesh ref={mesh} name="ground-cube-reflection" geometry={geometry} material={material} dispose={null} renderOrder={0} raycast={() => null}><GoldFrame /></mesh>
  </group>
}
