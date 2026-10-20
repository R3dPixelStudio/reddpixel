# Work collections and final media

The three main branches remain Websites, Visuals and Technical work. The intro, About, cube and camera choreography are unchanged by this content update.

## Supplied images

Originals in `E:\final photo resume` are preserved. The repository contains responsive WebP derivatives under `public/images/work/`, with 640-pixel thumbnails and images up to 1600 pixels wide. Images smaller than that keep their original dimensions. `src/content/workMediaSizes.ts` supplies their dimensions.

| Source folder | Website entry | Images |
| --- | --- | --- |
| `website-alphatradezone` | Websites → AlphaTradeZone | 3, in numbered order |
| `website-vfx artist Webfolio` | Websites → VFX Artist Webfolio | 4, in numbered order; URL from `url.txt` |
| `visuals-architecture representation`, `1-*` | Visuals → Architectural Presentations → Jaryan | 6 |
| `visuals-architecture representation`, `2-*` | Visuals → Architectural Presentations → Hormozan Hospital | 5 |

3D Architect retains its existing images, description and URL. The Art & Motion subsection is ready for creative/freelance pieces and social films; no unrelated images are used to fill it.

The old generic visual/technical entries (`indiegame`, `logomotion`, `networking`, `electrical`) are retired from the collections. Their original files and stored database records are preserved. An existing AlphaTradeZone CMS entry retains its owner-edited copy, URL, visibility and version; only references to its two old bundled images are upgraded, preserving any uploaded media.

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
