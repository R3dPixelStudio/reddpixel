import React, { useLayoutEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshTransmissionMaterial, useCursor } from '@react-three/drei'
import { DoubleSide, type Mesh, type MeshPhysicalMaterial } from 'three'
import { useExperience } from '../stores/useExperience'
import { goDeeper } from '../core/timeline/cinematicController'
import { worldState } from './worldState'
import { useCubeAdvance } from './useCubeAdvance'

const CUBE_SIZE = 2
const MOBILE_TRANSMISSION_SAMPLES = 2
const MOBILE_OROSI_CACHE_KEY = `mobile-orosi-transmission-v3-s${MOBILE_TRANSMISSION_SAMPLES}`

// Drei exposes the ref as an R3F element type, while the runtime object is its
// MeshPhysicalMaterial subclass. Keep that mismatch isolated at this boundary.
type DreiTransmissionRef = React.ElementRef<typeof MeshTransmissionMaterial>

/**
 * Injects the desktop Orosi language into Drei's transmission shader.
 *
 * Desktop uses two 3x3 Voronoi searches. Mobile preserves the face seeds,
 * eight-way fold, organic cell centres, palette and border, but finds the two
 * nearest cells in one 3x3 pass. This halves the pattern's hash work while
 * keeping irregular stained-glass pieces instead of square grid cells.
 */
function injectMobileOrosi(shader: any) {
  shader.vertexShader = `
    varying vec3 vOrosiLocalNormal;
    varying vec2 vOrosiUv;
    ${shader.vertexShader}
  `.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
     vOrosiLocalNormal = normal;
     vOrosiUv = uv;`
  )

  shader.fragmentShader = `
    varying vec3 vOrosiLocalNormal;
    varying vec2 vOrosiUv;

    vec2 orosiHash2(vec2 p) {
      vec2 q = vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3))
      );
      return fract(sin(q) * 4375.85453);
    }

    struct MobileOrosi {
      vec3 color;
      float lead;
      vec3 normalTilt;
    };

    MobileOrosi getMobileOrosi(vec3 localNormal, vec2 currentUv) {
      vec3 absNorm = abs(localNormal);
      float faceSeed = absNorm.x > 0.5
        ? (localNormal.x > 0.0 ? 1.1 : 1.2)
        : (absNorm.y > 0.5
          ? (localNormal.y > 0.0 ? 3.3 : 1.4)
          : (localNormal.z > 0.0 ? 1.5 : 8.6));

      vec2 centeredUv = currentUv - 0.5;
      float angle = atan(centeredUv.y, centeredUv.x) + faceSeed * 1.5;
      float radius = length(centeredUv) - 0.1;
      float segment = 6.28318530 / 8.0;
      angle = abs(mod(angle, segment) - segment * 0.5);

      vec2 symUv = vec2(cos(angle), sin(angle)) * radius;
      vec2 gridUv = symUv * 10.0;
      vec2 cell = floor(gridUv);
      vec2 localUv = fract(gridUv);

      float closestDist = 100.0;
      float secondDist = 100.0;
      vec2 closestCell = vec2(0.0);
      vec2 closestCenter = vec2(0.0);

      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbour = vec2(float(x), float(y));
          vec2 center = neighbour + orosiHash2(cell + neighbour + faceSeed * 23.37);
          float distanceToCell = dot(center - localUv, center - localUv);

          if (distanceToCell < closestDist) {
            secondDist = closestDist;
            closestDist = distanceToCell;
            closestCell = cell + neighbour;
            closestCenter = center;
          } else if (distanceToCell < secondDist) {
            secondDist = distanceToCell;
          }
        }
      }

      float shardSeed = fract(
        sin(dot(closestCell, vec2(12.9898, 78.233))) * 4375.85453
      );

      vec3 glassColor =
        (shardSeed < 0.05) ? vec3(0.0, 0.81, 0.90) :
        (shardSeed < 0.15) ? vec3(1.0, 0.4, 0.0) :
        (shardSeed < 0.20) ? vec3(1.0, 0.02, 0.05) :
        (shardSeed < 0.30) ? vec3(0.0, 0.6, 0.05) :
        (shardSeed < 0.55) ? vec3(0.4, 0.02, 0.05) :
        (shardSeed < 0.60) ? vec3(1.0, 0.0, 0.1) :
        (shardSeed < 0.70) ? vec3(1.0, 0.5, 0.4) :
        (shardSeed < 0.80) ? vec3(0.85, 0.0, 0.01) :
        (shardSeed < 0.95) ? vec3(1.0, 0.0, 0.0) :
                             vec3(0.0, 0.2, 0.8);

      float distanceGap = max(secondDist - closestDist, 0.0);
      float cellLead = 1.0 - smoothstep(0.0, 0.055, distanceGap);
      float uvEdge = min(
        min(currentUv.x, 1.0 - currentUv.x),
        min(currentUv.y, 1.0 - currentUv.y)
      );
      float frameLead = 1.0 - smoothstep(0.0, 0.018, uvEdge);
      float lead = max(cellLead, frameLead);

      vec3 normalTilt = vec3(
        (localUv - closestCenter) * (1.0 - lead) * 0.24,
        0.0
      );

      return MobileOrosi(glassColor * 1.15, lead, normalTilt);
    }

    ${shader.fragmentShader}
  `.replace(
    'void main() {',
    'void main() { MobileOrosi orosi = getMobileOrosi(vOrosiLocalNormal, vOrosiUv);'
  )

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <normal_fragment_begin>',
      `#include <normal_fragment_begin>
       normal = normalize(normal + orosi.normalTilt);`
    )
    .replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       diffuseColor.rgb = mix(orosi.color, vec3(0.025), orosi.lead);`
    )
    .replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
       roughnessFactor = mix(0.035, 0.72, orosi.lead);`
    )
    .replace(
      '#include <metalnessmap_fragment>',
      `#include <metalnessmap_fragment>
       metalnessFactor = mix(0.02, 0.82, orosi.lead);`
    )
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       totalEmissiveRadiance += orosi.color * (1.0 - orosi.lead) * 0.055;`
    )

  // The dark lead remains opaque without needing a second mesh/draw call.
  shader.fragmentShader = shader.fragmentShader.replace(
    /material\.transmission\s*=\s*_transmission\s*;/,
    'material.transmission = _transmission * (1.0 - orosi.lead);'
  )
}

const ActiveMobileBakedCube: React.FC<{ currentPhase: number }> = ({ currentPhase }) => {
  const shellRef = useRef<Mesh>(null)
  const materialRef = useRef<DreiTransmissionRef>(null)
  const [hovered, setHovered] = useState(false)
  const viewportWidth = useThree((state) => state.size.width)
  const { onPointerDown } = useCubeAdvance(goDeeper, currentPhase === 0)

  const transmissionResolution = viewportWidth <= 480 ? 128 : 256

  useCursor(hovered && currentPhase === 0, 'pointer', 'auto')

  useLayoutEffect(() => {
    const material = materialRef.current as unknown as MeshPhysicalMaterial | null
    if (!material) return

    // Preserve Drei's transmission compiler and inject Orosi after it.
    const compileTransmission = material.onBeforeCompile
    const previousCacheKey = material.customProgramCacheKey

    material.onBeforeCompile = (shader, renderer) => {
      compileTransmission.call(material, shader, renderer)
      injectMobileOrosi(shader)
    }
    material.customProgramCacheKey = () => MOBILE_OROSI_CACHE_KEY
    material.needsUpdate = true

    return () => {
      material.onBeforeCompile = compileTransmission
      material.customProgramCacheKey = previousCacheKey
    }
  }, [])

  useFrame((state) => {
    const shell = shellRef.current
    if (!shell) return

    const elapsed = state.clock.elapsedTime
    shell.rotation.x = worldState.cubeRotX
    shell.rotation.y = worldState.cubeRotY + elapsed * 0.04
    shell.rotation.z = worldState.cubeRotZ
    shell.position.y = Math.sin(elapsed * 1.5) * 0.04
  })

  return (
    <mesh
      ref={shellRef}
      onPointerDown={onPointerDown}
      onPointerOver={(event) => {
        event.stopPropagation()
        if (currentPhase === 0) setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Native BoxGeometry: six faces, each with clean local 0-1 UVs. */}
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />

      <MeshTransmissionMaterial
        ref={materialRef}
        samples={MOBILE_TRANSMISSION_SAMPLES}
        resolution={transmissionResolution}
        backside={true}
        backsideResolution={1}
        transmissionSampler={false}
        transmission={0.94}
        thickness={0.72}
        roughness={0.035}
        ior={1.48}
        chromaticAberration={0}
        anisotropicBlur={0}
        distortion={0}
        temporalDistortion={0}
        clearcoat={0.75}
        clearcoatRoughness={0.12}
        side={DoubleSide}
        depthWrite
        toneMapped
      />
    </mesh>
  )
}

const MobileBakedCube: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)

  // This unmounts Drei's refraction FBO and its frame subscription.
  if (currentPhase >= 3) return null

  return <ActiveMobileBakedCube currentPhase={currentPhase} />
}

export default MobileBakedCube