import { useEffect, useMemo } from 'react'
import { MeshPhysicalMaterial, SphereGeometry, type BufferGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export default function GoldFrame() {
  const { geometry, material } = useMemo(() => {
    const pieces: BufferGeometry[] = []
    const rail = new RoundedBoxGeometry(2.018, .028, .028, 1, .006)
    // Four rails along each axis, fitted over the actual glass edges.
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      pieces.push(rail.clone().translate(0, a, b))
      pieces.push(rail.clone().rotateZ(Math.PI / 2).translate(a, 0, b))
      pieces.push(rail.clone().rotateY(Math.PI / 2).translate(a, b, 0))
    }
    rail.dispose()
    const corner = new SphereGeometry(.021, 8, 6)
    const joint = corner.toNonIndexed()
    corner.dispose()
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) pieces.push(joint.clone().translate(x, y, z))
    joint.dispose()
    const geometry = mergeGeometries(pieces, false)
    for (const piece of pieces) piece.dispose()
    if (!geometry) throw new Error('The gold frame geometry could not be assembled.')
    const material = new MeshPhysicalMaterial({ color: '#d4a34b', metalness: 1, roughness: .24, clearcoat: .35, clearcoatRoughness: .18, envMapIntensity: 1.1 })
    return { geometry, material }
  }, [])
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  // As a child of the glass mesh, the frame shares every drag and GSAP rotation.
  return <mesh name="cube-gold-frame" geometry={geometry} material={material} dispose={null} raycast={() => null} />
}
