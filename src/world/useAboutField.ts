import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { aboutComposition, aboutSourceAnchor } from './aboutComposition'

export function createAboutField(mobile: boolean, width: number, height: number) {
  const pose = aboutComposition(mobile)
  const camera = new PerspectiveCamera(38, Math.max(1, width) / Math.max(1, height), .01, 500)
  camera.position.set(pose.cameraX, pose.cameraY, pose.cameraZ)
  camera.lookAt(pose.targetX, pose.targetY, pose.targetZ)
  camera.updateMatrixWorld()
  const source = new Vector3(), leftB = new Vector3(), leftC = new Vector3(), leftD = new Vector3()
  const rightB = new Vector3(), rightC = new Vector3(), rightD = new Vector3(), aura = new Vector3()
  const ray = new Vector3()
  let revision = -1
  const project = (output: Vector3, x: number, y: number) => {
    ray.set(x, y, .5).unproject(camera).sub(camera.position)
    output.copy(camera.position).addScaledVector(ray, -camera.position.z / ray.z)
  }
  const sync = () => {
    if (revision === aboutSourceAnchor.revision) return false
    revision = aboutSourceAnchor.revision
    const { left, right, top, bottom } = aboutSourceAnchor
    project(source, left, top)
    project(leftB, left - .16, top - .16)
    project(leftC, left - .2, bottom - .08)
    project(leftD, (left + right) * .35, bottom - .015)
    project(rightB, .2, top + .18)
    project(rightC, right + .2, top - .15)
    project(rightD, right + .04, bottom + .3)
    // Place the glow behind the emitter, along the same camera ray.
    ray.copy(source).sub(camera.position).normalize()
    aura.copy(source).addScaledVector(ray, 3.5)
    return true
  }
  sync()
  return { source, leftB, leftC, leftD, rightB, rightC, rightD, aura, sync }
}

export function useAboutField(mobile: boolean) {
  const size = useThree(state => state.size)
  return useMemo(() => createAboutField(mobile, size.width, size.height), [mobile, size.width, size.height])
}
