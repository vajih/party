# 🎪 Dilwale Family Feud — standalone module

A desi twist on Family Feud. **No backend, no Supabase.** It runs as plain static files
and reads its data from either bundled CSVs or a published Google Sheet. It even plays
itself in **Auto-Demo** mode — open the URL and watch.

## What's in here

```
family-feud/
├── index.html        ← the game (Home → Auto-Demo / Host / Admin)
├── admin.html        ← editor: curate rounds + answers, Save & Play, export to Sheets
├── config.js         ← data source + presentation settings (edit me)
├── feud-data.js      ← shared CSV/localStorage data layer (no need to edit)
├── data/
│   ├── rounds.csv    ← round config (sample data)
│   └── answers.csv   ← curated answers + counts (sample data)
├── assets/           ← sounds + images (self-contained)
├── vercel.json       ← Vercel static config
└── DEPLOY.md         ← publish steps
```

## Three ways to run it

1. **Auto-Demo** — the home screen's first button. Plays the whole 5-round tournament by
   itself on a loop. Great for a screen at a party, or to show Mohammed what it does.
2. **Host a Game** — you click answers to reveal them, track team scores, strikes, etc.
   Keyboard shortcuts: `1`–`8` reveal, `S` strike, `R` reset, `N` next round, `←/→` switch team.
3. **Admin** — edit the answers and counts, then **Save & Play** (stores in your browser, works
   offline) or **Export to Sheets** to publish the same data for everyone.

## Run locally

It must be served over http (the game `fetch`es the CSVs), so don't just double-click the file:

```bash
cd family-feud
python3 -m http.server 8080
# open http://localhost:8080
```

## Data: bundled CSV vs Google Sheets

`config.js` controls the source:

- `SOURCE: 'local'` (default) → reads the bundled `data/*.csv`. Works instantly, offline.
- `SOURCE: 'sheets'` → reads two **Published-to-web** Google Sheet CSV links you paste in.

### Switching to Google Sheets (read-only, no API keys)

1. Make a Google Sheet with two tabs named **Rounds** and **Answers**.
   Match the columns in `data/rounds.csv` and `data/answers.csv`.
   (The Admin page's **Export to Sheets** generates these two CSV blocks for you.)
2. **File → Share → Publish to web**.
3. Publish **each tab** as **Comma-separated values (.csv)**. Copy the two links.
4. Paste them into `config.js` → `SHEETS.ROUNDS_CSV_URL` / `ANSWERS_CSV_URL`, and set
   `SOURCE: 'sheets'`.
5. Redeploy (or just refresh, if running locally).

Note: published CSV is **read-only** — that's why edits happen in the Admin page and then
get pasted/published to the Sheet. The Admin page's **Save & Play** is the instant path that
needs no Sheet at all.

## Deploy

See **DEPLOY.md**. Short version: it's static, so any host works — Vercel, Netlify, GitHub Pages.
