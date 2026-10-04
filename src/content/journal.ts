export interface JournalSection {
  heading: string
  paragraphs: string[]
  code?: string
}

export interface JournalPost {
  slug: string
  title: string
  description: string
  category: string
  readingMinutes: number
  sections: JournalSection[]
}

// Keep each article grounded in work actually present in the portfolio.
// No publication date is claimed until the owner sets one after launch.
export const JOURNAL_POSTS: JournalPost[] = [{
  slug: 'portfolio-content-before-webgl',
  title: 'The portfolio should load before the cube',
  description: 'How REDDPIXEL separates readable portfolio content from its Three.js scene, with a static text view and a calmer path for slower devices.',
  category: 'Engineering note',
  readingMinutes: 4,
  sections: [
    { heading: 'A beautiful scene still needs a working front door', paragraphs: [
      'REDDPIXEL uses a stained-glass cube to move between an introduction, About, Work and Contact. That spatial experience is the signature. But a visitor should not have to wait for GPU detection or shader preparation to discover what the portfolio offers.',
      'The earlier application waited for its GPU profile before mounting both the scene and the interface. If the 3D startup stalled, the useful information stalled with it. The fix was to separate content readiness from scene readiness, while keeping the cinematic experience.',
    ] },
    { heading: 'Mount the interface. Load the scene separately.', paragraphs: [
      'The React interface now mounts immediately. The Three.js scene is a lazy import, and its GPU detector chooses the conservative rendering path when necessary. A visitor can use phase navigation while the scene prepares; a readable portfolio opens automatically if the scene cannot start.',
      'This division does not make the shaders cheaper. It changes which part of the application has to wait for them. A client looking for a contact link can find it before the cube is ready.',
    ], code: "const SceneLoader = lazy(() => import('./world/SceneLoader'))\n\n// Interface and scene have separate readiness paths.\n<Layout />\n<Suspense fallback={null}>\n  <SceneLoader onFailure={handleSceneFailure} />\n</Suspense>" },
    { heading: 'Put real content in the HTML', paragraphs: [
      'A small Vite transform renders a native details element from the shared portfolio data. It contains the biography, capabilities, work collections and real contact links. That content exists in the built HTML, before React or WebGL starts.',
      'The details element is open by default for visitors without JavaScript. A small head bootstrap hides it before the first paint for the cinematic experience, preventing a flash of the document during startup. If the app or scene cannot start, the readable view opens automatically. Direct portfolio-about anchors also open this view. The normal interface instead has a compact CV menu for the owner-authored PDF.',
      'The frontend, generated HTML and Oracle use the same public data module. When a project description changes, it can change in one place. Conflicting biography details still require an owner decision; sharing data does not magically verify a claim.',
    ] },
    { heading: 'Stop drawing what the visitor cannot see', paragraphs: [
      'The Canvas pauses when the browser tab is hidden, the text view is open, or a Work collection covers the scene. Mobile content panels also freeze the mostly covered background once shader readiness is confirmed. Camera transitions temporarily keep rendering active so navigation still settles correctly.',
      'Reduced motion also needs a deliberate path: short transitions, stable shader time and no pointer parallax. The visual identity can remain without constant movement. Timers, animation contexts and request controllers need cleanup when their owning view exits.',
    ], code: "<Canvas\n  frameloop={isVisible && !isContentView &&\n    (!isCubeReady || isTransitioning ||\n      (!isSceneObscured && !isMobilePanel))\n      ? 'always' : 'never'}\n/>" },
    { heading: 'Test the failure path as a feature', paragraphs: [
      'A successful WebGL render is only one test. The production HTML should also be inspected without executable JavaScript. Keyboard navigation, mobile text size, a forced context failure, reduced motion and browser history each reveal different problems.',
      'One small trap appeared in REDDPIXEL: cinematic hashes such as #about matched sections inside a closed details element. Browser history opened the text view automatically to reveal that anchor. Separate portfolio-about anchors solved the conflict.',
      'The useful result is a portfolio whose information remains reachable while the visual experience earns its place. The cube can take its time. The visitor does not have to.',
    ] },
  ],
}]

export const journalPath = (post: JournalPost) => `/blog/${post.slug}/`

