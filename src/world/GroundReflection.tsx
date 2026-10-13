import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, LinearSRGBColorSpace, Vector2, WebGLRenderTarget, type Mesh, type ShaderMaterial } from 'three'
import { useExperience } from '../stores/useExperience'
import { FLOOR_Y, REFLECTION_LAYER, outerSceneVisibility } from './outerScene'
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
uniform sampler2D uReflection;
uniform vec2 uResolution;
uniform vec2 uTexel;
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
  float wetNoise = noise(p*.85 + vec2(1.2,4.8))*.7 + noise(p*2.7)*.3;
  float nearCube = exp(-pow((p.x-.3)*.55,2.) - pow((p.y-1.8)*.65,2.));
  float wet = max(smoothstep(.57,.76,wetNoise), nearCube*(.35+patches*.45));
  wet *= (1.-smoothstep(3.,5.5,length(p))) * (1.-smoothstep(1.6,2.9,p.y));
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 blur = uTexel * (2.2 + patches*1.4);
  vec3 reflection = texture2D(uReflection, uv).rgb * .28;
  reflection += texture2D(uReflection, uv + vec2(blur.x,0.)).rgb * .18;
  reflection += texture2D(uReflection, uv - vec2(blur.x,0.)).rgb * .18;
  reflection += texture2D(uReflection, uv + vec2(0.,blur.y)).rgb * .18;
  reflection += texture2D(uReflection, uv - vec2(0.,blur.y)).rgb * .18;
  float edge = 1.-smoothstep(6.,13.,length(p));
  gl_FragColor = vec4((concrete + reflection*wet*.38)*edge, uOpacity*edge);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

// One small buffer for opaque mirrored artwork and particles; no glass or aura capture.
export default function GroundReflection() {
  const conservative = useExperience(state => state.isMobile || state.isLowEnd)
  const { size } = useThree()
  const material = useRef<ShaderMaterial>(null)
  const floor = useRef<Mesh>(null)
  const clearColor = useRef(new Color())
  const frame = useRef(0)
  const target = useMemo(() => {
    const height = conservative ? 180 : 288
    const buffer = new WebGLRenderTarget(Math.min(640, Math.max(96, Math.round(height * size.width / size.height))), height)
    buffer.texture.colorSpace = LinearSRGBColorSpace
    return buffer
  }, [conservative, size.width, size.height])
  useEffect(() => () => target.dispose(), [target])
  const uniforms = useMemo(() => ({
    uReflection: { value: target.texture },
    uResolution: { value: new Vector2() },
    uTexel: { value: new Vector2(1 / target.width, 1 / target.height) },
    uOpacity: { value: 1 },
  }), [target])

  useFrame(({ gl, camera, scene }) => {
    if (!material.current) return
    const opacity = outerSceneVisibility(camera.position.z) * (1 - worldState.aboutQuiet)
    if (floor.current) floor.current.visible = opacity > .002
    material.current.uniforms.uOpacity.value = opacity
    gl.getDrawingBufferSize(material.current.uniforms.uResolution.value)
    if (opacity < .002 || worldState.aboutQuiet > .99) return
    // Half-rate capture on phones, full-rate during navigation and gestures.
    if (conservative && !useExperience.getState().isTransitioning && !useExperience.getState().isCubeInteracting && ++frame.current % 2) return
    const previousTarget = gl.getRenderTarget()
    const previousMask = camera.layers.mask
    const previousBackground = scene.background
    const previousAlpha = gl.getClearAlpha()
    const previousAutoClear = gl.autoClear
    gl.getClearColor(clearColor.current)
    try {
      scene.background = null
      camera.layers.set(REFLECTION_LAYER)
      gl.autoClear = true
      gl.setRenderTarget(target)
      gl.setClearColor(0x000000, 0)
      gl.render(scene, camera)
    } finally {
      gl.setRenderTarget(previousTarget)
      gl.setClearColor(clearColor.current, previousAlpha)
      gl.autoClear = previousAutoClear
      camera.layers.mask = previousMask
      scene.background = previousBackground
    }
  })

  return <mesh ref={floor} name="wet-concrete-floor" position={[0, FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} raycast={() => null}>
    <planeGeometry args={[30, 30]} />
    <shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} />
  </mesh>
}
