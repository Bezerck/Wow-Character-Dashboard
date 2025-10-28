## WoW Character Dashboard

Static-exported Next.js app intended for GitHub Pages hosting.

### Local Development

Run the dev server:

```bash
yarn dev
```

### Static Export (what Pages serves)

```bash
NEXT_PUBLIC_BASE_PATH=/Wow-Character-Dashboard yarn export
```

This produces an `out/` folder containing static assets. You can preview it locally with any static server:

```bash
npx serve out
```

Visit: http://localhost:3000/Wow-Character-Dashboard/ (adjust port printed by `serve`).

### GitHub Pages Deployment

The workflow `.github/workflows/deploy.yml` builds and exports the site with the base path set to `/Wow-Character-Dashboard` so all `_next/*` asset URLs resolve correctly under `https://<user>.github.io/Wow-Character-Dashboard/`.

Key points:

1. `next.config.js` sets `output: 'export'`, `basePath`, and `assetPrefix` from `NEXT_PUBLIC_BASE_PATH`.
2. Images and icon use relative paths (`assets/logo.png`) instead of root-relative so they work under a subdirectory.
3. Use `yarn export` (fixed script) rather than the incorrect `next output`.

### Troubleshooting 404s

If you see 404s for `_next/static/*` or images:

- Confirm the environment variable `NEXT_PUBLIC_BASE_PATH` matches the repository name prefixed with a slash.
- Ensure you accessed the site at `https://<user>.github.io/<repo-name>/` not the root profile URL.
- Verify `out/_next/` exists in the artifact (Actions > Workflow run > Artifacts).
- Clear browser cache or disable service workers (if previously deployed differently).

### Notes About API Routes

This project currently includes API routes (`/api/characters`, `/api/proxy`). With `output: 'export'` they are turned into static HTML files and will NOT execute server logic on GitHub Pages. Client-side fetch calls to these routes will 404 or return the static placeholder. To use these features you need a real server (Vercel, Netlify, etc.) or refactor to client-side only storage (e.g., localStorage) / external CORS-safe APIs.

If you want those API routes working, remove `output: 'export'` and deploy on a platform that supports Next.js server functions (Vercel recommended). For pure Pages hosting keep or delete the API folder to avoid confusion.

### Future Improvements

- Migrate character persistence to localStorage only (already mostly done).
- Remove proxy route or replace with a third-party API that supports CORS directly.
- Add lightweight tests for core utilities.
