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

## Technical project films

The studio starts with three private drafts:

- `cafe-shariati` — Café Shariati.
- `technical-project-02` — rename when the second project is ready.
- `technical-project-03` — rename when the third project is ready.

The public collection introduces the films in preparation; it does not display unfinished drafts or present old installation photographs as evidence for these projects.

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

Source-based entries live in `src/content/portfolio.ts`; planned technical drafts are defined in `src/content/cms.ts`. Studio edits override matching source entries by ID. Keep published IDs stable when replacing media.
