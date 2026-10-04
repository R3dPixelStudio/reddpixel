import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, unlink, rmdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import ts from 'typescript'
import gsap from 'gsap'

// Exercise the real controller and GSAP, advancing tweens deterministically without a GPU.
const root = fileURLToPath(new URL('../', import.meta.url))
const temporaryRoot = path.join(root, 'node_modules', '.tmp')
await mkdir(temporaryRoot, { recursive: true })
const temporary = await mkdtemp(path.join(temporaryRoot, 'navigation-'))
const files = []
let cleanup = () => {}
try {
  for (const [source, name] of [
    ['src/stores/useExperience.ts', 'store'],
    ['src/world/worldState.ts', 'world'],
    ['src/core/timeline/cinematicController.ts', 'controller'],
  ]) {
    const input = (await readFile(path.join(root, source), 'utf8'))
      .replace('../../stores/useExperience', './store.mjs')
      .replace('../../world/worldState', './world.mjs')
    const output = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } }).outputText
    const filename = path.join(temporary, `${name}.mjs`)
    await writeFile(filename, output)
    files.push(filename)
  }
  const controller = await import(pathToFileURL(path.join(temporary, 'controller.mjs')).href)
  const { useExperience: store, MODES } = await import(pathToFileURL(path.join(temporary, 'store.mjs')).href)
  const { worldState: world } = await import(pathToFileURL(path.join(temporary, 'world.mjs')).href)
  cleanup = controller.destroyCinematicController
  gsap.ticker.sleep()

  const reset = (mobile = false, reducedMotion = false) => {
    cleanup()
    store.setState({ currentPhase: 0, mode: MODES.LANDING, isTransitioning: false, isCubeReady: false, isMobile: mobile, reducedMotion })
    Object.assign(world, { cameraX: 0, cameraY: 1.5, cameraZ: 14, targetX: 0, targetY: 0, targetZ: 0, cubeRotX: 0, cubeRotY: 0, cubeRotZ: 0 })
  }
  const finishCamera = () => {
    // Camera completion may start About's separate explore rotation.
    for (let pass = 0; pass < 3; pass++) for (const tween of gsap.getTweensOf(world)) tween.progress(1)
  }
  const assertDestination = (phase, mobile = false) => {
    assert.equal(store.getState().currentPhase, phase)
    assert.equal(store.getState().isTransitioning, false, 'Traversal buttons must unlock')
    assert.equal(store.getState().mode, phase ? MODES.EXPLORE : MODES.LANDING, 'The destination UI must open')
    assert.equal(world.cameraZ, [14, mobile ? 8 : 4.5, -4, -8][phase])
    assert.equal(world.targetX, phase === 1 ? 1.5 : 0)
  }

  for (const mobile of [false, true]) for (const reduced of [false, true]) for (const phase of [0, 1, 2, 3]) {
    reset(mobile, reduced)
    controller.jumpToPhase(phase)
    controller.syncCameraToLayout()
    assert.equal(gsap.getTweensOf(world).length, 0, 'Startup must not animate behind the loading screen')
    assert.equal(world.cameraZ, 14, 'Layout startup must not teleport to the pending bookmark')
    if (phase) assert.equal(store.getState().mode, MODES.TRAVERSAL)
    // React StrictMode cleanup/replay must preserve the ability to complete a bookmark.
    cleanup()
    controller.jumpToPhase(phase)
    store.getState().setCubeReady()
    controller.resumePendingPhase()
    finishCamera()
    assertDestination(phase, mobile)
  }

  reset()
  controller.jumpToPhase(1)
  controller.jumpToPhase(2)
  controller.jumpToPhase(3)
  store.getState().setCubeReady()
  controller.resumePendingPhase()
  finishCamera()
  assertDestination(3)

  reset()
  controller.jumpToPhase(1)
  controller.jumpToPhase(0)
  store.getState().setCubeReady()
  controller.resumePendingPhase()
  finishCamera()
  assertDestination(0)

  controller.jumpToPhase(1)
  for (const tween of gsap.getTweensOf(world)) tween.progress(.4)
  store.getState().setMobileLayout(true)
  controller.syncCameraToLayout()
  finishCamera()
  assertDestination(1, true)
  controller.goDeeper()
  for (const tween of gsap.getTweensOf(world)) tween.progress(.3)
  controller.jumpToPhase(3)
  finishCamera()
  assertDestination(3, true)
  controller.goBack()
  finishCamera()
  assertDestination(2, true)

  controller.jumpToPhase(1)
  cleanup()
  assert.equal(gsap.getTweensOf(world).length, 0, 'Unmount must kill camera and rotation tweens')
  assert.equal(store.getState().isSceneSettling, false)
  controller.jumpToPhase(1)
  finishCamera()
  assertDestination(1, true)
  console.log('All bookmarks, loading destination changes, StrictMode replay, resize and interrupted navigation verified.')
} finally {
  cleanup()
  gsap.ticker.sleep()
  for (const filename of files) await unlink(filename)
  await rmdir(temporary)
}
