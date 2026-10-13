import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { type Mesh, type ShaderMaterial } from 'three'
import { FLOOR_Y, outerSceneVisibility } from './outerScene'
import { worldState } from './worldState'

const vertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`
const fragment = /* glsl */ `
varying vec3 vWorld;
uniform float uOpacity;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1.,0.)), f.x), mix(hash(i + vec2(0.,1.)), hash(i + 1.), f.x), f.y);
}
void main() {
  vec2 p = vWorld.xz;
  float grain = noise(p * 45.);
  float patches = noise(p * 2.4);
  vec3 concrete = vec3(.0035,.0032,.0032) * (.5 + patches*.4 + grain*.3);
  float edge = 1.-smoothstep(6.,13.,length(p));
  gl_FragColor = vec4(concrete*edge, uOpacity*edge);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

export default function ConcreteFloor() {
  const material = useRef<ShaderMaterial>(null)
  const floor = useRef<Mesh>(null)
  const uniforms = useMemo(() => ({ uOpacity: { value: 1 } }), [])
  useFrame(({ camera }) => {
    const opacity = outerSceneVisibility(camera.position.z) * (1 - worldState.aboutFocus)
    if (floor.current) floor.current.visible = opacity > .002
    if (material.current) material.current.uniforms.uOpacity.value = opacity
  })
  return <mesh ref={floor} name="concrete-floor" position={[0, FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} raycast={() => null}>
    <planeGeometry args={[30, 30]} />
    <shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} />
  </mesh>
}
