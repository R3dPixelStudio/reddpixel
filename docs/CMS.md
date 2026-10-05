# REDDPIXEL Content Studio

The working studio is at `/admin/`. It writes articles, work entries, media and comment moderation to Cloudflare Pages Functions, D1. Publishing changes the live HTML and sitemap without another frontend build. Repository content remains the starting collection.

## Local preview

The current preview is running at `http://127.0.0.1:8788/`. Open `/admin/`. Its temporary local password is in the ignored `.local-cms-password.txt`; it is not embedded in the app, screenshots or documentation. Keep `.dev.vars`, the password file and `.wrangler/` out of source control and deployments.

To run it again:

```powershell
npm run cms:password
npm run cms:migrate:local
npm run cms:preview
```

`cms:password` asks you to choose at least 16 characters and writes only a salted PBKDF2 hash to `.dev.vars`, preserving other secrets. Terminal input is visible, so run it in your own terminal. A password change takes effect after restarting the preview. Existing sessions expire after eight hours. Changing ADMIN_PASSWORD_HASH immediately invalidates existing sessions after deployment/restart; sign in again.

`npm run dev` remains the Vite frontend workflow. Use the Pages preview for actual storage, uploads, comments and authentication. Local D1 data persists in `.wrangler/state/` between restarts.

## Writing and publishing

1. Open **Posts → New article**. Enter title, a unique lowercase hyphenated slug, summary, category and reading time.
2. Write `## Heading` before each section. Separate paragraphs with a blank line. A section supports one fenced code block using triple backticks. HTML is rendered as text, preventing script injection.
3. Optionally use **Upload file** or **Choose from library** in the article cover. The path is attached automatically; review its image description.
4. Save as **Draft**. The list offers **Preview saved draft**; this preview requires an authenticated session and is marked noindex/no-store. Unsaved edits are not part of that preview.
5. Choose **Published** and save. The article, index and sitemap update immediately. Save it as Draft to take it offline without deleting it. The URL slug is fixed after creation to avoid accidentally breaking links.

Publishing adds a server timestamp. Existing repository articles do not acquire a invented historical publication date. Concurrent saves use version checks; after a conflict, reload the entry and reconcile your edits.

## Work collections and uploads

**Work collections → New work** lets you add to Websites, Visuals or Technical work. Enter a truthful description, a cover and its description. Websites can have an HTTPS destination. Add gallery rows for photos or timelapses.

Use **Upload file / Replace file** directly in the cover and gallery editors, or **Choose from library** to reuse an uploaded file. **Upload gallery files** adds several photos/timelapses in order. The first uploaded gallery image also becomes the cover if the cover is empty. Review the descriptions, then save the work. To change existing repository work, open its Edit work button: saving creates a database override without modifying the original source images.

Uploads use the existing **CMS_DB** database, with no R2 binding, billing activation or new account. Images accept JPEG/PNG/WebP up to 8 MB; video accepts MP4/WebM up to 20 MB. Compress photos and short timelapses before uploading. The Media page shows the storage meter. A 300 MB media budget reserves space within D1's 500 MB free database limit for articles/comments and database overhead. Free daily read/write and Workers request limits still apply: this is suitable for a small portfolio library, not a large video archive. Keep large videos in the repository or a dedicated video host.

The server uploads files in bounded 256 KB requests into database BLOB chunks, checks size and file signature, reserves capacity atomically, and only exposes complete uploads. Failed uploads release their reservation/chunks; interrupted uploads are reclaimed after an hour on the next upload. Public media supports byte ranges and immutable caching for video seeking. Videos use controls, playsInline and metadata preload; nothing autoplays. The two new tables are created idempotently on the first authenticated Media request/upload; `migrations/0002_media_storage.sql` is also included for normal migrations. Existing content is preserved. Legacy R2-backed files remain readable only if their old binding still exists; new uploads always use D1.

Uploaded media URLs are public assets, even before an article/work is published. Draft **text** is private. Upload only material intended for the website. Removing a gallery row detaches it from the work and leaves the original media in the library. The studio provides reversible draft/hide actions, not permanent content deletion.

Public collections, native homepage HTML and article pages read published D1 content. Homepage branch previews still avoid AlphaTradeZone and 3D Architect. The Oracle's existing public-data prompt remains repository based; admin work changes do not rewrite its verified biography automatically.

## Comments

Visitors can submit a name and thought on a published article. Every new comment is pending and absent from public HTML until you approve it. **Comments** shows pending entries first. Save a reply with approval to publish both; **Hide** makes it private again. Replies are labeled Arash / REDDPIXEL. Nothing sends email or social messages. The queue returns up to 500 entries and an article shows up to 200 approved comments.

There is a hidden bot field and a persistent per-IP submission limit. Login attempts are also rate limited. Sign-in allows five attempts per IP in 15 minutes, plus a site-wide ceiling of 30 attempts per minute before expensive password verification. Counters update atomically and return Retry-After. Authenticated uploads are limited to 60 in ten minutes per session. There is no CAPTCHA service or tracking dependency. Limits reduce guessing and spam; they cannot prevent every attack or protect a stolen password. For stronger protection, use a unique long password and Cloudflare Access with MFA in front of both `/admin/*` and `/api/cms/session` (protecting only the admin page leaves the sign-in API exposed). Do not put Access in front of public `/api/cms/work` or comment submission.

## Connect the live site

The website is deployed, but the live content studio also needs its database and password secret. The local configuration uses the explicit placeholder database ID `local-reddpixel-cms`; local bindings do not configure production.

The existing Pages project is `reddpixel`. The repository's Wrangler file is local-only: it omits `pages_build_output_dir`, so it will not replace the live dashboard configuration. See [DEPLOYMENT.md](DEPLOYMENT.md) for the GitHub preview and production workflow.

1. In your existing Cloudflare account, create/select the D1 database `reddpixel-cms` for this portfolio. No R2 account or payment activation is required.
2. Bind **CMS_DB** to the existing Pages project in its dashboard. Preserve its existing Groq and origin configuration. The existing live database binding continues working after this update.
3. Apply `migrations/0001_cms.sql` to the selected live database if it has not already been applied. New media tables initialize automatically on the first authenticated upload/library request; optionally apply `0002_media_storage.sql` yourself. Both migrations are additive and preserve existing content. The local placeholder database ID is not a live migration target.
4. Choose your production password using `npm run cms:password`, then set **ADMIN_PASSWORD_HASH** as a secret in the existing Pages project. Set a separate preview secret if using preview deployments. The raw password never belongs in frontend code.
5. Build and deploy to the existing Pages project with its normal pipeline, including this repository's `functions/` directory. Do not deploy to a guessed project name.
6. Check `/admin/`, draft preview privacy, a real upload/video, comment approval, published article HTML and `/sitemap.xml` on the actual HTTPS domain.

### Dashboard setup when Wrangler sign-in fails

- Open **D1 SQL database → reddpixel-cms → Console**. Copy the complete SQL from `migrations/0001_cms.sql` and execute it. It creates the studio tables and indexes without deleting existing tables. Confirm you selected this portfolio's database before executing it.
- Open **Workers & Pages → reddpixel → Settings → Bindings** and select the **Production** environment. Add a D1 binding named exactly `CMS_DB`, selecting `reddpixel-cms`. No CMS_MEDIA binding is needed.
- In your own terminal, inside `E:\my final redd`, run `npm run cms:password` and choose your private password. Open the ignored `.dev.vars` file yourself and copy only the value of `ADMIN_PASSWORD_HASH`, without surrounding quotation marks. Do not paste the file or password into chat.
- In the project's **Settings → Variables and Secrets**, select **Production** and add `ADMIN_PASSWORD_HASH` as a secret with that hash value. Preserve existing variables and secrets.
- Redeploy the latest production commit from **Deployments**. Bindings and secret changes need a new deployment. Reopen `https://reddpixel.com/admin/` and sign in with your chosen password.

Preview deployments have their own environment settings. Configure them separately if you need the studio in previews. The public portfolio and repository blog work while the studio is unconfigured; `/admin/` shows setup instructions instead of a password form until its required bindings are present.

Local data does not automatically copy to production. Changing the database ID may also create a separate local database namespace; rerun local migrations for that ID. Keep local backups before switching. Choose which real content to move deliberately.

The Vite Cloudflare Workers plugin was removed from the frontend config because the backend uses Pages Functions and a Pages Wrangler configuration. No dependency was added. The original plugin dependency remains installed for compatibility; it no longer generates a conflicting Workers deployment redirect.

## Verification

`npm run build`, `npm run lint`, `npm run check:seo` and `npm run test:oracle` cover the existing app. `node --experimental-strip-types scripts/check-content.ts` checks that article editing preserves the original paragraphs/code and rejects unsafe content paths/links. `node scripts/check-cms.mjs` runs integration checks against the local Pages preview using the ignored local test password. It exercises temporary drafts and public test content, then returns it to private status; do not point it at production.

Single-owner authentication uses a salted password hash, opaque eight-hour sessions stored as token hashes, HttpOnly/SameSite cookies, Secure on HTTPS, exact-origin and CSRF checks on mutations, bounded request bodies and safe text rendering. This is a single-owner studio, with no team roles or password recovery service.

Cloudflare references: [Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/), [D1 migration commands](https://developers.cloudflare.com/d1/wrangler-commands/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 free pricing/quotas](https://developers.cloudflare.com/d1/platform/pricing/), [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).


`npm run test:security` checks atomic throttling/session invalidation and media chunk integrity, cleanup and capacity against SQLite. To test without owner credentials, run `npm run build`, `node scripts/prepare-cms-test.mjs`, then initialize/start Pages using `--cwd .task-baseline/cms-fixture`. Set `CMS_TEST_ORIGIN` and `CMS_TEST_PASSWORD_FILE` to that isolated local preview before `npm run test:cms`. This fixture has no R2 binding and never copies the owner secret files.
