import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, ShaderMaterial, type Points } from 'three'
import { useExperience } from '../stores/useExperience'
import { FLOOR_Y, REFLECTION_LAYER, outerSceneVisibility } from './outerScene'
import { worldState } from './worldState'

const particleVertex = /* glsl */ `
attribute float aSeed;
attribute float aRibbon;
uniform float uTime;
uniform float uPixelRatio;
uniform float uFlow;
uniform float uRush;
uniform float uMobile;
varying float vGlow;
varying float vHot;
vec3 bezier(vec3 a,vec3 b,vec3 c,vec3 d,float t) {
  float s=1.-t;
  return s*s*s*a+3.*s*s*t*b+3.*s*t*t*c+t*t*t*d;
}
void main() {
  float t=fract(position.x+uTime*.021+uFlow);
  vec3 a=vec3(-2.8,-1.28,1.0);
  vec3 b=vec3(.0,-1.5,2.2);
  vec3 c=vec3(4.0,1.0,-1.0);
  vec3 d=vec3(.9,.9,-1.8);
  if (aRibbon>.5) {
    a=vec3(-1.5,-1.22,1.6);
    b=vec3(3.5,-.9,1.9);
    c=vec3(3.4,.85,-1.4);
    d=vec3(-.7,.85,-1.8);
  }
  vec3 p=bezier(a,b,c,d,t);
  float twist=t*12.56637+uTime*.18+aRibbon;
  float width=mix(.016,.024,uMobile);
  p.x+=(cos(twist)*position.y-sin(twist)*position.z)*width;
  p.y+=(sin(twist)*position.y+cos(twist)*position.z)*width;
  p.z+=position.z*width;
  p.y+=aRibbon*.055+sin(t*6.+uTime*.22+aRibbon)*.035;
  p.z+=aRibbon*.08;
  p.x*=mix(1.,.78,uMobile);
  p.z-=uRush*1.1*sin(t*3.14159);
  p.y+=uRush*.3*sin(t*6.28318);
  float packet=pow(.5+.5*sin(t*12.56637-uTime*1.25+aRibbon*.8),4.);
  vGlow=(.2+packet*.8)*(.55+aSeed*.45)*smoothstep(0.,.05,t)*(1.-smoothstep(.95,1.,t));
  vGlow*=1.+uRush*.85;
  vHot=step(.96,aSeed);
  vec4 view=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*view;
  gl_PointSize=clamp((11.+aSeed*10.+uMobile*6.)*uPixelRatio/max(1.,-view.z),1.15,3.4*uPixelRatio);
}`
const particleFragment = /* glsl */ `
uniform float uOpacity;
uniform float uMobile;
varying float vGlow;
varying float vHot;
void main() {
  vec2 p=gl_PointCoord*2.-1.;
  float glow=exp(-dot(p,p)*3.5)*(1.-smoothstep(.65,1.,length(p)));
  vec3 color=mix(vec3(1.,.018,.045),vec3(1.,.23,.065),vHot);
  gl_FragColor=vec4(color,glow*vGlow*uOpacity*mix(1.8,2.3,uMobile));
}`

export default function IntroStage() {
  const mobile=useExperience(state=>state.isMobile)
  const lowEnd=useExperience(state=>state.isLowEnd)
  const group=useRef<Group>(null)
  const particleMaterial=useRef<ShaderMaterial>(null)
  const particleUniforms=useMemo(()=>({uTime:{value:0},uFlow:{value:0},uRush:{value:0},uOpacity:{value:1},uPixelRatio:{value:1},uMobile:{value:0}}),[])
  const geometry=useMemo(()=>{
    const ribbons=mobile||lowEnd?2:3;
    const perRibbon=lowEnd?200:mobile?325:600;
    const count=ribbons*perRibbon;
    const positions=new Float32Array(count*3),seeds=new Float32Array(count),bands=new Float32Array(count);
    const hash=(i:number)=>{const v=Math.sin(i*12.9898+78.233)*43758.5453;return v-Math.floor(v)};
    for(let i=0;i<count;i++){
      const seed=hash(i+1),angle=hash(i*2+17)*Math.PI*2,radius=Math.sqrt(seed);
      positions.set([((i%perRibbon)+seed*.35)/perRibbon,Math.cos(angle)*radius,Math.sin(angle)*radius],i*3);
      seeds[i]=seed;bands[i]=Math.floor(i/perRibbon);
    }
    const geometry=new BufferGeometry();
    geometry.setAttribute('position',new BufferAttribute(positions,3));
    geometry.setAttribute('aSeed',new BufferAttribute(seeds,1));
    geometry.setAttribute('aRibbon',new BufferAttribute(bands,1));
    return geometry;
  },[mobile,lowEnd])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  const reflectedPoints=useRef<Points>(null)
  useLayoutEffect(()=>{
    const points=reflectedPoints.current,material=particleMaterial.current
    if(!points||!material)return
    const placeholder=points.material
    if(placeholder!==material){
      if(Array.isArray(placeholder))placeholder.forEach(item=>item.dispose())
      else placeholder.dispose()
      points.material=material
    }
    points.layers.set(REFLECTION_LAYER)
    points.visible=true
    return ()=>material.dispose()
  },[])

  useFrame(({clock,gl,camera},delta)=>{
    const visibility=outerSceneVisibility(camera.position.z)
    if(group.current)group.current.visible=visibility>.002;
    if(visibility<=.002||!particleMaterial.current)return;
    const sparks=particleMaterial.current.uniforms;
    sparks.uTime.value=useExperience.getState().reducedMotion?0:clock.elapsedTime;
    sparks.uFlow.value=(sparks.uFlow.value+Math.min(delta,.05)*worldState.particleRush*.32)%1;
    sparks.uRush.value=worldState.particleRush;
    sparks.uOpacity.value=visibility*(1-worldState.aboutQuiet*.8);
    sparks.uPixelRatio.value=Math.min(gl.getPixelRatio(),1.5);
    sparks.uMobile.value=mobile?1:0;

  })

  return <group ref={group}>
    <points name="exterior-particles" geometry={geometry} dispose={null} renderOrder={3} raycast={()=>null} frustumCulled={false}>
      <shaderMaterial ref={particleMaterial} vertexShader={particleVertex} fragmentShader={particleFragment} uniforms={particleUniforms} transparent depthWrite={false} blending={AdditiveBlending}/>
    </points>
    <group position={[0,FLOOR_Y*2,0]} scale={[1,-1,1]}>
      <points ref={reflectedPoints} name="ground-particle-reflection" visible={false} geometry={geometry} dispose={null} renderOrder={1} raycast={()=>null} frustumCulled={false}/>
    </group>
  </group>
}
