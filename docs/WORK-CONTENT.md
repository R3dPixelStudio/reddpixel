# Work collections and final media

The three main branches remain Websites, Visuals and Technical work. The intro, About, cube and camera choreography are unchanged by this content update.

## Supplied images

Originals in `E:\final photo resume` are preserved. The repository contains responsive WebP derivatives under `public/images/work/`, with 640-pixel thumbnails and images up to 1600 pixels wide. Images smaller than that keep their original dimensions. `src/content/workMediaSizes.ts` supplies their dimensions.

| Source folder | Website entry | Images |
| --- | --- | --- |
| `website-alphatradezone` | Websites → AlphaTradeZone | 3, in numbered order |
| `Abi mobile` | Websites → Abi Mobile | 4, in numbered order; supplied description and URL |
| `website-vfx artist Webfolio` | Websites → VFX Artist Webfolio | 4, in numbered order; URL from `url.txt` |
| `visuals-architecture representation`, `1-*` | Visuals → Architectural Presentations → Jaryan | 6 |
| `visuals-architecture representation`, `2-*` | Visuals → Architectural Presentations → Hormozan Hospital | 5 |
| `visuals-architecture representation/damavand villa entrence` | Visuals → Architectural Presentations → Damavand Villa Entrance | 5; natural filename order (8, 11, 12, 13, 15) |

3D Architect retains its existing images, description and URL. The Art & Motion subsection is ready for creative/freelance pieces and social films; no unrelated images are used to fill it.

The website gallery opens one project at a time, with a project index, a large screenshot viewer, a thumbnail filmstrip and full-screen browsing. Project notes expand on demand; the secondary live-site link opens a new tab. The order is AlphaTradeZone, Abi Mobile, 3D Architect, then VFX Artist Webfolio. The same priority applies to CMS-backed collections.

Visuals uses a larger image stage with a compact animated project strip, moving red selection marker, drawn frame and directional image reveal. It has no thumbnails on desktop or mobile. The outgoing view remains visible while the next cover decodes; interrupted selections and unmount cancel pending image work and clean up the transition. Reduced motion skips the wipe. Architectural Presentations includes Jaryan, Hormozan Hospital and Damavand Villa Entrance; Art & Motion keeps its own subsection. The Damavand brief describes an entrance/garden visualisation for an existing villa, with pergola parking, a ramp and landscaping under a tight deadline. It does not claim design of the existing building.

The old generic visual/technical entries (`indiegame`, `logomotion`, `networking`, `electrical`) are retired from the collections. Their original files and stored database records are preserved. An existing AlphaTradeZone CMS entry retains its owner-edited copy, URL, visibility and version; only references to its two old bundled images are upgraded, preserving any uploaded media.

Architectural Presentations opens with Damavand Villa Entrance, followed by Jaryan and Hormozan Hospital. This ordering also applies to CMS-backed content.

## Gallery loading

`galleryImages.ts` deduplicates small-preview requests and bounds completed cache entries to 12. About and Work warm the first known project covers; an opened collection warms its remaining covers sequentially. Hover/focus signals raise preview priority. Hidden tabs, Data Saver and reported 2G connections skip speculative work. Pending queues stop on view changes; shared requests already in progress can finish for their other consumers.

`GalleryImage.tsx` paints a small preview underneath the decoded responsive image. Layout-specific `sizes` and the actual variant widths replace the old generic `100vw` hint. Only current/adjacent full-image sources start; loaded slides retain their elements. Resizing does not reset selection or hide an already displayed image. Enlarging the viewport, changing pixel density or entering fullscreen may legitimately fetch a sharper candidate once. Uploaded files without known derivatives use their real URL directly; no nonexistent thumbnail URL is invented. Failed loads offer Retry.

Visual project transitions decode only the small preview, retain the outgoing view and allow original-image loading if the preview fails. They no longer gate project selection on a large desktop cover and then request a second responsive file. Videos remain outside this warming path and use click-to-play.

Bundled work/optimized image responses use a four-hour browser cache followed by revalidation. This matches the verified production custom-domain response: its Cloudflare Browser Cache TTL raised the earlier five-minute Pages header to four hours. These mutable filenames are deliberately not marked immutable. Rename a bundled image when an immediate cache-independent replacement is needed. UUID D1 media keeps its existing immutable caching policy. The journal article describes this policy and separates readable HTML from cinematic scene readiness.

Targeted local checks cover delayed full-resolution files, rapid switching, failed-image retry, native caching during repeated resize, fullscreen, Data Saver, desktop and emulated mobile at device pixel ratio 3. Physical devices and Safari require their own review; these checks are not a universal device-performance claim.

## Technical project films

The first project is Café Shariati, a café on Shariati Street. Its full project film is uploaded through the Content Studio to the existing production D1 media library at `/media/3048abfa-5d10-4cc6-b61d-c3fd0e361f45.mp4`. The poster, taken from the finished café at 55 seconds, is also in D1 at `/media/8576b506-6265-499d-8acd-64cfedc1153b.webp`. Responsive repository poster copies remain as a source fallback. The source entry is published; an existing owner-saved CMS entry still takes precedence, including its draft/published status.

The original `E:\elec\premiere project\Sequence 01.mp4` is preserved outside the repository. The web copy keeps the entire 60.37-second sequence, 1920×1080 resolution and 30 fps, with no cuts or speed changes. Lossy H.264 compression reduces it from 152,450,569 bytes to 9,562,274 bytes (about 9.6 MB); this preserves duration and resolution, not identical image quality. The original has no audio track. Fast-start metadata supports playback before the full file downloads. Public gallery players show a poster, use `preload="none"`, have native controls and do not autoplay; playback pauses when leaving the collection or hiding the tab. The film and D1 poster consume 9,656,972 bytes of the studio's 300 MiB media budget. No R2 account or YouTube player is used, and the video binary is not committed to GitHub.

A separate, non-interactive **Coming soon** card follows the published technical projects. It is an upcoming-project placeholder, with no invented project title, media or playback button. The mobile film layout uses the full card width.

Two private drafts remain:

- `technical-project-02` — rename when the second project is ready.
- `technical-project-03` — rename when the third project is ready.

The public collection does not display unfinished drafts or present old installation photographs as evidence for these projects.

To publish a project:

1. Open `/admin/` → Work collections and edit its draft.
2. Set the real project name and describe your contribution.
3. Upload a representative cover and add its image description.
4. Upload the edited film, timelapses and/or photographs in Gallery & timelapses. Use Earlier/Later to arrange the story.
5. Optionally upload a separate poster for each video. Technical videos otherwise use the project cover. Players have controls, play inline and do not autoplay.
6. Save as Published when ready. A published technical project requires a cover and at least one gallery item. No frontend deployment is needed for studio publishing.

Images and videos use the existing D1 upload library and its size limits; no new binding or SQL migration is needed for visual categories or video posters. See [CMS.md](CMS.md) for upload limits and setup.

## More websites and visuals

Use New work in the studio, choose a collection, add a cover/gallery and publish. Visuals also have a discipline selector: Architectural Presentations or Art & Motion. Untagged older custom visual entries default to Art & Motion.

Source-based entries live in `src/content/portfolio.ts`; planned technical drafts are defined in `src/content/cms.ts`. Studio edits override matching source entries by ID. Keep published IDs stable when replacing media. Upload new project films through the studio; D1 media uses `/media/` paths. A source checkout with a separate local D1 database does not contain the production upload; use the deployed site to review that film.
