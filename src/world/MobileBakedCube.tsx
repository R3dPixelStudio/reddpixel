import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshTransmissionMaterial, useCursor } from '@react-three/drei'
import {
  DataTexture,
  FrontSide,
  RGBAFormat,
  UnsignedByteType,
  MathUtils, 
  type Mesh,
  type MeshPhysicalMaterial,
} from 'three'
import { MODES, useExperience } from '../stores/useExperience'
import { goDeeper } from '../core/timeline/cinematicController'
import { worldState } from './worldState'
import { useCubeAdvance } from './useCubeAdvance'

const CUBE_SIZE = 2
const MOBILE_TRANSMISSION_SAMPLES = 4
const MOBILE_OROSI_CACHE_KEY = `mobile-orosi-transmission-v4-custom-fbo-s${MOBILE_TRANSMISSION_SAMPLES}`

type DreiTransmissionRef = React.ElementRef<typeof MeshTransmissionMaterial>

interface CompilableShader {
  vertexShader: string
  fragmentShader: string
}

function injectMobileOrosi(shader: CompilableShader) {
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
      float cellLead = 1.0 - smoothstep(0.0, 0.042, distanceGap);
      float uvEdge = min(
        min(currentUv.x, 1.0 - currentUv.x),
        min(currentUv.y, 1.0 - currentUv.y)
      );
      float frameLead = 1.0 - smoothstep(0.0, 0.015, uvEdge);
      float lead = max(cellLead, frameLead);

      vec3 normalTilt = vec3(
        (localUv - closestCenter) * (1.0 - lead) * 0.55,
        0.0
      );

      return MobileOrosi(glassColor * 1.20, lead, normalTilt);
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
       diffuseColor.rgb = mix(orosi.color, vec3(0.05), orosi.lead);`
    )
    .replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
       roughnessFactor = mix(0.012, 0.84, orosi.lead);`
    )
    .replace(
      '#include <metalnessmap_fragment>',
      `#include <metalnessmap_fragment>
       metalnessFactor = mix(0.06, 0.95, orosi.lead);`
    )
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       totalEmissiveRadiance += orosi.color * (1.0 - orosi.lead) * 0.055;`
    )

  shader.fragmentShader = shader.fragmentShader.replace(
    /material\.transmission\s*=\s*_transmission\s*;/,
    'material.transmission = _transmission * (1.0 - orosi.lead);'
  )
}

interface ActiveMobileBakedCubeProps {
  currentPhase: number
  isActive: boolean
  mode: string
}

const ActiveMobileBakedCube: React.FC<ActiveMobileBakedCubeProps> = ({ currentPhase, isActive, mode }) => {
  const shellRef = useRef<Mesh>(null)
  const materialRef = useRef<DreiTransmissionRef>(null)
  
  // THE PARALLAX CHARM: Store the offset outside of React's render cycle!
  const parallaxOffset = useRef({ x: 0, y: 0 })
  
  const [hovered, setHovered] = useState(false)
  const [inertBuffer] = useState(() => {
    const texture = new DataTexture(
      new Uint8Array([0, 0, 0, 255]),
      1,
      1,
      RGBAFormat,
      UnsignedByteType,
    )
    texture.needsUpdate = true
    return texture
  })
  const viewportWidth = useThree((state) => state.size.width)
  const { onPointerDown } = useCubeAdvance(goDeeper, currentPhase === 0)

  const transmissionResolution = viewportWidth <= 360 ? 256 : viewportWidth <= 520 ? 256 : 320
  const backsideResolution = Math.floor(transmissionResolution / 2)

  useCursor(hovered && isActive && currentPhase === 0, 'pointer', 'auto')

  useEffect(() => {
    return () => inertBuffer.dispose()
  }, [inertBuffer])

  useLayoutEffect(() => {
    const material = materialRef.current as unknown as MeshPhysicalMaterial | null
    if (!material) return

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

  useFrame((state, delta) => {
    if (!isActive) return
    const shell = shellRef.current
    if (!shell) return

    // THE PARALLAX CHARM: Logic applied safely within the render loop
    if (currentPhase === 1 && mode === MODES.EXPLORE) {
      // state.pointer holds normalized touch coordinates (-1 to 1).
      // We multiply by 0.35 to keep the tilt subtle and elegant.
      parallaxOffset.current.x = MathUtils.lerp(parallaxOffset.current.x, state.pointer.x * 0.35, delta * 4)
      parallaxOffset.current.y = MathUtils.lerp(parallaxOffset.current.y, state.pointer.y * 0.35, delta * 4)
    } else {
      // If we leave the phase or mode, gently return the offset to zero
      parallaxOffset.current.x = MathUtils.lerp(parallaxOffset.current.x, 0, delta * 4)
      parallaxOffset.current.y = MathUtils.lerp(parallaxOffset.current.y, 0, delta * 4)
    }

    // Combine GSAP's strict timeline rotations with our dynamic touch offsets!
    // Notice how pointer Y affects rotation X, and pointer X affects rotation Y.
    shell.rotation.x = worldState.cubeRotX + parallaxOffset.current.y
    shell.rotation.y = worldState.cubeRotY + parallaxOffset.current.x
    shell.rotation.z = worldState.cubeRotZ
  })

  return (
    <mesh
      ref={shellRef}
      visible={isActive}
      onPointerDown={onPointerDown}
      onPointerOver={(event) => {
        event.stopPropagation()
        if (currentPhase === 0) setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />

      <MeshTransmissionMaterial
        ref={materialRef}
        buffer={isActive ? undefined : inertBuffer}
        samples={MOBILE_TRANSMISSION_SAMPLES}
        resolution={transmissionResolution}
        backside={true}
        backsideResolution={backsideResolution}
        backsideThickness={0.8}
        transmissionSampler={false}
        transmission={1}
        thickness={1.5}
        roughness={0.01}
        ior={2.05}
        chromaticAberration={0}
        anisotropicBlur={0}
        distortion={0}
        temporalDistortion={0}
        clearcoat={1}
        clearcoatRoughness={0.05}
        side={FrontSide}
        depthWrite
        toneMapped
      />
    </mesh>
  )
}

const MobileBakedCube: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const mode = useExperience((state) => state.mode)
  const hasCompletedInteriorEntry = currentPhase === 2 && mode === MODES.EXPLORE
  const isActive = !hasCompletedInteriorEntry && currentPhase < 3

  // Pass the mode down to our active component so it knows when to tilt!
  return <ActiveMobileBakedCube currentPhase={currentPhase} isActive={isActive} mode={mode} />
}

export default MobileBakedCube