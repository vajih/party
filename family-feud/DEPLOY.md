# 🚀 Deploy (publicly, in ~2 minutes)

This is a 100% static site, so there's no build step. Pick any one path.

## Option A — Vercel CLI (fastest if you have it)

```bash
cd family-feud
npx vercel --prod
```

The first run asks you to log in (browser opens once) and to confirm the project name.
When it finishes it prints a public URL like `https://family-feud-xxxx.vercel.app`.
That's the link to share.

> Set `family-feud/` as the **Root Directory** if Vercel asks — there's no framework, it's just static files.

## Option B — Vercel dashboard (no terminal)

1. Go to https://vercel.com/new
2. Import the GitHub repo (or drag-and-drop the `family-feud` folder).
3. Framework preset: **Other** / no build command. Output dir: `.`
4. Deploy → copy the public URL.

## Option C — Netlify drop (zero account hassle)

Go to https://app.netlify.com/drop and drag the `family-feud` folder onto the page.
You get an instant public URL.

## Option D — GitHub Pages

This repo already serves on GitHub Pages. Commit `family-feud/` and it'll be reachable at
`https://<user>.github.io/party/family-feud/`.

---

### After deploying

- The site works immediately on the **bundled sample data** (`SOURCE: 'local'`).
- To switch everyone to a live Google Sheet, follow the Sheets steps in `README.md`,
  update `config.js`, and redeploy.
