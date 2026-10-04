# REDDPIXEL website SEO to-do list

Start with the website, then use social posts to help people discover the useful pages. Account setup, production deployment and indexing are still owner tasks; local tests cannot confirm them.

## Already implemented in this repository

- [x] Readable portfolio HTML supplied before the Three.js scene loads.
- [x] Homepage and blog titles, descriptions, canonical URLs and social previews.
- [x] Person, WebSite and article structured data based on real content.
- [x] Generated sitemap, robots.txt and separate article URLs.
- [x] Responsive WebP images, image descriptions and mobile rendering limits.
- [x] Content Studio for articles, work, media and moderated comments; production bindings require setup.

## First: launch and indexing

- [ ] Review your name, services, experience durations, availability and project descriptions. Describe what you actually offer clients.
- [ ] Review the first article at `/blog/portfolio-content-before-webgl/`. Add original screenshots or a short recording that demonstrates its explanation.
- [ ] Complete [CMS setup](CMS.md), review the production build, then deploy the approved website. Keep drafts private.
- [ ] Check HTTPS and redirects: HTTP and the alternative hostname should lead to the chosen `https://reddpixel.com/` URLs. Canonicals should exclude campaign parameters.
- [ ] Verify a domain property in [Google Search Console](https://search.google.com/search-console/), using the DNS record it provides.
- [ ] Submit `https://reddpixel.com/sitemap.xml`. Inspect the homepage, blog index and first article with URL Inspection; check the rendered content and request indexing when appropriate.
- [ ] Confirm `/robots.txt` and the sitemap work publicly, articles return 200, and nonexistent article URLs return 404. Check that public pages have no accidental `noindex`.
- [ ] Test the homepage and first article in [PageSpeed Insights](https://pagespeed.web.dev/) and on an actual phone. Prioritize slow loading, unresponsive input and layout movement. Use Search Console's Core Web Vitals report once field data exists.
- [ ] Validate article structured data in [Rich Results Test](https://search.google.com/test/rich-results). Passing validation does not guarantee an enhanced search result.

## Next: pages that explain your work

`#about`, `#work` and `#contact` remain bookmarks within one homepage. They are not separate search landing pages. Google recommends resolvable page URLs for separately routed content. Keep the cinematic navigation, and add useful HTML pages when there is enough original material. [Google JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

- [ ] Choose your primary client offering: interactive websites / creative development. Write clear homepage copy connecting the work to the client's needs.
- [ ] Gather evidence for three strong website projects: brief, your role, constraints, screenshots, implementation decisions and verified results.
- [ ] Next development task: build real case-study routes such as `/work/project-slug/`, with their own HTML, title, description, canonical and sitemap entry. A collection card alone does not create that page.
- [ ] Add visual and technical-work stories when you have original process images or timelapses. State your contribution and what the material shows.
- [ ] Consider a dedicated service page only when it can explain deliverables, examples and working process. Avoid duplicate keyword/location pages.
- [ ] Link related articles and case studies to each other and to the relevant portfolio/contact destination using descriptive link text.
- [ ] In `/admin/`, give each article a specific title, summary, readable headings and meaningful image descriptions. Use English writing with the existing Persian-inspired artwork.
- [ ] Keep image files appropriately sized and compressed; add useful video posters. Use actual publication dates and update dates only when you change the content.

## Sustainable routine

**Daily, 15 minutes**

- [ ] Save one real project observation, screenshot or measurement for a future article.
- [ ] Review the comment approval queue and answer useful technical questions.
- [ ] Improve one unclear caption, paragraph or project description; fix any reported broken link.

**Weekly, 45–90 minutes**

- [ ] Publish or advance one substantive article; every two weeks is fine. Explain a real decision and show your own evidence.
- [ ] Check Search Console indexing issues and search queries. Improve a relevant existing page before creating a duplicate topic.
- [ ] Share the specific article/project URL on Superintelliget or LinkedIn, with an original clip and context. Follow [PROMOTION.md](PROMOTION.md) for the broader schedule.
- [ ] Record useful inquiries and which page brought them. UTM links alone do not collect analytics.

**Monthly**

- [ ] Review search trends and qualified inquiries; choose the next article from actual questions.
- [ ] Retest mobile performance after media/scene changes. Keep readable content independent of WebGL readiness.
- [ ] Refresh outdated project facts and broken links. Keep URLs stable; redirect a published URL if it must change.

Prioritize helpful original content over publishing volume. These actions support discoverability; they do not guarantee rankings. Sources: [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).
