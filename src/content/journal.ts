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
  readingMinutes: 6,
  sections: [
    { heading: 'A beautiful scene still needs a working front door', paragraphs: [
      'REDDPIXEL uses a stained-glass cube to move between an introduction, About, Work and Contact. That spatial experience is the signature. But a visitor should not have to wait for GPU detection or shader preparation to discover what the portfolio offers.',
      'The earlier application waited for its GPU profile before mounting both the scene and the interface. If the 3D startup stalled, the useful information stalled with it. The fix was to separate content readiness from scene readiness, while keeping the cinematic experience.',
    ] },
    { heading: 'Mount the interface. Load the scene separately.', paragraphs: [
      'The React interface mounts separately from the lazy Three.js scene, and GPU detection chooses a conservative rendering path when necessary. Cinematic navigation can queue a destination during startup; the camera and phase reveal settle when the scene is ready. A readable portfolio opens automatically if the app or scene cannot start.',
      'This division does not make shader compilation free or guarantee instant cinematic navigation. The generated HTML contains the useful information independently, including real contact links, so a WebGL failure does not remove the portfolio.',
    ], code: "const SceneLoader = lazy(() => import('./world/SceneLoader'))\n\n// Interface and scene have separate readiness paths.\n<Layout />\n<Suspense fallback={null}>\n  <SceneLoader onFailure={handleSceneFailure} />\n</Suspense>" },
    { heading: 'Put real content in the HTML', paragraphs: [
      'A small Vite transform renders a native details element from the shared portfolio data. It contains the biography, capabilities, work collections and real contact links. That content exists in the built HTML, before React or WebGL starts.',
      'The details element is open by default for visitors without JavaScript. A small head bootstrap hides it before the first paint for the cinematic experience, preventing a flash of the document during startup. If the app or scene cannot start, the readable view opens automatically. Direct portfolio-about anchors also open this view. The normal interface instead has a compact CV menu for the owner-authored PDF.',
      'Repository content supplies the frontend, generated HTML and Oracle. Published Content Studio work overrides repository work in the public gallery and server-rendered HTML; the Oracle remains grounded in its repository data. Sharing source content does not automatically synchronize every database edit or verify a biography claim.',
    ] },
    { heading: 'Give the gallery its own loading budget', paragraphs: [
      'An image gallery can still feel broken when the surrounding interface loads correctly. Waiting for a desktop cover to decode, then mounting an image whose responsive source chooses another file, creates two separate waits. Hiding a collection until it is clicked also delays discovery of its first image.',
      'REDDPIXEL warms the known small covers of the first projects while the visitor is in About or Work. Opening a collection warms its project covers sequentially, and navigating a gallery prepares nearby previews. Queued speculative warming stops when its view exits and is skipped for hidden tabs, Data Saver and reported 2G connections. It does not download project films or every full-size image at startup.',
      'The gallery paints a small preview beneath its responsive image, then reveals the sharper version when it loads. Width descriptors and layout-specific sizes let the browser choose a suitable file for the screen and pixel density. Full-image sources begin near the current slide; loaded slides retain their image elements. Project transitions wait only for the small preview, keep the outgoing view visible, and still allow the original image to load if the preview fails.',
      'Resizing does not reset the selection, replace the current image element or clear its displayed image. A browser may need a larger candidate after an enlargement, higher pixel density or full-screen expansion. That is a legitimate upgrade, not a reason to blank the gallery. Bundled work images use a four-hour browser cache window, matching the verified Cloudflare custom-domain response, and revalidate afterward. They are not labeled immutable: an immediate bundled-image replacement needs a new filename. UUID media uploads use their existing immutable URLs.',
      'The shared preview cache deduplicates requests and keeps only a bounded number of completed entries. A request token prevents an older project selection from replacing a newer one. Failed image loads expose a retry control, and videos remain click-to-play. These choices reduce avoidable waiting; the first download still depends on the visitor’s connection.',
    ] },
    { heading: 'Stop drawing what the visitor cannot see', paragraphs: [
      'The Canvas pauses when the browser tab is hidden, the text view is open, or a Work collection covers the scene. Mobile content panels also freeze the mostly covered background once shader readiness is confirmed. Camera transitions temporarily keep rendering active so navigation still settles correctly.',
      'Reduced motion also needs a deliberate path: short transitions, stable shader time and no pointer parallax. The visual identity can remain without constant movement. Timers, animation contexts and request controllers need cleanup when their owning view exits.',
    ], code: "<Canvas\n  frameloop={isVisible && !isContentView &&\n    (!isCubeReady || isTransitioning ||\n      (!isSceneObscured && !isMobilePanel))\n      ? 'always' : 'never'}\n/>" },
    { heading: 'Test the failure path as a feature', paragraphs: [
      'A successful WebGL render is only one test. The production HTML should also be inspected without executable JavaScript. Keyboard navigation, mobile text size, a forced context failure, reduced motion and browser history each reveal different problems.',
      'Gallery checks should include a cold cache, delayed high-resolution images, failed image responses, rapid project changes, full-screen browsing and repeated resizing at different pixel densities. Compare transferred bytes and request URLs as well as what appears on screen. A completed request in a developer tool is not proof of another full download if it came from the browser cache.',
      'One small trap appeared in REDDPIXEL: cinematic hashes such as #about matched sections inside a closed details element. Browser history opened the text view automatically to reveal that anchor. Separate portfolio-about anchors solved the conflict.',
      'The useful result is a portfolio whose information remains reachable while the visual experience earns its place. The cube can take its time. The visitor does not have to.',
    ] },
  ],
}]

export const journalPath = (post: JournalPost) => `/blog/${post.slug}/`

