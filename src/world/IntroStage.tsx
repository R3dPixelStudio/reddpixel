import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Euler, Group, MathUtils, Matrix3, Matrix4, ShaderMaterial } from 'three'
import { useExperience } from '../stores/useExperience'
import { cubeInteraction } from './cubeInteraction'
import { worldState } from './worldState'

const floorVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`
const floorFragment = /* glsl */ `
varying vec3 vWorld;
uniform float uOpacity;
uniform mat3 uCubeInverse;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.,0.)), f.x), mix(hash(i + vec2(0.,1.)), hash(i + 1.), f.x), f.y);
}
// Diffuse analytic reflection, with no second glass render or framebuffer.
vec3 reflection(vec3 origin, vec3 direction) {
  vec3 ro = uCubeInverse * origin, rd = uCubeInverse * direction;
  vec3 safeDirection = mix(vec3(-1.), vec3(1.), step(vec3(0.), rd)) * max(abs(rd), vec3(.0001));
  vec3 a = (-vec3(1.) - ro) / safeDirection, b = (vec3(1.) - ro) / safeDirection;
  vec3 nearT = min(a,b), farT = max(a,b);
  float t = max(max(nearT.x, nearT.y), nearT.z);
  float end = min(min(farT.x, farT.y), farT.z);
  if (end < max(t, 0.)) return vec3(0.);
  vec3 hit = ro + rd * t;
  vec3 face = abs(hit);
  vec2 uv = face.x > face.y && face.x > face.z ? hit.yz : (face.y > face.z ? hit.xz : hit.xy);
  float r = length(uv), angle = atan(uv.y, uv.x);
  float petal = r + .045 * cos(angle * 8.);
  vec3 glass = vec3(.48,.007,.012);
  glass = mix(glass, vec3(.008,.13,.14), (1.-smoothstep(.65,.77,petal))*smoothstep(.36,.45,petal));
  glass = mix(glass, vec3(.65,.13,.009), 1.-smoothstep(.22,.34,petal));
  float lead = smoothstep(.02,.11,abs(sin(uv.x*15.) * sin(uv.y*15.)));
  float rim = smoothstep(.92,1.,max(abs(uv.x),abs(uv.y)));
  return (glass * mix(.8,1.,lead) + vec3(.45,.11,.04)*rim) * smoothstep(0.,.35,end-max(t,0.));
}
void main() {
  vec2 p = vWorld.xz;
  float grain = noise(p * 32.);
  float patches = noise(p * 2.4);
  float scratches = pow(noise(p * vec2(2.,190.)), 9.);
  vec3 ray = reflect(normalize(vWorld-cameraPosition), vec3(0.,1.,0.));
  ray.xz += (vec2(noise(p*2.),noise(p*2.+31.))-.5) * .02;
  vec3 reflected = reflection(vWorld, normalize(ray + vec3(.07,0.,.08)));
  reflected += reflection(vWorld, normalize(ray - vec3(.07,0.,.08)));
  reflected *= .016 * (.65 + grain*.35) * exp(-max(0., length(p)-1.1)*1.4);
  float pool = exp(-dot(p*vec2(.43,.36),p*vec2(.43,.36)));
  
  
  vec3 ground = vec3(.006,.005,.005) * (.45+patches*.55);
  ground += vec3(.014,.0003,.0008) * pool * (grain*.3+patches*.5+scratches*.5);
  
  float edge = 1.-smoothstep(6.,13.,length(p));
  gl_FragColor = vec4((ground+reflected)*edge, uOpacity*edge);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
const particleVertex = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uPixelRatio;
varying float vGlow;
void main() {
  vec3 p = position;
  p.x += sin(uTime*.16 + aSeed*31.)*.18;
  p.y += sin(uTime*.3 + aSeed*19.)*.13;
  vGlow = .35 + .65 * pow(.5 + .5 * sin(uTime*.65 + aSeed*41.), 2.);
  vec4 view = modelViewMatrix * vec4(p,1.);
  gl_Position = projectionMatrix * view;
  gl_PointSize = clamp((20.+aSeed*24.) * uPixelRatio / max(1.,-view.z), 1., 7.*uPixelRatio);
}`
const particleFragment = /* glsl */ `
uniform float uOpacity;
varying float vGlow;
void main() {
  vec2 p = gl_PointCoord*2.-1.;
  float glow = exp(-dot(p,p)*4.5) * (1.-smoothstep(.65,1.,length(p)));
  gl_FragColor = vec4(1.,.018,.04,glow*vGlow*uOpacity*.85);
}`

export default function IntroStage() {
  const mobile = useExperience(state => state.isMobile || state.isLowEnd)
  const group = useRef<Group>(null)
  const floorMaterial = useRef<ShaderMaterial>(null)
  const particleMaterial = useRef<ShaderMaterial>(null)
  const opacity = useRef(1)
  const transforms = useMemo(() => ({ euler: new Euler(), matrix: new Matrix4() }), [])
  const floorUniforms = useMemo(() => ({ uOpacity: { value: 1 }, uCubeInverse: { value: new Matrix3() } }), [])
  const particles = useMemo(() => {
    const count = mobile ? 38 : 72
    const positions = new Float32Array(count * 3), seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const seed = ((i * 73 + 19) % 101) / 101
      const angle = i * 2.39996, radius = .8 + seed * 2.8
      positions.set([Math.cos(angle)*radius, -1.65+seed*1.2, Math.sin(angle)*radius*.65], i*3)
      seeds[i] = seed
    }
    return { positions, seeds }
  }, [mobile])
  const particleUniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 1 }, uPixelRatio: { value: 1 } }), [])
  useFrame(({ clock, gl }, delta) => {
    const { currentPhase, reducedMotion } = useExperience.getState()
    const target = currentPhase === 0 ? 1 : 0
    opacity.current = reducedMotion ? target : MathUtils.damp(opacity.current, target, 3.5, Math.min(delta,.1))
    if (group.current) group.current.visible = opacity.current > .002 && currentPhase < 2
    if (opacity.current <= .002 || currentPhase >= 2 || !floorMaterial.current || !particleMaterial.current) return
    const floor = floorMaterial.current.uniforms
    const sparks = particleMaterial.current.uniforms
    floor.uOpacity.value = opacity.current
    transforms.euler.set(worldState.cubeRotX + cubeInteraction.rotationX, worldState.cubeRotY + cubeInteraction.rotationY, worldState.cubeRotZ)
    transforms.matrix.makeRotationFromEuler(transforms.euler)
    floor.uCubeInverse.value.setFromMatrix4(transforms.matrix).transpose()
    sparks.uTime.value = reducedMotion ? 0 : clock.elapsedTime
    sparks.uOpacity.value = opacity.current
    sparks.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.5)
  })
  return <group ref={group}>
    <mesh position={[0,-1.82,0]} rotation={[-Math.PI/2,0,0]} raycast={() => null}>
      <planeGeometry args={[30,30]} />
      <shaderMaterial ref={floorMaterial} vertexShader={floorVertex} fragmentShader={floorFragment} uniforms={floorUniforms} transparent depthWrite={false} />
    </mesh>
    <points raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles.positions,3]} />
        <bufferAttribute attach="attributes-aSeed" args={[particles.seeds,1]} />
      </bufferGeometry>
      <shaderMaterial ref={particleMaterial} vertexShader={particleVertex} fragmentShader={particleFragment} uniforms={particleUniforms} transparent depthWrite={false} blending={AdditiveBlending} />
    </points>
  </group>
}


