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

The editor currently saves private drafts locally. Publishing to Git-backed post files can be added as the next admin slice.
