# REDDPIXEL implementation

The four-phase React, Zustand, GSAP and R3F experience retains its procedural cube and stained-glass inner world. About restores the diamond portrait, rotating red node, drawn border, original typography, full expertise, toolkit, experience, languages and certificates. Language bars animate in the scoped phase timeline. Mobile reading surfaces are opaque, with readable scrolling and pinch zoom.

Work presents Websites, Visuals and Technical work. AlphaTradeZone and 3D Architect appear inside Websites. Detail panels slide over the still-mounted collection cards. Either blue or red traversal arrow closes a selected collection without changing phase; afterwards the arrows resume phase traversal. The separate All work button is removed. Escape also closes a collection. Animation contexts, subscriptions, tweens and focus frames clean up on exit.

Images now stay in inline scroll-snap carousels: a gallery per project in all three collections. The broken modal/Close interaction is removed. Touch uses native horizontal scrolling; desktop supports mouse drag, previous/next controls and Arrow/Home/End keys. Images use contain sizing so the full artwork remains visible. ResizeObserver preserves the current slide across viewport changes; scroll updates use one cancellable frame. Videos have native controls, do not autoplay and pause on slide changes, collection closing, phase exit, backgrounding and unmount.

About's reading viewport is inset inside the actual SVG border, with overflow clipped at the scroll boundary. A small Scroll to explore label has a brief moving scroll marker and disappears at the bottom. The portrait keeps its original colour and has a briefly drawn Persian ornament with a desktop hover turn. Navigation buttons receive a brief ring highlight. Intro uses a clearly outlined tap icon with brief click rays and Tap/Click the cube text. Decorative motion respects reduced-motion preferences.

The mobile canvas previously paused as Explore began, before the About cube's tween rendered. The shader waited 1.2 seconds before fading, matching the moment rendering stopped. The controller now keeps frames alive through settling, clears its delayed call on replacement/unmount, and gates the inner-world reveal by the camera position. Camera positions follow the already-eased GSAP state directly; only desktop pointer parallax is damped. Work's branch screen keeps its visible shader running. Expanded collections, text view and background tabs pause covered rendering. Mobile About/Contact pause after settling; reduced-motion shader targets settle directly.

Oracle has bordered message bubbles, a wider desktop chat, smaller message text and 16 px inputs to avoid mobile focus zoom. Its bottom inset preserves traversal-button space. The warmer prompt, bounded history, origin/body/rate limits, request IDs and timeout protections remain.

## Journal and Content Studio

The English journal uses Persian-inspired eightfold geometry, red glass, warm metal tones, thin typography and a shared rotating cube signature. Desktop art reuses the procedural cube and GemAura. It loads lazily, uses DPR 1 and pauses offscreen/in background tabs. Mobile, Save Data and reduced-motion entry use lightweight CSS art. Articles remain readable without JavaScript.

/admin/ provides article editing, saved-draft previews, publishing, all three work collections, image/video uploads, comment approval and owner replies. Comments stay private until approved. Cloudflare Pages Functions use D1 for content and R2 for media. Publishing updates article HTML, homepage text-view work and sitemap without rebuilding. Sessions use HttpOnly cookies, stored session hashes and CSRF checks. Optimistic versions reject conflicting saves. Upload streams enforce size/type bounds and use FixedLengthStream for R2; byte ranges support video seeking.

See [CMS.md](CMS.md) for login and production setup. Production D1/R2 resources and password secret must be configured before deploying. No remote resources, deployments or social posts were created. Media URLs are public even when their associated content is a draft.

## Validation

- Production build and lint pass.
- SEO checks verify generated HTML, canonical metadata, JSON-LD, media paths, robots and sitemap.
- Mocked Oracle checks cover origin, bounded history/body, rate limits, no-store and provider failures.
- Content checks cover editor round-trips and rejection of unsafe slugs, media paths and links.
- Local CMS integration checks cover authentication, CSRF, draft privacy, previews, publishing, version conflicts, comment approval/replies, escaped HTML, sitemap/homepage updates, uploads and byte ranges. Test records were removed from local lists.
- Mobile browser checks cover Work opening, both arrow returns, resumed phase navigation and restored shader visibility. Desktop/mobile blog artwork and the studio editor were also inspected.
- Carousel checks cover desktop dragging, next/previous controls, keyboard End and preservation of the selected slide after resizing to 320 px. Whole-image sizing, visible gallery controls and horizontal touch permissions were checked in rendered DOM.

These are local checks, not real-device frame-rate measurements. The existing large Three.js bundle warning and Three.Clock deprecation remain. Timelapse uploads are supported; real footage still needs to be supplied. See [PROMOTION.md](PROMOTION.md) for the daily checklist.

## Latest UI refinement

The CV / PDF button opens a small, dismissible two-action menu. Add the owner-authored PDF at `public/cv/arash-mohammadi.pdf` and rebuild to enable browser viewing and downloading. Missing files, HTML fallback responses and network errors keep the actions disabled. The menu closes through its trigger, Close button, Escape or an outside click; its request and document listeners clean up.

The readable HTML portfolio stays available without JavaScript or after WebGL failure. A head bootstrap hides it before first paint during normal startup; React clears the bounded startup fallback timer. It no longer appears as the normal Portfolio / Text view control.

About now uses the single statement I BUILD DIGITAL AND PHYSICAL SYSTEMS beside the portrait. Its scoped timeline reveals the red node, draws the measured SVG border, fades the reading surface, then reveals content and language bars. Reversing the same timeline hides content and surface before retracting the frame.

All Work branches use illustrated artwork rather than homepage project photos. Each collection uses the same project-card carousel layout; Technical work keeps genuine gallery photos separate from conceptual covers. Collection headers sit outside a dedicated scrolling body, and opaque panels fill the available width with space above traversal controls.

Contact links sit beside the chat in an opaque framed surface on desktop, with a rotating signature ornament. Mobile uses a separate compact disclosure above the chat. Its expansion is height-bounded; direct links hide while the soft keyboard is open. The signature pauses when Contact is inactive.
Latest verification: build, lint and production SEO checks passed. Browser checks at 320 × 568, 390 × 844 and 1280 × 720 covered the CV disclosure and dismissal, About's initially hidden reading surface and completed drawn border, project carousels, fixed collection headers, arrow return behaviour and separate contact links. Header controls do not collide at 320 px; expanded panels preserve an 8 px gap before traversal controls. No new console errors were captured. Screenshots are in `docs/screenshots/about-v5-mobile.jpg` and `contact-v5-desktop.jpg`.
## Cube passage and touch interaction

Inner-world opacity now remains zero until the camera passes behind the cube's enclosing sphere (`sqrt(3) + 0.05` units for a side-two cube). It then eases in over the next 0.9 units of travel. This geometric gate also clips the shader on the return journey, so it cannot shine through a still-visible cube. The camera bridge runs before environment updates; frame settling still keeps mobile rendering alive through transitions.

Mobile input uses a separate additive rotation offset. Canvas drags turn the cube, background taps add a small directional turn, and short cube taps enter the next phase. Ten-pixel tap tolerance separates swipes from navigation, including drags that leave the mesh or return to their starting point. Navigation cancels active gestures and eases the offset to neutral alongside GSAP's existing rotation. Whole turns are reduced to an equivalent orientation to prevent unnecessary spinning during reset. DOM contact controls and About scrolling do not feed this input.

Mobile idle panels wake rendering only while gesture rotation settles. Gesture capture, window/document listeners, the Zustand subscription and frame registration clean up on cancellation/unmount. Secondary touches, visibility changes and window blur cancel navigation gestures. Reduced motion disables touch rotation while keeping cube taps available.

Mobile/low-power lighting is reduced from ambient 8.4 / directional 5.5 to 3.8 / 3.8. Capable mobile rendering uses antialiasing with DPR capped at 1.25; low-power devices retain DPR 1. The efficient cube keeps four transmission samples, uses pixel-aware edge smoothing and limits transmission buffers to 256/320 pixels. The desktop lighting, artwork palette and full shader design remain intact.

Validation: `npm run test:cube` verifies geometric reveal limits, swipe/tap classification and orientation continuity. Browser checks cover mobile drag without navigation, background tap rotation, cube tap entry, immediate navigation after dragging, desktop/mobile passage and the efficient material compiling without shader errors. A temporary local probe exercised the efficient material under React StrictMode and confirmed that gesture rendering returns to idle. These checks do not replace real-phone frame-rate measurement.

## Bookmarked phase startup

Direct `#intro`, `#about`, `#work` and `#contact` destinations use the same controller as ordinary traversal. While the GPU scene loads, the controller records the latest destination without starting camera tweens or exposing the destination UI. Scene readiness resumes that transition; its completion unlocks traversal and starts the section's scoped entrance timeline. Startup layout synchronization leaves the pending camera alone. This avoids cancelling a bookmarked About transition before its completion can enter Explore mode.

The navigation effect owns the scene-readiness subscription, location listeners and controller teardown. React StrictMode cleanup/replay can requeue the requested hash, and unmount kills camera, rotation, settling and blackout animations. Browser Back/Forward selects the stored destination without adding another history entry.

Validation: `npm run test:navigation` runs the real controller with GSAP and deterministic tween advancement. It covers all phases with mobile/desktop and reduced-motion settings, StrictMode replay, latest destination changes during loading, return to Intro, resize during travel, interrupted transitions and teardown/restart. Build, lint, cube and production SEO checks also pass. Local browser checks at 1280 × 720 and 390 × 844 confirm direct About/Work/Contact startup and complete UI visibility; history Back/Forward and the ordinary homepage entry work. The mobile About entrance was observed progressing from the red node to the completed border and readable panel, with enabled traversal controls. See `docs/screenshots/about-bookmark-mobile.png`.

The owner-facing website checklist is [SEO-CHECKLIST.md](SEO-CHECKLIST.md). It distinguishes existing repository features from launch/indexing tasks and the next content work: substantive project routes, useful articles, original media and a sustainable daily/weekly routine. Production deployment and Search Console account actions were not performed.
