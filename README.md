# Pereowei Daniel Portfolio

My personal portfolio, built with React and Vite.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Netlify Deployment and Private Admin

Netlify hosts the static site and the GitHub OAuth functions required by `/#/admin`.

1. Import `dpereowei/pereowei` into Netlify. It reads the build settings from `netlify.toml`.
2. Add the custom domain `pereowei.weidantech.com` in Netlify, then replace the existing GitHub Pages DNS record with the DNS record Netlify provides.
3. Create a GitHub OAuth App. Set its callback URL to `https://pereowei.weidantech.com/.netlify/functions/auth-callback`.
4. In Netlify, create `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `SESSION_SECRET` with the **Functions** scope. Generate `SESSION_SECRET` with a password manager or `openssl rand -base64 32`.

The OAuth functions accept only the public GitHub login `dpereowei`. The GitHub access token never leaves the server-side callback; the browser receives a signed, short-lived `HttpOnly` session cookie.

## Writing and Publishing

Open `/#/admin` and sign in with the authorised GitHub account. The writing room supports Markdown, GFM tables and task lists, links, code blocks, and images. The preview and public article reader use the same safe renderer; raw HTML and unsafe URL protocols are not executed.

- **Save draft** stores the working article in Netlify Blobs, behind the admin session. A local recovery copy is also kept on the current device. Existing local-only drafts are imported when the editor opens.
- **Publish** (or **Update article**) makes a snapshot immediately available in the public blog. Subsequent draft saves do not change that snapshot.
- **Saved articles** opens existing drafts or published posts, including the three original bundled articles. The URL slug is fixed after the first save. **Reload saved articles** retrieves the latest revisions; stale saves are rejected instead of overwriting newer changes.
- **Unpublish** removes the public snapshot and retains the working draft. Original bundled articles are also suppressed when unpublished.
- The formatting toolbar edits the Markdown source. Image upload accepts PNG, JPEG, WebP and GIF up to 3 MB. Uploading saves the draft first; save or publish again to retain the inserted image reference. Unpublished uploads are only served to the admin, and public access requires the image to be referenced by its owning published article. HTTPS image URLs can also be inserted, but third-party images follow their host's availability and privacy policies.

Netlify automatically provides Blobs credentials to deployed Functions; there is no new GitHub token or rebuild step for publishing. Storage is site-wide and persists across deploys. The production store names are `portfolio-blog-documents` and `portfolio-blog-media`. Other deploy contexts use a deploy-ID suffix so previews cannot modify production articles. Keep Netlify's `CONTEXT` environment value available to Functions. Local testing needs `netlify dev` (or an isolated test store), not plain Vite, for Functions and Blobs access.

Drafts and uploads are **not committed to this public GitHub repository**. Export/back up Netlify Blobs before deleting or transferring the Netlify site. An unavailable publishing service leaves the editor's local recovery copy intact and reports the failure instead of claiming publication succeeded.

## Verification

`npm test` covers session checks, async editor reveals, draft privacy, CSRF rejection, optimistic concurrency, publishing/unpublishing, upload signatures and limits, and safe Markdown rendering. `npm run build` checks the production bundle. `npm audit --omit=dev` checks production dependencies; development tooling may have separate advisories and is not served in production.
