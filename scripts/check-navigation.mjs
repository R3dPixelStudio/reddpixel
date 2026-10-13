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
    ['src/world/introComposition.ts', 'composition'],
    ['src/world/aboutComposition.ts', 'about'],
    ['src/world/worldState.ts', 'world'],
    ['src/core/timeline/cinematicController.ts', 'controller'],
  ]) {
    const input = (await readFile(path.join(root, source), 'utf8'))
      .replace('../../stores/useExperience', './store.mjs')
      .replace('../../world/worldState', './world.mjs')
      .replace('../../world/introComposition', './composition.mjs')
      .replace('../../world/aboutComposition', './about.mjs')
      .replace('./introComposition', './composition.mjs')
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
    Object.assign(world, { cameraX: 0, cameraY: mobile ? 1.4 : 1.15, cameraZ: mobile ? 8.4 : 5.7, targetX: mobile ? .85 : 1.8, targetY: mobile ? -.8 : -.48, targetZ: 0, cubeX:0, particleRush:0, aboutFocus:0, cubeRotX: -.12, cubeRotY: -.85, cubeRotZ: -.17 })
  }
  const finishCamera = () => {
    const roots = new Set(gsap.getTweensOf(world).map(tween => tween.parent === gsap.globalTimeline ? tween : tween.parent))
    for (const animation of roots) animation.progress(1)
  }
  const assertDestination = (phase, mobile = false) => {
    assert.equal(store.getState().currentPhase, phase)
    assert.equal(store.getState().isTransitioning, false, 'Traversal buttons must unlock')
    assert.equal(store.getState().mode, phase ? MODES.EXPLORE : MODES.LANDING, 'The destination UI must open')
    assert.equal(world.cameraZ, [mobile ? 8.4 : 5.7, mobile ? 8.4 : 5.7, -4, -8][phase])
    assert.equal(world.targetX, phase === 0 ? (mobile ? .85 : 1.8) : phase === 1 ? -7.3 : 0)
    assert.equal(world.cameraX, phase === 1 ? -6 : 0)
    assert.equal(world.cubeX, 0, 'The cube stays at the origin throughout navigation')
    if (phase === 0) {
      assert.equal(world.cubeRotX, -.12)
      assert.equal(world.cubeRotY, -.85, 'Returning to Intro must restore the composed orientation')
      assert.equal(world.cubeRotZ, -.17)
    }
  }

  for (const mobile of [false, true]) for (const reduced of [false, true]) for (const phase of [0, 1, 2, 3]) {
    reset(mobile, reduced)
    controller.jumpToPhase(phase)
    controller.syncCameraToLayout()
    assert.equal(gsap.getTweensOf(world).length, 0, 'Startup must not animate behind the loading screen')
    assert.equal(world.cameraZ, mobile ? 8.4 : 5.7, 'Layout startup must not teleport to the pending bookmark')
    if (phase) assert.equal(store.getState().mode, MODES.TRAVERSAL)
    // React StrictMode cleanup/replay must preserve the ability to complete a bookmark.
    cleanup()
    controller.jumpToPhase(phase)
    store.getState().setCubeReady()
    controller.resumePendingPhase()
    finishCamera()
    assertDestination(phase, mobile)
  }

  for (const mobile of [false, true]) {
    reset(mobile)
    store.getState().setCubeReady()
    const startZ = world.cameraZ
    controller.jumpToPhase(1)
    const cameraTween = gsap.getTweensOf(world)[0].parent
    let previousX = world.cameraX
    let sawEarlyAbout = false
    for (let step = 1; step <= 20; step++) {
      cameraTween.progress(step / 20)
      assert.equal(world.cameraZ, startZ, 'About is a lateral journey, not a dive or retreat')
      assert.ok(world.cameraX <= previousX, 'Camera must follow the source to the left without reversing')
      assert.equal(world.cubeX, 0, 'The cube must not fly away')
      if (step < 20 && store.getState().mode === MODES.EXPLORE) { sawEarlyAbout = true; assert.equal(store.getState().isTransitioning, true) }
      previousX = world.cameraX
    }
    assert.ok(sawEarlyAbout, 'The UI begins opening during the source approach, without waiting for arrival')
    assert.equal(world.cubeX, 0)
    assert.equal(world.cameraX, -6)
    assert.equal(world.particleRush, 0)
    assert.equal(world.aboutFocus, 1)
    assert.equal(gsap.getTweensOf(world).length, 0, 'About must not launch a second movement after arrival')
  }

  for (const mobile of [false, true]) {
    reset(mobile)
    store.getState().setCubeReady()
    controller.jumpToPhase(1)
    finishCamera()
    controller.goDeeper()
    const crossing = gsap.getTweensOf(world)[0].parent
    crossing.time(.9)
    assert.ok(world.cameraZ > 1.45, 'Camera cannot enter the glass while returning from the source')
    assert.ok(world.cameraX < 0)
    crossing.time(1.25)
    assert.equal(world.cameraX, 0, 'Camera must line up with the cube before the dive')
    assert.equal(world.aboutFocus, 0)
    crossing.time(1.6)
    assert.equal(world.cameraX, 0)
    assert.equal(world.cubeX, 0)
    finishCamera()
    assertDestination(2, mobile)
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
