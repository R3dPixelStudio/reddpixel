# REDDPIXEL SEO and publishing

Canonical homepage: **https://reddpixel.com/**. Cinematic hashes select phases, not separate pages. UTM queries do not change canonical metadata.

For the prioritized owner tasks and daily/weekly routine, use [SEO-CHECKLIST.md](SEO-CHECKLIST.md).

## Generated pages

`vite.config.ts` uses small HTML renderers:

- `scripts/portfolioHtml.ts` renders the homepage metadata, Person + WebSite JSON-LD and a usable native text view from `src/content/portfolio.ts`.
- `scripts/journalHtml.ts` renders `/blog/` and each substantive article in `src/content/journal.ts`. Articles have their own title, description, canonical, OG/Twitter and BlogPosting schema. No publication date is invented before launch.
- The same plugin emits `dist/sitemap.xml` from those real routes. `public/sitemap.xml` was removed so there is one source of sitemap generation. `public/robots.txt` permits rendering assets, excludes `/api/`, and references it.
- Development middleware serves the repository baseline. Cloudflare Pages Functions render the journal from repository content plus published D1 records. The Content Studio manages articles, work and approved comments; R2 serves uploaded media. See [CMS.md](CMS.md) for setup.

The baseline sitemap contains homepage, blog index, and `/blog/portfolio-content-before-webgl/`. The Pages sitemap function adds published CMS articles and omits drafts. The first article is ready for editorial review. There are no thin project routes or SEO topic pages.

## Progressive enhancement

The text view is open in production HTML and works without JavaScript. A head bootstrap hides it before normal JavaScript startup to prevent a flash; failure opens it again. React mounts the cinematic interface independently of GPU readiness. The normal CV / PDF control is a compact menu for the owner's supplied PDF. Static work collections use native disclosures, so AlphaTradeZone and 3D Architect are reached inside Websites rather than shown as homepage previews.

Cinematic controls are inert while reading the fallback view. Scene import/render failure, context loss or startup timeout opens it. Canvas pauses behind expanded collections/text content and in background tabs. Static anchors use `portfolio-` prefixes, avoiding collisions with cinematic `#about`, `#work` and `#contact` history entries. Bookmarked cinematic phases wait for scene readiness before starting their camera and UI entrance animations.

The content is reachable by real visitors as well as crawlers. There is no bot detection, hidden keyword text or AI-only version.

## Metadata and media

Homepage metadata comes from `SEO` in shared data. Blog metadata comes from the article record. Person schema uses the real name, portfolio description and repository LinkedIn profile, plus the owner's supplied @SUPERINTELLIGET Instagram handle. YouTube remains null until its real channel exists. BlogPosting describes an actual readable article, not a fabricated case study.

Social previews use `public/images/social-preview.jpg`, a 1200 x 630 crop of existing VFX artwork. Original raster assets remain; optimized WebP variants and actual dimensions are recorded in `imageSizes.ts`. Media alternatives distinguish artwork from delivered screenshots/photos.

## Add a project, timelapse or article

Edit public portfolio facts in `src/content/portfolio.ts` once. Frontend, generated text view and Oracle share them. Collections now accept arbitrary numbers of projects/media, without the old two-project diagonal layout constraint.

Add real timelapses as `{ type: 'video', src: '/media/your-file.mp4', alt: 'A specific description' }` in the relevant gallery. The viewer uses native controls, playsInline and metadata preload; it does not autoplay clips. Add optimized thumbnails for images and record dimensions. Preserve originals where useful; do not invent footage or client outcomes.

Use `/admin/` to write articles, preview saved drafts, publish, curate work, upload photographs/timelapses and approve comments with replies. CMS first-publication time supplies truthful dates and structured metadata. Public HTML and sitemap update immediately. Repository-only content can still use `JOURNAL_POSTS` and a build. All content strings are escaped.

Run `npm run build`, `npm run lint`, `npm run check:seo`, `npm run test:oracle` (Node 22.18+ for native TypeScript stripping). Inspect actual dist HTML and use the Cloudflare Pages preview. Never publish ignored `.task-baseline/` backups/QA files.

The Oracle now receives bounded user + assistant history so follow-ups have context. Only those roles are accepted; system/developer role injection is dropped. Public facts remain authoritative. Origin/body/rate bounds, provider timeout/retries, request IDs and no-store responses remain. Provider-backed tone still needs a live test with configured Groq credentials.

## Manual post-launch checklist

1. Deploy after reviewing copy, article and public facts.
2. Verify reddpixel.com in Google Search Console and submit `https://reddpixel.com/sitemap.xml`.
3. Inspect homepage, blog and article URLs/rendered HTML; request indexing after deployment.
4. Verify Bing Webmaster Tools and submit the same sitemap.
5. Monitor normal Search Console performance and qualified inquiries.
6. Monitor AI-related reporting where available; Google's AI features contribute to the Web search type rather than guaranteeing a separate report.
7. Check Bing AI Performance/citations when available in your verified account.
8. Use actual queries/citations/inquiries to choose the next article or case study.
9. Test production redirects/HTTPS, social previews, real mobile/Instagram browsers, reduced motion, keyboard navigation and a real Oracle request.
10. Confirm unresolved durations, services/credentials and current relocation preferences; add YouTube only when launched.
11. Follow the repeatable daily/weekly checklist in PROMOTION.md.

None of these account/deployment actions or social posts was completed automatically. No analytics vendor was added.

References: [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [Google AI features](https://developers.google.com/search/docs/appearance/ai-features), [Vite HTML transform](https://vite.dev/guide/api-plugin.html#transformindexhtml).
