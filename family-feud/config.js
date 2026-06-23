/* ============================================================
   Dilwale Family Feud — Configuration
   ------------------------------------------------------------
   This module has NO backend. It reads its data from one of:
     1. A published Google Sheet (CSV)         -> set SOURCE = 'sheets'
     2. The bundled local CSV files in /data   -> set SOURCE = 'local'
     3. Whatever you saved from the Admin page  -> always wins if present
        (stored in the browser via localStorage)

   To use Google Sheets (recommended for a real party):
     - Make a Google Sheet with two tabs: "Rounds" and "Answers"
       (column layout matches data/rounds.csv and data/answers.csv).
     - File > Share > Publish to web.
     - Publish EACH tab as "Comma-separated values (.csv)".
     - Paste the two published URLs below and set SOURCE = 'sheets'.
   See README.md for step-by-step screenshots-style instructions.
   ============================================================ */

window.FEUD_CONFIG = {
  // 'sheets' = read from the published Google Sheet URLs below.
  // 'local'  = read the bundled CSV files in ./data (great for testing & offline).
  SOURCE: 'local',

  // Published-to-web CSV links (one per tab). Only used when SOURCE = 'sheets'.
  // They look like:
  // https://docs.google.com/spreadsheets/d/e/<long-id>/pub?gid=<TAB_GID>&single=true&output=csv
  SHEETS: {
    ROUNDS_CSV_URL: 'PASTE_YOUR_PUBLISHED_ROUNDS_TAB_CSV_URL_HERE',
    ANSWERS_CSV_URL: 'PASTE_YOUR_PUBLISHED_ANSWERS_TAB_CSV_URL_HERE'
  },

  // Bundled fallback files (used when SOURCE = 'local').
  LOCAL: {
    ROUNDS_CSV_URL: './data/rounds.csv',
    ANSWERS_CSV_URL: './data/answers.csv'
  },

  // ---- Game presentation options ----
  GAME_TITLE: 'Dilwale Family Feud',
  TOP_N: 8,                 // max answers shown per round (board has 8 slots)
  SPLASH_SECONDS: 14,       // intro splash length; set 0 to skip
  TEAMS: {
    spades: { name: 'Spades & Clubs', icon: '♠️♣️' },
    hearts: { name: 'Hearts & Diamonds', icon: '♥️♦️' }
  },

  // localStorage key the Admin page writes to and the game reads first.
  STORAGE_KEY: 'dilwale_family_feud_data_v1'
};
