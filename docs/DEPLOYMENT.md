# Updating REDDPIXEL on GitHub and Cloudflare

Repository: `https://github.com/R3dPixelStudio/reddpixel`
Existing Cloudflare Pages project: `reddpixel`
Production site: `https://reddpixel.com/`

## Local Git connection

Work from `E:\my final redd`. This folder is connected to the existing `main` history; initialization did not replace the edited website files. GitHub Desktop can add it through **File → Add local repository**.

Do not download a repository ZIP and expect it to retain Git history. For another computer, use `git clone https://github.com/R3dPixelStudio/reddpixel.git`.

Review changes before committing. Local secrets, CMS state, build output, dependencies and task backups are ignored. Never force-push this update over the existing history.

## Preview, then production

1. Push the update branch and open its pull request against `main`.
2. In the existing Pages project, confirm the Git repository is `R3dPixelStudio/reddpixel`, the production branch is `main`, the build command is `npm run build`, and the output directory is `dist`. Preserve existing environment variables, secrets and domain settings.
3. If preview branches are enabled, open the Cloudflare preview link attached to the pull request/check. If no build starts, inspect branch deployment controls in Pages.
4. Test `/`, direct `/#about`, `/#work`, `/#contact`, Back/Forward, mobile navigation, collections/carousels, `/blog/`, the first article and `/sitemap.xml`.
5. Configure the CMS before relying on `/admin/`, uploads or comments. See [CMS.md](CMS.md).
6. After the preview passes, merge into the configured production branch. Confirm the resulting deployment succeeded and repeat the key checks on `reddpixel.com`.

## Cloudflare configuration

`wrangler.jsonc` currently supplies **local** D1/R2 bindings. Its `local-reddpixel-cms` ID is not a live database. The file deliberately omits `pages_build_output_dir`, leaving the existing Pages project's deployment configuration in the dashboard. Local preview commands pass `dist` explicitly.

Do not add `pages_build_output_dir` while the file still contains local placeholders. That key opts Pages into using the Wrangler file as deployment configuration. [Cloudflare's configuration guidance](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).

Before switching to configuration in source control, back up the local file, sign in with Wrangler, download the existing project's configuration, and review all production/preview bindings and variables. Preserve the original local database ID if you need to keep using its local data. Secrets remain in Cloudflare, never in Git.

Required CMS setup: a migrated D1 database bound as `CMS_DB`, an R2 bucket bound as `CMS_MEDIA`, and the owner-selected `ADMIN_PASSWORD_HASH` secret. Configure preview separately from production when possible. Public repository articles and work remain readable without CMS bindings; admin editing, uploads and comments require them.

## Before pushing code changes

Cloudflare's current build uses Node `22.16.0` and npm `10.9.2`. Commit `package.json` and `package-lock.json` together after dependency changes. Verify `npm ci` in a separate clean checkout with the same versions: building with existing `node_modules` does not check lockfile completeness. If clean installation reports missing lockfile packages, regenerate the lockfile with `npm install --package-lock-only --include=optional` in that clean checkout and commit the result; keep Cloudflare's clean installation enabled.

```powershell
npm run build
npm run lint
npm run check:seo
npm run test:navigation
npm run test:cube
npm run test:oracle
npm run test:content
git status
```

The CMS integration test is for the local Pages preview only. Do not run its temporary-content workflow against the production database.
