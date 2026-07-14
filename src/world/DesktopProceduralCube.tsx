import React, { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, MeshPhysicalMaterial, DoubleSide, MeshDepthMaterial, RGBADepthPacking } from 'three'
import { useExperience } from '../stores/useExperience'
import { goDeeper } from '../core/timeline/cinematicController'
import { worldState } from './worldState'
import { useCubeAdvance } from './useCubeAdvance'

const CUBE_HALF = 1.0

interface Props {
  shellRef: React.RefObject<any>;
}

const DesktopProceduralCube: React.FC<Props> = ({ shellRef }) => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const { onPointerDown } = useCubeAdvance(goDeeper, currentPhase === 0)

  const { geometry, material, depthMaterial } = useMemo(() => {
    const geo = new BoxGeometry(CUBE_HALF * 2.0, CUBE_HALF * 2.0, CUBE_HALF * 2.0)

    const mat = new MeshPhysicalMaterial({
      color: 0xffffff, transmission: 1.0, opacity: 1.0, metalness: 0.1, roughness: 0.0,
      ior: 2.2, thickness: 1.5, clearcoat: 1.0, clearcoatRoughness: 0.05,
      side: DoubleSide, transparent: true, depthWrite: true       
    })

    mat.onBeforeCompile = (shader: any) => {
      shader.vertexShader = ` varying vec3 vLocalNormal; varying vec2 vMyUv;\n${shader.vertexShader}`.replace('#include <begin_vertex>', `#include <begin_vertex>\nvLocalNormal = normal; vMyUv = uv;`)
      shader.fragmentShader = `
        //  precision highp float;
         varying vec3 vLocalNormal; varying vec2 vMyUv;
         
         // THE FIX: Safe multiplier for Intel, but chaotic enough for perfect random colors!
         vec2 hash2(vec2 p) {
            vec2 q = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
            return fract(sin(q) * 4375.85453);
         }

         struct Vitrail { vec3 color; float lead; vec3 normalTilt; };

         Vitrail getOrosi(vec3 localNormal, vec2 currentUv) {
            vec3 absNorm = abs(localNormal);
            float faceSeed = absNorm.x > 0.5 ? (localNormal.x > 0.0 ? 1.1 : 1.2) : (absNorm.y > 0.5 ? (localNormal.y > 0.0 ? 3.3 : 1.4) : (localNormal.z > 0.0 ? 1.5 : 8.6));
            vec2 centeredUv = currentUv - 0.5; float angle = atan(centeredUv.y, centeredUv.x) + faceSeed * 1.5; float radius = length(centeredUv) - 0.1;
            float segment = 3.14159265 * 2.0 / 8.0; angle = abs(mod(angle, segment) - segment / 2.0); vec2 symUv = vec2(cos(angle), sin(angle)) * radius;
            vec2 gridUv = symUv * 10.0; vec2 p = floor(gridUv); vec2 f = fract(gridUv);
            
            float minDist = 100.0; vec2 closestCell = vec2(0.0); vec2 closestCenter = vec2(0.0);
            
            // Pass 1: Find Closest Cell
            for(int j=-1; j<=1; j++) {
              for(int i=-1; i<=1; i++) { 
                vec2 b = vec2(float(i), float(j)); vec2 h = hash2(p + b + faceSeed * 23.37); vec2 center = b + h; 
                float d = dot(center - f, center - f);
                if(d < minDist) { minDist = d; closestCell = p + b; closestCenter = center; } 
              }
            }
            
            float edgeDist = 100.0;
            for(int j=-1; j<=1; j++) {
              for(int i=-1; i<=1; i++) { 
                vec2 b = vec2(float(i), float(j)); vec2 h = hash2(p + b + faceSeed * 23.37); vec2 center = b + h; 
                vec2 diff = center - closestCenter;
                if(dot(diff, diff) > 0.00001) { 
                  edgeDist = min(edgeDist, dot(0.5 * (closestCenter + center) - f, normalize(diff))); 
                } 
              } 
            }
            
            // full color spectrum
            float shardSeed = fract(sin(dot(closestCell, vec2(12.9898, 78.233))) * 4375.85453);
            
            vec3 calculatedTilt = vec3((f - closestCenter) * smoothstep(0.2, 0.0, edgeDist) * 1.5 * mix(1.0, 2.5, step(radius, 0.15)), 0.0);
            
            // The colors 
            vec3 gColor = 
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
            
            
            float uvEdge = min(min(currentUv.x, 1.0 - currentUv.x), min(currentUv.y, 1.0 - currentUv.y));
            float customLead = max(smoothstep(0.03, 0.0, edgeDist), smoothstep(0.01, 0.00, uvEdge));
            
            return Vitrail(gColor * 1.2, customLead, calculatedTilt);
         }
         ${shader.fragmentShader}
      `.replace('void main() {', `void main() { Vitrail orosi = getOrosi(vLocalNormal, vMyUv);`)

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>\n if (orosi.lead < 0.5) normal = normalize(normal + orosi.normalTilt);`)
        .replace('#include <color_fragment>', `#include <color_fragment>\n diffuseColor.rgb = mix(orosi.color, vec3(0.05), orosi.lead);`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n roughnessFactor = mix(0.0, 0.9, orosi.lead);`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n metalnessFactor = mix(0.1, 1.0, orosi.lead);`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n if (!gl_FrontFacing) { vec3 coreLight = vec3(0.8, 0.7, 0.6); totalEmissiveRadiance += coreLight * orosi.color * (1.0 - orosi.lead); }`)
    }
    
    mat.customProgramCacheKey = () => 'vitrail_procedural_v3_main'

    const depthMat = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, side: DoubleSide })
    depthMat.onBeforeCompile = (shader: any) => {
      shader.vertexShader = `varying vec3 vLocalNormal; varying vec2 vMyUv;\n${shader.vertexShader}`.replace('#include <begin_vertex>', `#include <begin_vertex>\nvLocalNormal = normal;\nvMyUv = uv;`)
      shader.fragmentShader = `varying vec3 vLocalNormal; varying vec2 vMyUv;\n
      // THE FIX: Matching Intel-safe hash for the shadows
      vec2 hash2(vec2 p) {
        vec2 q = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(q) * 4375.85453);
      }\n${shader.fragmentShader}`.replace('void main() {', `void main() {
            vec3 absNorm = abs(vLocalNormal); float faceSeed = absNorm.x > 0.5 ? (vLocalNormal.x > 0.0 ? 1.1 : 1.2) : (absNorm.y > 0.5 ? (vLocalNormal.y > 0.0 ? 3.3 : 1.4) : (vLocalNormal.z > 0.0 ? 1.5 : 8.6));
            vec2 centeredUv = vMyUv - 0.5; float angle = atan(centeredUv.y, centeredUv.x) + faceSeed * 1.5; float radius = length(centeredUv) - 0.1;
            float segment = 3.14159265 * 2.0 / 8.0; angle = abs(mod(angle, segment) - segment / 2.0); vec2 symUv = vec2(cos(angle), sin(angle)) * radius;
            vec2 gridUv = symUv * 10.0; vec2 p = floor(gridUv); vec2 f = fract(gridUv);
            
            float minDist = 100.0; vec2 closestCenter = vec2(0.0);
            
            for(int j=-1; j<=1; j++) {
              for(int i=-1; i<=1; i++){ 
                vec2 b = vec2(float(i), float(j)); vec2 h = hash2(p + b + faceSeed * 13.37); vec2 center = b + h; 
                float d = dot(center - f, center - f); 
                if(d < minDist){ minDist = d; closestCenter = center; } 
              } 
            }
            
            float edgeDist = 100.0;
            
            for(int j=-1; j<=1; j++) {
              for(int i=-1; i<=1; i++){ 
                vec2 b = vec2(float(i), float(j)); vec2 h = hash2(p + b + faceSeed * 13.37); vec2 center = b + h; 
                vec2 diff = center - closestCenter; 
                if(dot(diff, diff) > 0.00001) { 
                  float d = dot(0.5 * (closestCenter + center) - f, normalize(diff)); edgeDist = min(edgeDist, d); 
                } 
              } 
            }
            
            float uvEdge = min(min(vMyUv.x, 1.0 - vMyUv.x), min(vMyUv.y, 1.0 - vMyUv.y));
            float customLead = max(smoothstep(0.03, 0.0, edgeDist), smoothstep(0.01, 0.0, uvEdge));
            if (customLead < 0.5) discard;
      `)
    }
    
    depthMat.customProgramCacheKey = () => 'vitrail_procedural_v3_depth'
    return { geometry: geo, material: mat, depthMaterial: depthMat }
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      depthMaterial.dispose();
    }
  }, [geometry, material, depthMaterial])

  useFrame(() => {
    if (currentPhase >= 3) return;

    if (shellRef.current) {
      shellRef.current.rotation.x = worldState.cubeRotX
      shellRef.current.rotation.y = worldState.cubeRotY
      shellRef.current.rotation.z = worldState.cubeRotZ
    }
  })

  return (
      <mesh 
        ref={shellRef}
        geometry={geometry} material={material} customDepthMaterial={depthMaterial} castShadow 
        visible={currentPhase < 3} 
        onPointerDown={onPointerDown}
        onPointerOver={() => { if (currentPhase === 0) document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'auto' }}
      />
  )
}

export default DesktopProceduralCube