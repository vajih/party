/* ============================================================
   feud-data.js — shared data layer for the game + admin page
   No backend, no Supabase. Pure CSV + localStorage.
   ============================================================ */
(function (global) {
  'use strict';

  const CFG = global.FEUD_CONFIG || {};

  /* ---------- RFC-4180-ish CSV parser (handles quotes, commas, newlines) ---------- */
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    text = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else { field += c; }
      } else {
        if (c === '"') { inQuotes = true; }
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else { field += c; }
      }
    }
    // trailing field/row
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

    // drop fully-empty rows
    const cleaned = rows.filter(r => r.some(v => String(v).trim() !== ''));
    if (cleaned.length === 0) return [];

    const headers = cleaned[0].map(h => h.trim().toLowerCase());
    return cleaned.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (r[idx] !== undefined ? r[idx] : '').trim(); });
      return obj;
    });
  }

  /* ---------- turn raw CSV rows into structured game data ---------- */
  function buildModel(roundRows, answerRows) {
    const topN = CFG.TOP_N || 8;

    const rounds = roundRows
      .filter(r => r.id)
      .map(r => ({
        order: parseInt(r.order, 10) || 0,
        id: String(r.id).trim(),
        title: r.title || r.id,
        question: r.question || '',
        emoji: r.emoji || '🎯',
        survey_count: parseInt(r.survey_count, 10) || 0
      }))
      .sort((a, b) => a.order - b.order);

    const answersByRound = {};
    rounds.forEach(rd => { answersByRound[rd.id] = []; });

    answerRows.forEach(a => {
      const rid = String(a.round_id || '').trim();
      const name = String(a.answer || '').trim();
      const count = parseInt(a.count, 10) || 0;
      if (!rid || !name || !answersByRound[rid]) return;
      answersByRound[rid].push({ name: name, count: count, rank: parseInt(a.rank, 10) || null });
    });

    // sort each round's answers by count desc (rank as tiebreaker) and cap at topN
    Object.keys(answersByRound).forEach(rid => {
      answersByRound[rid] = answersByRound[rid]
        .sort((x, y) => (y.count - x.count) || ((x.rank || 99) - (y.rank || 99)))
        .slice(0, topN);
    });

    return { rounds, answersByRound };
  }

  /* ---------- fetch helpers ---------- */
  async function fetchCSV(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Fetch failed (' + res.status + ') for ' + url);
    return parseCSV(await res.text());
  }

  function sourceUrls() {
    const mode = (CFG.SOURCE || 'local').toLowerCase();
    const block = mode === 'sheets' ? CFG.SHEETS : CFG.LOCAL;
    return { mode, ...block };
  }

  /* ---------- localStorage (admin overrides) ---------- */
  function loadLocalOverride() {
    try {
      const raw = localStorage.getItem(CFG.STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.rounds)) return data;
    } catch (e) { /* ignore */ }
    return null;
  }

  function saveLocalOverride(model) {
    localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(model));
  }

  function clearLocalOverride() {
    localStorage.removeItem(CFG.STORAGE_KEY);
  }

  /* ---------- the one function the game calls ---------- */
  async function loadGameData() {
    // 1) Admin override always wins (lets you run a live party with no sheet round-trip)
    const override = loadLocalOverride();
    if (override) {
      return { source: 'browser (saved from Admin)', ...normalizeModel(override) };
    }
    // 2) Otherwise the configured source
    const { mode, ROUNDS_CSV_URL, ANSWERS_CSV_URL } = sourceUrls();
    const [roundRows, answerRows] = await Promise.all([
      fetchCSV(ROUNDS_CSV_URL),
      fetchCSV(ANSWERS_CSV_URL)
    ]);
    return { source: mode === 'sheets' ? 'Google Sheet' : 'bundled data', ...buildModel(roundRows, answerRows) };
  }

  // re-apply sorting/cap to an override object that may be in admin shape
  function normalizeModel(model) {
    const roundRows = model.rounds.map((r, i) => ({
      order: r.order != null ? r.order : i + 1,
      id: r.id, title: r.title, question: r.question, emoji: r.emoji,
      survey_count: r.survey_count
    }));
    const answerRows = [];
    Object.keys(model.answersByRound || {}).forEach(rid => {
      (model.answersByRound[rid] || []).forEach((a, i) => {
        answerRows.push({ round_id: rid, rank: a.rank || i + 1, answer: a.name, count: a.count });
      });
    });
    return buildModel(roundRows, answerRows);
  }

  /* ---------- CSV export (admin -> Google Sheets) ---------- */
  function escapeCSV(v) {
    v = (v == null ? '' : String(v));
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function modelToRoundsCSV(model) {
    const lines = ['order,id,title,question,emoji,survey_count'];
    model.rounds.forEach((r, i) => {
      lines.push([r.order || i + 1, r.id, r.title, r.question, r.emoji, r.survey_count || 0]
        .map(escapeCSV).join(','));
    });
    return lines.join('\n');
  }

  function modelToAnswersCSV(model) {
    const lines = ['round_id,rank,answer,count'];
    model.rounds.forEach(r => {
      (model.answersByRound[r.id] || []).forEach((a, i) => {
        lines.push([r.id, a.rank || i + 1, a.name, a.count].map(escapeCSV).join(','));
      });
    });
    return lines.join('\n');
  }

  global.FeudData = {
    parseCSV, buildModel, fetchCSV, sourceUrls,
    loadGameData, normalizeModel,
    loadLocalOverride, saveLocalOverride, clearLocalOverride,
    modelToRoundsCSV, modelToAnswersCSV
  };
})(window);
