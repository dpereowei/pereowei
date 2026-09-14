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

## GitHub Pages Deployment

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

To publish:

1. Push the project to a GitHub repository.
2. In GitHub, open **Settings > Pages**.
3. Set **Build and deployment** source to **GitHub Actions**.
4. Push to `main` or run the workflow manually.

## Blog Publishing Later

The first version uses static blog previews. A later pass can add MDX posts and an `/admin` authoring flow backed by Git commits.
