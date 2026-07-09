import React, { useMemo, useRef, useEffect } from 'react'
import { SphereGeometry, ShaderMaterial, BackSide, MathUtils, Vector2, Mesh } from 'three'
import { useFrame } from '@react-three/fiber'
import { useExperience, MODES } from '../stores/useExperience'


const InnerWorldEnvironment: React.FC = () => {
  const currentPhase = useExperience((state) => state.currentPhase)
  const mode = useExperience((state) => state.mode)
  const isLowEnd = useExperience((state) => state.isLowEnd)
  
  const envRef = useRef<Mesh>(null)
 

  // We hold our targets in refs, totally decoupling them from React's render flashes!
  const uOpacityTarget = useRef(0)
  const uTravelTarget = useRef(0)
  const uPanTarget = useRef(0)
  const prevPhaseRef = useRef(currentPhase)
  
  const uniforms = useRef({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uTravelOffset: { value: 0 }, 
      uPointer: { value: new Vector2(0, 0) },
      uExplorePan: { value: 0 }
  })

  useEffect(() => {
    if (currentPhase >= 2) {
       // Delay fade-in if coming from the outside
       if (prevPhaseRef.current < 2) setTimeout(() => { uOpacityTarget.current = 1.0 }, 1200)
       else uOpacityTarget.current = 1.0
       
       uTravelTarget.current = (currentPhase - 2) * (Math.PI / 2.0)
    } else {
       uOpacityTarget.current = 0.0
    }
    
    uPanTarget.current = (mode === MODES.EXPLORE && currentPhase >= 2) ? 0.3 : 0.0
    prevPhaseRef.current = currentPhase
  }, [currentPhase, mode])
      

  const { geometry, material } = useMemo(() => {
    // THE FIX: Mobile only gets 32x32 segments (approx 2000 triangles instead of 8000!)
    const geo = new SphereGeometry(30, isLowEnd ? 32 : 64, isLowEnd ? 32 : 64)
    
    const mat = new ShaderMaterial({
      uniforms: uniforms.current,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        #define PI 3.14159265
        #define HALF_PI 1.57079632

        uniform float uTime;
        uniform float uOpacity;
        uniform float uTravelOffset;
        uniform float uExplorePan;
        uniform vec2 uPointer;
        varying vec3 vWorldPos;

        vec2 hash2(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }

        vec3 getVitrail(vec2 localUv, float seed) {
            float symmetry = seed == 1.0 ? 8.0 : (seed == 2.0 ? 10.0 : (seed == 3.0 ? 12.0 : 6.0));
            float angle = atan(localUv.y, localUv.x);
            float radius = length(localUv);
            
            float segment = PI * 2.0 / symmetry;
            angle = abs(mod(angle, segment) - segment / 2.0);
            vec2 symUv = vec2(cos(angle), sin(angle)) * radius;

            vec2 gridUv = symUv * 3.5; vec2 gridP = floor(gridUv); vec2 gridF = fract(gridUv);

            // THE FIX: Mobile gets the true stained glass shader, but compiled with the 0-loop hack!
            ${isLowEnd ? `
              float shardSeed = fract(sin(dot(gridP + seed * 13.37, vec2(12.9898, 78.233))) * 43758.5453);
              float edgeDist = min(min(gridF.x, 1.0 - gridF.x), min(gridF.y, 1.0 - gridF.y));
            ` : `
              float minDist = 100.0; vec2 closestCell = vec2(0.0); vec2 closestCenter = vec2(0.0);
              for(int j=-1; j<=1; j++) for(int i=-1; i<=1; i++){
                  vec2 b = vec2(float(i), float(j)); vec2 h = hash2(gridP + b + seed * 13.37); vec2 center = b + h;
                  if(dot(center - gridF, center - gridF) < minDist){ minDist = dot(center - gridF, center - gridF); closestCell = gridP + b; closestCenter = center; }
              }
              float edgeDist = 100.0;
              for(int j=-2; j<=2; j++) for(int i=-2; i<=2; i++){
                  vec2 b = vec2(float(i), float(j)); vec2 h = hash2(gridP + b + seed * 13.37); vec2 center = b + h;
                  if(dot(center - closestCenter, center - closestCenter) > 0.00001) {
                      edgeDist = min(edgeDist, dot(0.5 * (closestCenter + center) - gridF, normalize(center - closestCenter)));
                  }
              }
              float shardSeed = fract(sin(dot(closestCell, vec2(12.9898, 78.233))) * 43758.5453);
            `}

            vec3 col = shardSeed < 0.60 ? vec3(0.9, 0.05, 0.1) : (shardSeed < 0.80 ? vec3(0.0, 0.3, 1.0) : vec3(1.0, 0.7, 0.0));                         
            col = mix(col, vec3(0.0), smoothstep(0.40, 0.0, edgeDist));
            return col;
        }

        void main() {
            vec3 p = normalize(vWorldPos);
            p.x -= uPointer.x * 0.15;
            p.y -= uPointer.y * 0.15;
            p = normalize(p);

            float theta = atan(p.z, p.x);
            float activeTheta = theta + uTravelOffset + uExplorePan + (PI * 10.0);
            float wallID = floor(mod(activeTheta + PI/4.0, 2.0 * PI) / HALF_PI);
            float localTheta = mod(activeTheta + PI/4.0, HALF_PI) - PI/4.0;

            float wallDist = 1.0 / cos(localTheta);
            vec2 wallUv = vec2(tan(localTheta), p.y * wallDist);

            float sunTime = (uTime + 5.0) * 0.2;
            float sunX = sin(sunTime) * 0.8;
            float sunY = cos(sunTime * 0.5) * 0.5;

            float shadowDepth = max(0.0, 1.0 - p.y); 
            vec2 projUv = wallUv;
            projUv.x -= sunX * shadowDepth * 0.3;
            projUv.y -= sunY * shadowDepth * 0.15;

            vec3 vitrailColor = getVitrail(projUv * 1.5, wallID);

            float distFromSun = length(wallUv - vec2(sunX, sunY * 0.5));
            float lightBeam = pow(smoothstep(2.0, 0.0, distFromSun), 1.5) * 3.0;

            vec3 finalShadow = vitrailColor * lightBeam;
            finalShadow += vitrailColor * smoothstep(3.0, 0.0, distFromSun) * 0.15;
            finalShadow *= (1.0 - smoothstep(0.65, 1.0, abs(localTheta) / (PI / 4.0)));
            finalShadow *= 1.0 - (uExplorePan * 1.5);

            gl_FragColor = vec4(finalShadow, uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false, 
      side: BackSide     
    })
    return { geometry: geo, material: mat }
  }, [isLowEnd]) 

  useFrame((state, delta) => {
    if (!envRef.current) return 
    
    uniforms.current.uOpacity.value = MathUtils.damp(uniforms.current.uOpacity.value, uOpacityTarget.current, 3, delta)
    uniforms.current.uTravelOffset.value = MathUtils.damp(uniforms.current.uTravelOffset.value, uTravelTarget.current, 2, delta)
    uniforms.current.uExplorePan.value = MathUtils.damp(uniforms.current.uExplorePan.value, uPanTarget.current, 3, delta)

    uniforms.current.uTime.value = state.clock.elapsedTime
    uniforms.current.uPointer.value.x = MathUtils.lerp(uniforms.current.uPointer.value.x, state.pointer.x, 0.05)
    uniforms.current.uPointer.value.y = MathUtils.lerp(uniforms.current.uPointer.value.y, state.pointer.y, 0.05)

    // THE CULLING SPELL:
    // If the opacity is practically zero, cut the mesh out of the render loop entirely!
    // Phase 0 and 1 will now sit at beautifully low triangle counts.
    envRef.current.visible = uniforms.current.uOpacity.value > 0.005;
  })

  return (
    // THE FIX: Removed the declarative 'visible' prop so our useFrame can control it mathematically!
    <mesh ref={envRef} geometry={geometry} material={material} raycast={() => null} />
  )
}
export default InnerWorldEnvironment