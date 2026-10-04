# REDDPIXEL Content Studio

The working studio is at `/admin/`. It writes articles, work entries, media and comment moderation to Cloudflare Pages Functions, D1 and R2. Publishing changes the live HTML and sitemap without another frontend build. Repository content remains the starting collection.

## Local preview

The current preview is running at `http://127.0.0.1:8788/`. Open `/admin/`. Its temporary local password is in the ignored `.local-cms-password.txt`; it is not embedded in the app, screenshots or documentation. Keep `.dev.vars`, the password file and `.wrangler/` out of source control and deployments.

To run it again:

```powershell
npm run cms:password
npm run cms:migrate:local
npm run cms:preview
```

`cms:password` asks you to choose at least 16 characters and writes only a salted PBKDF2 hash to `.dev.vars`, preserving other secrets. Terminal input is visible, so run it in your own terminal. A password change takes effect after restarting the preview. Existing sessions expire after eight hours; clear the sessions table when immediately revoking existing logins.

`npm run dev` remains the Vite frontend workflow. Use the Pages preview for actual storage, uploads, comments and authentication. Local D1/R2 persist in `.wrangler/state/` between restarts.

## Writing and publishing

1. Open **Posts → New article**. Enter title, a unique lowercase hyphenated slug, summary, category and reading time.
2. Write `## Heading` before each section. Separate paragraphs with a blank line. A section supports one fenced code block using triple backticks. HTML is rendered as text, preventing script injection.
3. Optionally upload a cover in **Media**, then put its path and useful image description in the article editor.
4. Save as **Draft**. The list offers **Preview saved draft**; this preview requires an authenticated session and is marked noindex/no-store. Unsaved edits are not part of that preview.
5. Choose **Published** and save. The article, index and sitemap update immediately. Save it as Draft to take it offline without deleting it. The URL slug is fixed after creation to avoid accidentally breaking links.

Publishing adds a server timestamp. Existing repository articles do not acquire a invented historical publication date. Concurrent saves use version checks; after a conflict, reload the entry and reconcile your edits.

## Work collections and uploads

**Work collections → New work** lets you add to Websites, Visuals or Electrical work. Enter a truthful description, a cover and its description. Websites can have an HTTPS destination. Add gallery rows for photos or timelapses.

Upload files in **Media** first, then copy their `/media/...` paths. Images accept JPEG/PNG/WebP up to 8 MB; video accepts MP4/WebM up to 40 MB. Compress photos and videos before uploading. Uploads are streamed to R2, with a byte limit, file-signature check and known-length stream. The public media route supports byte ranges for video seeking. Videos use controls, playsInline and metadata preload; nothing autoplays.

Uploaded media URLs are public assets, even before an article/work is published. Draft **text** is private. Upload only material intended for the website. Removing a gallery row detaches it from the work and leaves the original media in the library. The studio provides reversible draft/hide actions, not permanent content deletion.

Public collections, native homepage HTML and article pages read published D1 content. Homepage branch previews still avoid AlphaTradeZone and 3D Architect. The Oracle's existing public-data prompt remains repository based; admin work changes do not rewrite its verified biography automatically.

## Comments

Visitors can submit a name and thought on a published article. Every new comment is pending and absent from public HTML until you approve it. **Comments** shows pending entries first. Save a reply with approval to publish both; **Hide** makes it private again. Replies are labeled Arash / REDDPIXEL. Nothing sends email or social messages. The queue returns up to 500 entries and an article shows up to 200 approved comments.

There is a hidden bot field and a persistent per-IP submission limit. Login attempts are also rate limited. There is no CAPTCHA service or tracking dependency.

## Connect the live site

No remote resources or deployment were created by this task. The local configuration uses the explicit placeholder database ID `local-reddpixel-cms`.

The existing Pages project is `reddpixel`. The repository's Wrangler file is local-only: it omits `pages_build_output_dir`, so it will not replace the live dashboard configuration. See [DEPLOYMENT.md](DEPLOYMENT.md) for the GitHub preview and production workflow.

1. In your existing Cloudflare account, create/select a D1 database and an R2 bucket for this portfolio. The optional CLI commands are `npx wrangler d1 create reddpixel-cms` and `npx wrangler r2 bucket create reddpixel-media`.
2. Bind **CMS_DB** and **CMS_MEDIA** to the existing Pages project in its dashboard. Preserve its existing Groq and origin configuration. If switching to configuration in source control, back up the local file and download/review the existing live configuration first; only then opt in with `pages_build_output_dir` and real resource IDs.
3. Apply `migrations/0001_cms.sql` to the selected live database. For CLI migrations, use a reviewed configuration containing that database's real ID, then run `npx wrangler d1 migrations apply CMS_DB --remote --config <reviewed-config-path>`. Confirm the database/account first; the current local placeholder is not a live migration target.
4. Choose your production password using `npm run cms:password`, then set **ADMIN_PASSWORD_HASH** as a secret in the existing Pages project. Set a separate preview secret if using preview deployments. The raw password never belongs in frontend code.
5. Build and deploy to the existing Pages project with its normal pipeline, including this repository's `functions/` directory. Do not deploy to a guessed project name.
6. Check `/admin/`, draft preview privacy, a real upload/video, comment approval, published article HTML and `/sitemap.xml` on the actual HTTPS domain.

Local data does not automatically copy to production. Changing the database ID may also create a separate local database namespace; rerun local migrations for that ID. Keep local backups before switching. Choose which real content to move deliberately.

The Vite Cloudflare Workers plugin was removed from the frontend config because the backend uses Pages Functions and a Pages Wrangler configuration. No dependency was added. The original plugin dependency remains installed for compatibility; it no longer generates a conflicting Workers deployment redirect.

## Verification

`npm run build`, `npm run lint`, `npm run check:seo` and `npm run test:oracle` cover the existing app. `node --experimental-strip-types scripts/check-content.ts` checks that article editing preserves the original paragraphs/code and rejects unsafe content paths/links. `node scripts/check-cms.mjs` runs integration checks against the local Pages preview using the ignored local test password. It exercises temporary drafts and public test content, then returns it to private status; do not point it at production.

Single-owner authentication uses a salted password hash, opaque eight-hour sessions stored as token hashes, HttpOnly/SameSite cookies, Secure on HTTPS, exact-origin and CSRF checks on mutations, bounded request bodies and safe text rendering. This is a single-owner studio, with no team roles or password recovery service.

Cloudflare references: [Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/), [D1 migration commands](https://developers.cloudflare.com/d1/wrangler-commands/), [R2 Worker API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/), [FixedLengthStream](https://developers.cloudflare.com/workers/runtime-apis/streams/transformstream/).
