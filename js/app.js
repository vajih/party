import { auth, supabase } from './auth.js';
import { byId, slugify, fmtDate, copyToClipboard } from './util.js';

/* ------------ Config for uploads ------------ */
const STORAGE_BUCKET = 'party-media';
const MAX_IMAGE_MB = 8;

/* ------------ Elements ------------ */
const modeBadge = byId('modeBadge');

const authSection = byId('authSection');
const authMsg     = byId('authMsg');
const authForm    = byId('authForm');
const authEmail   = byId('authEmail');
const signOutBtn  = byId('signOutBtn');

const hostCard        = byId('hostCard');
const createPartyForm = byId('createPartyForm');
const partyTitle      = byId('partyTitle');
const partyDate       = byId('partyDate');
const partyVenue      = byId('partyVenue');
const partyDesc       = byId('partyDesc');
const partyExpected   = byId('partyExpected');
const partySlug       = byId('partySlug');
const hostPartiesList = byId('hostPartiesList');

const newGameForm     = byId('newGameForm');
const hostPartySelect = byId('hostPartySelect');
const gameType        = byId('gameType');
const gameTitle       = byId('gameTitle');
const hostGamesList   = byId('hostGamesList');

const partyCard   = byId('partyCard');
const partyHeader = byId('partyHeader');
const partyShare  = byId('partyShare');

/* Tabs DOM */
const tabsWrap   = byId('tabsWrap');
const tablistEl  = byId('tablist');
const panelsEl   = byId('panels');
const aboutTpl   = byId('aboutPanelTpl');
const gameTpl    = byId('gamePanelTpl');
const tabTpl     = byId('tabButtonTpl');

/* Legacy grid (unused visual) */
const partyGames  = byId('partyGames');

const welcomeCard      = byId('welcomeCard');
const welcomeForm      = byId('welcomeForm');
const welcomeEmail     = byId('welcomeEmail');
const welcomeStepEnter = byId('welcomeStepEnter');
const welcomeStepSent  = byId('welcomeStepSent');
const sentEmailText    = byId('sentEmailText');
const resendLinkBtn    = byId('resendLinkBtn');
const welcomeTitle     = byId('welcomeTitle');
const welcomeSubtitle  = byId('welcomeSubtitle');

const backToDashBtn   = byId('backToDashBtn');
const hostTools       = byId('hostTools');
const editPartyToggle = byId('editPartyToggle');
const addGameToggle   = byId('addGameToggle');
const editPartyForm   = byId('editPartyForm');
const addGameHereForm = byId('addGameHereForm');
const editTitle = byId('editTitle');
const editDate  = byId('editDate');
const editVenue = byId('editVenue');
const editDesc  = byId('editDesc');
const editExpected = byId('editExpected');
const addGameType  = byId('addGameType');
const addGameTitle = byId('addGameTitle');

/* Manage hosts UI */
const manageHostsToggle = byId('manageHostsToggle');
const manageHostsForm   = byId('manageHostsForm');
const cohostEmail       = byId('cohostEmail');
const cohostRole        = byId('cohostRole');
const hostsList         = byId('hostsList');

/* Moderation list (dashboard) */
const refreshMod = byId('refreshMod');
const modList    = byId('modList');

/* ------------ State ------------ */
let session = null;
let user    = null;
let currentParty = null;
let isHostForCurrentParty = false;

// Tabs state
let games = [];
let submissionsByGame = new Map(); // game_id -> submission

// Charts state
let zodiacChart;

/* ------------ Local helpers ------------ */
function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function hideEl(el){ if(!el) return; el.hidden = true; el.style.display = 'none'; }
function showEl(el, display=''){ if(!el) return; el.hidden = false; el.style.display = display; }
const qs = (sel, root=document) => root.querySelector(sel);

// Listen for host changes and reload party if we're viewing one
window.addEventListener('party-updated', () => {
  try {
    if (currentParty && currentParty.slug) {
      // reload current party to pick up new games/submissions
      loadParty(currentParty.slug).catch(e => console.error('reload party after update failed', e));
    }
  } catch (e) { console.error(e); }
});

// Cross-tab listener (BroadcastChannel) to receive party-updated messages
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    const bc = new BroadcastChannel('party-updates');
    bc.addEventListener('message', (ev) => {
      try {
        const msg = ev.data || {};
        if (msg && msg.type === 'party-updated') {
          // If viewing that party, reload
          if (currentParty && (msg.partyId === currentParty.id || msg.partySlug === currentParty.slug)) {
            loadParty(currentParty.slug).catch(e => console.error('bc reload failed', e));
          }
        }
      } catch (e) { console.error(e); }
    });
  } catch (e) { /* ignore if BroadcastChannel unsupported */ }
}

// Normalize game config which may be stored as JSON string or object
function normalizeConfig(cfg) {
  if (!cfg) return null;
  if (typeof cfg === 'string') {
    try { cfg = JSON.parse(cfg); } catch (e) { return null; }
  }
  if (typeof cfg !== 'object') return null;
  
  // Handle about_you game config specifically
  if (cfg.questions && Array.isArray(cfg.questions)) {
    cfg.questions = cfg.questions.map(q => {
      if (typeof q === 'string') return { label: q };
      if (typeof q === 'object') return { label: q.label || '', placeholder: q.placeholder || '' };
      return { label: '' };
    }).filter(q => q.label);
  }
  
  return cfg;
}

function setModeBadge(text) {
  if (!modeBadge) return;
  if (!text) { modeBadge.hidden = true; return; }
  modeBadge.textContent = text;
  modeBadge.hidden = false;
}

function installScrollShadows(scroller, leftShadow, rightShadow){
  if (!scroller || !leftShadow || !rightShadow) return;
  const update = () => {
    const { scrollLeft, scrollWidth, clientWidth } = scroller;
    leftShadow.style.opacity = scrollLeft > 2 ? '1' : '0';
    rightShadow.style.opacity = (scrollLeft + clientWidth) < (scrollWidth - 2) ? '1' : '0';
  };
  scroller.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  update();
}

/* ------------ Boot ------------ */
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('popstate', route);

backToDashBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  history.pushState({}, '', `${location.origin}${location.pathname}`);
  route();
});

async function init() {
  const { data } = await auth.getSession();
  session = data.session;
  user    = session?.user ?? null;
  renderAuth();

  auth.onChange((newSession) => {
    session = newSession;
    user    = session?.user ?? null;
    renderAuth();
    route();
  });

  welcomeForm?.addEventListener('submit', onWelcomeSubmit);
  authForm?.addEventListener('submit', onAuthSubmit);
  signOutBtn?.addEventListener('click', async () => { await auth.signOut(); setModeBadge(null); });

  createPartyForm?.addEventListener('submit', onCreateParty);
  // Only attach the dashboard-level new game handler if the form hasn't
  // been bound by the host dashboard module (which provides richer handling).
  try {
    if (newGameForm && !newGameForm.dataset.boundByDashboard) {
      newGameForm.addEventListener('submit', onAddGame);
    }
  } catch (e) { /* defensive */ }
  refreshMod?.addEventListener('click', renderModQueue);
  hostPartySelect?.addEventListener('change', () => {
    if (hostPartySelect.value) renderHostGames(hostPartySelect.value);
  });

  route();
}

/* ------------ Auth UI ------------ */
function renderAuth() {
  const signedIn = !!user;
  if (signedIn) {
    authMsg.innerHTML = `Signed in as <strong>${escapeHTML(user.email)}</strong>`;
    hideEl(authForm);
    showEl(signOutBtn);
    setModeBadge('Host Mode'); // default on dashboard; overridden on party page
  } else {
    authMsg.textContent = 'Sign in to continue';
    showEl(authForm, '');
    hideEl(signOutBtn);
    setModeBadge(null);
  }

  const onDashboard = !new URLSearchParams(location.search).get('party');
  if (onDashboard) {
    if (signedIn) {
      showEl(hostCard);
      renderHostParties();
      renderModQueue();
    } else {
      hideEl(hostCard);
      if (hostPartiesList) hostPartiesList.innerHTML = '';
      if (modList)         modList.innerHTML = '';
    }
  }
}

async function onAuthSubmit(e) {
  e.preventDefault();
  const email = (authEmail.value || '').trim();
  if (!email) return;
  const redirectTo = `${location.origin}${location.pathname}${location.search}`;
  const { error } = await auth.signInWithEmail(email, redirectTo);
  authMsg.textContent = error ? `Error: ${error.message}` : 'Check your email for a one-time sign-in link.';
  if (!error) authEmail.value = '';
}

/* ------------ Router ------------ */
function route() {
  const params = new URLSearchParams(location.search);
  const slug = params.get('party');

  if (slug) {
    hideEl(authSection);
    hideEl(hostCard);
    showEl(partyCard);
    loadParty(slug);
  } else {
    showEl(authSection);
    if (user) showEl(hostCard); else hideEl(hostCard);
    hideEl(partyCard);
  }
}

/* ------------ Parties: create & list ------------ */
async function onCreateParty(e) {
  e.preventDefault();
  if (!user) return alert('Please sign in first.');

  const title     = partyTitle.value.trim();
  const slugInput = partySlug.value.trim();
  let slug = slugify(slugInput || title);
  if (!slug) return alert('Please provide a title or slug.');

  slug = `${slug}-${Math.random().toString(36).slice(2,6)}`;
  const expected = Number(partyExpected.value || 0) || null;

  const { error } = await supabase.from('parties').insert({
    host_id: user.id,
    title,
    description: partyDesc.value.trim() || null,
    date: partyDate.value ? new Date(partyDate.value).toISOString() : null,
    venue: partyVenue.value.trim() || null,
    expected_guests: expected,
    slug
  });

  if (error) {
    alert(error.message);
  } else {
    partyTitle.value = partyDesc.value = partyVenue.value = partySlug.value = '';
    partyDate.value = '';
    partyExpected.value = '';
    await renderHostParties();
    alert('Party created!');
  }
}

async function renderHostParties() {
  if (!user) return;
  hostPartiesList.innerHTML = '<p class="muted">Loading…</p>';

  const { data: parties, error } = await supabase
    .from('parties')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    hostPartiesList.innerHTML = `<p>Error: ${error.message}</p>`;
    return;
  }

  if (!parties || parties.length === 0) {
    hostPartiesList.innerHTML = '<p class="muted">No parties yet. Create one above.</p>';
    hostPartySelect.innerHTML = '';
    hostGamesList.innerHTML = '';
    return;
  }

  hostPartySelect.innerHTML = parties.map(p =>
    `<option value="${p.id}">${escapeHTML(p.title)} (${escapeHTML(p.slug)})</option>`
  ).join('');

  const partsHTML = await Promise.all(parties.map(async (p) => {
    const expected = Number(p.expected_guests || 0);
    const regCount = await countRegistered(p.id);
    const pct = expected > 0 ? Math.min(100, Math.round((regCount / expected) * 100)) : 0;

    const url = `${location.origin}${location.pathname}?party=${encodeURIComponent(p.slug)}`;
    return `
      <div class="item">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
          <div style="flex:1;">
            <div><strong>${escapeHTML(p.title)}</strong></div>
            <div class="small">${fmtDate(p.date)} • ${escapeHTML(p.venue || '')}</div>
            <div class="small">Slug: <code>${escapeHTML(p.slug)}</code></div>
            <div class="small" style="margin-top:6px;">
              Registered: <strong>${regCount}</strong> / ${expected || '—'} ${expected ? `(${pct}%)` : ''}
            </div>
            <div class="progress" style="margin-top:6px;">
              <span style="width:${pct}%;"></span>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
            <button class="link copyBtn" data-url="${url}">Copy link</button>
            <a class="badge" href="?party=${encodeURIComponent(p.slug)}">Open</a>
          </div>
        </div>
      </div>
    `;
  }));

  hostPartiesList.innerHTML = partsHTML.join('');
  hostPartiesList.querySelectorAll('.copyBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      copyToClipboard(btn.dataset.url);
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy link'), 1200);
    });
  });

  hostPartiesList.dataset.partyIds = parties.map(p => p.id).join(',');

  if (hostPartySelect.value) renderHostGames(hostPartySelect.value);
}

async function countRegistered(partyId){
  const { count } = await supabase
    .from('party_profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('party_id', partyId);
  return count || 0;
}

/* Robust expected_guests fetch (avoids 400s) */
async function getExpectedGuests(partyId){
  try {
    // Try narrow select
    const { data, error } = await supabase
      .from('parties').select('expected_guests').eq('id', partyId).limit(1);
    if (error) throw error;
    const v = data?.[0]?.expected_guests;
    if (typeof v === 'number') return v;
    // Fallback to *
    const { data: d2 } = await supabase
      .from('parties').select('*').eq('id', partyId).limit(1);
    return Number(d2?.[0]?.expected_guests || 0);
  } catch (e) {
    console.warn('expected_guests fetch failed; assuming 0', e);
    return 0;
  }
}

/* Manage games list with progress */
async function renderHostGames(partyId){
  hostGamesList.innerHTML = '<p class="small">Loading…</p>';

  const [{ data: games }, expected] = await Promise.all([
    supabase.from('games').select('*').eq('party_id', partyId).order('created_at', { ascending: true }),
    getExpectedGuests(partyId)
  ]);

  // Fetch all submissions once and aggregate per game unique users
  const { data: subs } = await supabase
    .from('submissions')
    .select('game_id, user_id')
    .eq('party_id', partyId);

  const perGame = new Map();
  (subs || []).forEach(s => {
    if (!perGame.has(s.game_id)) perGame.set(s.game_id, new Set());
    perGame.get(s.game_id).add(s.user_id);
  });

  if (!games || games.length === 0) { hostGamesList.innerHTML = '<p class="small">No games yet.</p>'; return; }

  hostGamesList.innerHTML = games.map(g => {
    const n = perGame.get(g.id)?.size || 0;
    const pct = expected > 0 ? Math.min(100, Math.round((n / expected) * 100)) : 0;
    return `
      <div class="item" data-game="${g.id}">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
          <div style="flex:1;">
            <div><strong>${escapeHTML(g.title || defaultGameTitle(g.type))}</strong> <span class="small">(${escapeHTML(g.type)})</span></div>
            <div class="small">Submissions: <strong>${n}</strong> / ${expected || '—'} ${expected ? `(${pct}%)` : ''}</div>
            <div class="progress" style="margin-top:6px;"><span style="width:${pct}%;"></span></div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="link" data-rename>Rename</button>
            <button class="link" data-toggle>${g.status === 'open' ? 'Close' : 'Open'}</button>
            <button class="link danger" data-del>Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Wire actions
  hostGamesList.querySelectorAll('[data-rename]').forEach(btn=>{
    btn.addEventListener('click', async () => {
      const id = btn.closest('.item').dataset.game;
      const g = games.find(x=>String(x.id)===String(id));
      const nv = prompt('New title', g.title || defaultGameTitle(g.type));
      if (!nv) return;
      const { error } = await supabase.from('games').update({ title: nv.trim() }).eq('id', id);
      if (error) return alert(error.message);
      renderHostGames(partyId);
    });
  });
  hostGamesList.querySelectorAll('[data-toggle]').forEach(btn=>{
    btn.addEventListener('click', async () => {
      const id = btn.closest('.item').dataset.game;
      const g = games.find(x=>String(x.id)===String(id));
      const next = g.status === 'open' ? 'closed' : 'open';
      const { error } = await supabase.from('games').update({ status: next }).eq('id', id);
      if (error) return alert(error.message);
      renderHostGames(partyId);
    });
  });
  hostGamesList.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async () => {
      const id = btn.closest('.item').dataset.game;
      if (!confirm('Delete this game? This will also remove its submissions.')) return;
      const { error } = await supabase.from('games').delete().eq('id', id);
      if (error) return alert(error.message);
      renderHostGames(partyId);
    });
  });
}

/* ------------ Add Game (dashboard) ------------ */
async function onAddGame(e) {
  e.preventDefault();
  if (!user) return alert('Please sign in first.');
  const partyId = hostPartySelect.value;
  if (!partyId) return alert('Choose a party.');
  const type  = gameType.value;
  const title = (gameTitle.value || '').trim() || defaultGameTitle(type);

  const { error } = await supabase.from('games').insert({
    party_id: partyId, type, title, status: 'open'
  });

  if (error) alert(error.message);
  else {
    gameTitle.value = '';
    alert('Game added!');
    renderHostGames(partyId);
  }
}

function defaultGameTitle(type) {
  switch (type) {
    case 'two_facts': return 'Custom Prompts';
    case 'favorite_song': return 'Favorite Song';
    case 'baby_photo': return 'Baby Photo Contest';
    case 'teen_photo': return 'Teenage Photo Contest';
    case 'wedding_photo': return 'Wedding Photo Contest';
    default: return 'Game';
  }
}

/* ------------ Party page ------------ */
async function loadParty(slug) {
  if (partyHeader) { partyHeader.hidden = false; partyHeader.innerHTML = 'Loading…'; }
  if (partyShare)  { partyShare.hidden  = false; partyShare.innerHTML  = ''; }

  const { data: parties, error } = await supabase
    .from('parties').select('*')
    .eq('slug', slug).limit(1);

  if (error) { partyHeader.innerHTML = `<p>Error: ${error.message}</p>`; return; }
  currentParty = parties?.[0] ?? null;
  if (!currentParty) { partyHeader.innerHTML = `<h2>Party not found: ${escapeHTML(slug)}</h2>`; return; }

  if (welcomeTitle)   welcomeTitle.textContent    = currentParty.title || 'Welcome';
  if (welcomeSubtitle)welcomeSubtitle.textContent = `${fmtDate(currentParty.date)} • ${currentParty.venue || ''}`;

  setModeBadge(null);

  if (!user) {
    showEl(welcomeCard);
    hideEl(tablistEl); hideEl(panelsEl); hideEl(tabsWrap);
  } else {
    hideEl(welcomeCard);
  }

  // Determine host (owner or in party_hosts)
  let isHost = false;
  if (user) {
    if (currentParty.host_id === user.id) {
      isHost = true;
    } else {
      const { data: mem } = await supabase
        .from('party_hosts')
        .select('id')
        .eq('party_id', currentParty.id)
        .or(`user_id.eq.${user.id},invite_email.eq.${user.email}`)
        .limit(1);
      isHost = !!(mem && mem.length);
    }
  }
  isHostForCurrentParty = isHost;
  setModeBadge(isHost ? 'Host Mode' : 'Guest Mode');

  // Host inline forms
  editPartyForm.hidden = true;
  addGameHereForm.hidden = true;
  manageHostsForm.hidden = true;

  if (!isHost) {
    hideEl(hostTools); hideEl(backToDashBtn);
  } else {
    showEl(hostTools); showEl(backToDashBtn);

    editTitle.value = currentParty.title || '';
    editVenue.value = currentParty.venue || '';
    editDesc.value  = currentParty.description || '';
    editExpected.value = currentParty.expected_guests ?? '';
    editDate.value  = currentParty.date ? new Date(currentParty.date).toISOString().slice(0,16) : '';

    editPartyToggle.onclick = () => {
      editPartyForm.hidden = !editPartyForm.hidden;
      if (!editPartyForm.hidden) { addGameHereForm.hidden = true; manageHostsForm.hidden = true; }
    };
    addGameToggle.onclick = () => {
      addGameHereForm.hidden = !addGameHereForm.hidden;
      if (!addGameHereForm.hidden) { editPartyForm.hidden = true; manageHostsForm.hidden = true; }
    };

    manageHostsToggle.onclick = async () => {
      manageHostsForm.hidden = !manageHostsForm.hidden;
      if (!manageHostsForm.hidden) {
        editPartyForm.hidden = true; addGameHereForm.hidden = true;
        await renderHostsList();
      }
    };

    manageHostsForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = (cohostEmail.value || '').trim().toLowerCase();
      const role  = cohostRole.value || 'cohost';
      if (!email) return alert('Enter an email to invite.');

      const { error: insErr } = await supabase.from('party_hosts').insert({
        party_id: currentParty.id, invite_email: email, role
      });
      if (insErr) return alert(insErr.message);
      cohostEmail.value = '';
      await renderHostsList();
      alert('Invite added. Ask them to sign in with this email.');
    };

    async function renderHostsList() {
      hostsList.innerHTML = '<p class="small">Loading…</p>';

      const { data, error: listErr } = await supabase
        .from('party_hosts')
        .select('id, invite_email, user_id, role, created_at')
        .eq('party_id', currentParty.id)
        .order('created_at', { ascending: true });

      if (listErr) { hostsList.innerHTML = `<p>Error: ${listErr.message}</p>`; return; }
      if (!data || data.length === 0) { hostsList.innerHTML = '<p class="small">No co-hosts yet.</p>'; return; }

      hostsList.innerHTML = data.map(h => `
        <div class="item" data-id="${h.id}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div><strong>${escapeHTML(h.role)}</strong></div>
              <div class="small">${h.user_id ? 'Linked user' : 'Invite'}: ${escapeHTML(h.invite_email || '—')}</div>
            </div>
            <button class="link removeHostBtn">Remove</button>
          </div>
        </div>
      `).join('');

      hostsList.querySelectorAll('.removeHostBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.closest('.item').dataset.id;
          const { error: delErr } = await supabase.from('party_hosts').delete().eq('id', id);
          if (delErr) return alert(delErr.message);
          await renderHostsList();
        });
      });
    }

    // Save party changes
    editPartyForm.onsubmit = async (e) => {
      e.preventDefault();
      const expected = editExpected.value === '' ? null : Number(editExpected.value);
      const payload = {
        title: editTitle.value.trim(),
        venue: editVenue.value.trim() || null,
        description: editDesc.value.trim() || null,
        expected_guests: expected,
        date: editDate.value ? new Date(editDate.value).toISOString() : null,
      };
      const { error: upErr } = await supabase.from('parties')
        .update(payload).eq('id', currentParty.id);
      if (upErr) return alert(upErr.message);
      editPartyForm.hidden = true;
      await loadParty(slug);
      alert('Party updated!');
    };

    // Add game inline
    addGameHereForm.onsubmit = async (e) => {
      e.preventDefault();
      const type  = addGameType.value;
      const title = (addGameTitle.value || '').trim() || defaultGameTitle(type);
      const { error: insErr } = await supabase.from('games').insert({
        party_id: currentParty.id, type, title, status: 'open'
      });
      if (insErr) return alert(insErr.message);
      addGameTitle.value = '';
      addGameHereForm.hidden = true;
      await loadParty(slug);
      alert('Game added!');
    };
  }

  partyHeader.innerHTML = `
    <h2>${escapeHTML(currentParty.title)}</h2>
    <p class="muted">${fmtDate(currentParty.date)} • ${escapeHTML(currentParty.venue || '')}</p>
    <p>${escapeHTML(currentParty.description || '')}</p>
  `;
  const url = `${location.origin}${location.pathname}?party=${encodeURIComponent(slug)}`;
  partyShare.innerHTML = `Share link: <code>${url}</code> <button class="link" id="copyPartyLink">Copy</button>`;
  byId('copyPartyLink')?.addEventListener('click', () => copyToClipboard(url));

  // Load games + my single-submission cache (for checklist badges)
  let q = supabase.from('games').select('*')
    .eq('party_id', currentParty.id)
    .order('created_at', { ascending: true });
  if (!isHostForCurrentParty) q = q.in('status', ['open']);

  const { data: gms, error: gErr } = await q;
  if (gErr) { hideEl(tabsWrap); hideEl(panelsEl); return; }
  games = gms || [];

  submissionsByGame = new Map();
  if (user && games.length) {
    const ids = games.map(g => g.id);
    const { data: mine } = await supabase
      .from('submissions')
      .select('id, game_id, created_at, moderation_status')
      .in('game_id', ids).eq('user_id', user.id).eq('party_id', currentParty.id);
    (mine || []).forEach(r => submissionsByGame.set(r.game_id, r));
  }

  buildTabsUI();
  installScrollShadows(tablistEl, qs('.tabs-scroll-shadow.left'), qs('.tabs-scroll-shadow.right'));
}

/* ---------- Tabs UI ---------- */
function buildTabsUI(){
  showEl(tabsWrap, ''); showEl(panelsEl, '');

  tablistEl.innerHTML = ''; panelsEl.innerHTML = '';

  const aboutTab = tabTpl.content.firstElementChild.cloneNode(true);
  aboutTab.id = 'tab-about';
  aboutTab.textContent = 'About You';
  aboutTab.dataset.slug = 'about';
  aboutTab.setAttribute('role','tab');
  aboutTab.setAttribute('aria-selected','false');
  aboutTab.tabIndex = -1;
  aboutTab.addEventListener('click', ()=>selectTab('about'));
  aboutTab.addEventListener('keydown', onTabKeyNav);
  tablistEl.appendChild(aboutTab);

  games.forEach(g => {
    const btn = tabTpl.content.firstElementChild.cloneNode(true);
    btn.id = `tab-${g.id}`;
    btn.dataset.slug = g.id;
    btn.setAttribute('role','tab');
    btn.setAttribute('aria-selected','false');
    btn.tabIndex = -1;

    const mine = submissionsByGame.get(g.id);
    // For favorite_song (Song Requests), always show "Add More" to encourage multiple submissions
    const isSongRequest = g.type === 'favorite_song';
    const doneBadge = isSongRequest 
      ? `<span class="badge open">Add More</span>`
      : (mine ? `<span class="badge ok">Added</span>` : `<span class="badge open">Add</span>`);
    const statusBadge = (isHostForCurrentParty && g.status === 'closed')
      ? `<span class="badge open">Closed</span>` : '';

    btn.innerHTML = `${escapeHTML(g.title || defaultGameTitle(g.type))} ${statusBadge || doneBadge}`;
    btn.addEventListener('click', ()=>selectTab(g.id));
    btn.addEventListener('keydown', onTabKeyNav);
    tablistEl.appendChild(btn);
  });

  const about = aboutTpl.content.firstElementChild.cloneNode(true);
  about.id = 'panel-about';
  about.setAttribute('role','tabpanel');
  about.setAttribute('aria-labelledby', 'tab-about');
  about.hidden = true;
  panelsEl.appendChild(about);
  bindAboutPanel(about);

  // Debug: log game configs to help troubleshoot About You question rendering
  games.forEach(g => {
    try { console.debug('[buildTabsUI] game config', g.id, g.config); } catch(e){}
  });

  games.forEach(g => {
    const panel = gameTpl.content.firstElementChild.cloneNode(true);
    panel.id = `panel-${g.id}`;
    panel.setAttribute('role','tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${g.id}`);
    panel.hidden = true;
    panel.querySelector('[data-slot="title"]').textContent = g.title || defaultGameTitle(g.type);
    panel.querySelector('[data-slot="instructions"]').textContent = gameInstructions(g.type);

    const hostActions = panel.querySelector('[data-slot="hostActions"]');
    if (isHostForCurrentParty) {
      hostActions.hidden = false;
      hostActions.innerHTML = `
        <button class="link" data-rename="${g.id}">Rename</button>
        <button class="link" data-toggle="${g.id}">
          ${g.status === 'open' ? 'Close submissions' : 'Open submissions'}
        </button>
        <button class="link danger" data-del="${g.id}">Delete</button>
      `;

      hostActions.querySelector('[data-rename]').addEventListener('click', async () => {
        const nv = prompt('New title', g.title || defaultGameTitle(g.type));
        if (!nv) return;
        const { error } = await supabase.from('games').update({ title: nv.trim() }).eq('id', g.id);
        if (error) return alert(error.message);
        await loadParty(new URLSearchParams(location.search).get('party'));
      });
      hostActions.querySelector('[data-toggle]').addEventListener('click', async () => {
        const next = g.status === 'open' ? 'closed' : 'open';
        const { error } = await supabase.from('games').update({ status: next }).eq('id', g.id);
        if (error) return alert(error.message);
        await loadParty(new URLSearchParams(location.search).get('party'));
      });
      hostActions.querySelector('[data-del]').addEventListener('click', async () => {
        if (!confirm('Delete this game? This will also remove its submissions.')) return;
        const { error } = await supabase.from('games').delete().eq('id', g.id);
        if (error) return alert(error.message);
        await loadParty(new URLSearchParams(location.search).get('party'));
      });
    }

    const formEl = panel.querySelector('[data-slot="form"]');
    const hintEl = panel.querySelector('[data-slot="hint"]');

    if (['baby_photo','teen_photo','wedding_photo'].includes(g.type)) {
      formEl.prepend(makeField('file', { name: 'image_file', label: 'Upload photo (JPG/PNG)', accept: 'image/*' }));
      formEl.prepend(makeField('input', { name: 'display_name', label: 'Display name', placeholder: 'Shown after approval' }));
    } else if (g.type === 'about_you') {
      // Render About You question fields from game.config.questions
      console.debug('[about_you] Raw config:', g.config);
      const parsed = normalizeConfig(g.config) || {};
      console.debug('[about_you] Parsed config:', parsed);
      const qsCfg = (parsed.questions && Array.isArray(parsed.questions)) ? parsed.questions : [
        { label: 'What’s a fun fact about you?' },
        { label: 'Favorite memory?' }
      ];
      // Add display name first
      formEl.prepend(makeField('input', { name: 'display_name', label: 'Display name', placeholder: 'Shown after approval' }));
      // Insert question fields
      for (let i = qsCfg.length - 1; i >= 0; i--) {
        const q = qsCfg[i];
        const name = `q_${i}`;
        formEl.prepend(makeField('input', { name, label: q.label || `Question ${i+1}`, placeholder: q.placeholder || '' }));
      }
    } else if (g.type === 'favorite_song') {
      formEl.prepend(makeField('input', { name: 'link', label: 'Link (Spotify/YouTube)', placeholder: 'https://… (optional)' }));
      formEl.prepend(makeField('input', { name: 'artist', label: 'Artist', placeholder: 'Artist' }));
      formEl.prepend(makeField('input', { name: 'title', label: 'Song title', placeholder: 'Title' }));
      formEl.prepend(makeField('input', { name: 'display_name', label: 'Display name', placeholder: 'Shown after approval' }));
    } else if (g.type === 'two_facts') {
      formEl.prepend(makeField('input', { name: 'fact2', label: 'Prompt / Fun fact #2', placeholder: '…' }));
      formEl.prepend(makeField('input', { name: 'fact1', label: 'Prompt / Fun fact #1', placeholder: '…' }));
      formEl.prepend(makeField('input', { name: 'display_name', label: 'Display name', placeholder: 'Shown after approval' }));
    } else {
      formEl.prepend(makeField('textarea', { name: 'text', label: 'Your entry', placeholder: 'Write your answer…' }));
      formEl.prepend(makeField('input', { name: 'display_name', label: 'Display name', placeholder: 'Shown after approval' }));
    }

    if (g.status === 'closed') {
      hintEl.textContent = 'Submissions are closed for this game.';
      [...formEl.querySelectorAll('input, textarea, button[type="submit"]')].forEach(el => {
        if (el.tagName.toLowerCase() === 'button') el.disabled = true;
        else el.readOnly = true;
      });
    } else {
      formEl.addEventListener('submit', async (e)=>{
        e.preventDefault();
        await submitEntry(g, formEl);
      });
    }

    if (g.type === 'favorite_song') {
      const songsWrap = panel.querySelector('[data-slot="songsWrap"]');
      const allEl = panel.querySelector('[data-slot="songsAll"]');
      const mineEl = panel.querySelector('[data-slot="songsMine"]');
      songsWrap.hidden = false;
      renderSongLists(g.id, allEl, mineEl);
    }

    if (['baby_photo','teen_photo','wedding_photo'].includes(g.type)) {
      const albumWrap = panel.querySelector('[data-slot="albumWrap"]');
      albumWrap.hidden = false;
      renderAlbum(g, albumWrap.querySelector('[data-slot="albumGrid"]'));
    }

    panelsEl.appendChild(panel);
  });

  const initial = location.hash ? location.hash.replace('#','') : 'about';
  selectTab(initial);
  window.addEventListener('hashchange', () => {
    const slug = location.hash.replace('#','');
    if (slug) selectTab(slug);
  });
}

/* Keyboard nav for tabs (fixes "onTabKeyNav not defined") */
function onTabKeyNav(e){
  const keys = ['ArrowLeft','ArrowRight','Home','End'];
  if (!keys.includes(e.key)) return;
  e.preventDefault();
  const tabs = Array.from(tablistEl.querySelectorAll('[role="tab"]'));
  const idx = tabs.indexOf(e.currentTarget);
  let next = idx;
  if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1);
  if (e.key === 'ArrowRight') next = Math.min(tabs.length - 1, idx + 1);
  if (e.key === 'Home') next = 0;
  if (e.key === 'End') next = tabs.length - 1;
  const btn = tabs[next];
  btn?.focus();
  btn?.click();
}

/* Programmatic tab switcher */
function selectTab(slug){
  // Keep hash in sync (but don't duplicate '#')
  if (location.hash.replace('#','') !== slug) {
    history.replaceState(null, '', `${location.pathname}${location.search}#${slug}`);
  }
  // Toggle selected & panels
  Array.from(tablistEl.children).forEach(btn=>{
    if (!(btn instanceof HTMLElement)) return;
    const active = btn.dataset.slug === slug;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
    btn.tabIndex = active ? 0 : -1;
  });
  Array.from(panelsEl.children).forEach(panel=>{
    panel.hidden = panel.id !== `panel-${slug}`;
  });
}

/* Favorite Song helpers */
function normSongKey(title, artist){
  const t = (title||'').toLowerCase().trim().replace(/\s+/g,' ');
  const a = (artist||'').toLowerCase().trim().replace(/\s+/g,' ');
  return `${t}—${a}`;
}
async function renderSongLists(gameId, allEl, mineEl){
  const { data: rows } = await supabase
    .from('submissions')
    .select('id, user_id, display_name, content, moderation_status')
    .eq('game_id', gameId)
    .eq('party_id', currentParty.id);

  const dedupe = new Map();
  (rows||[]).forEach(r=>{
    const c = r.content||{};
    if (!c.title || !c.artist) return;
    const k = normSongKey(c.title, c.artist);
    if (!dedupe.has(k)) dedupe.set(k, r);
  });

  allEl.innerHTML = [...dedupe.values()].map(r=>{
    const c = r.content||{};
    const st = r.moderation_status || 'pending';
    const link = c.link ? `<a class="small" href="${escapeHTML(c.link)}" target="_blank" rel="noopener">link</a>` : '';
    return `<li><span><strong>${escapeHTML(c.title)}</strong> — ${escapeHTML(c.artist)}</span><span class="small">${st}${link ? ' • '+link : ''}</span></li>`;
  }).sort((a,b)=>a.localeCompare(b)).join('') || `<li class="small">No songs yet.</li>`;

  const my = (rows||[]).filter(r=>r.user_id===user?.id);
  mineEl.innerHTML = my.map(r=>{
    const c = r.content||{};
    const st = r.moderation_status || 'pending';
    const link = c.link ? `<a class="small" href="${escapeHTML(c.link)}" target="_blank" rel="noopener">link</a>` : '';
    return `<li><span><strong>${escapeHTML(c.title||'')}</strong> — ${escapeHTML(c.artist||'')}</span><span class="small">${st}${link ? ' • '+link : ''}</span></li>`;
  }).join('') || `<li class="small">You haven’t added any songs yet.</li>`;
}

/* Album + voting */
async function renderAlbum(game, gridEl){
  const { data: approved } = await supabase
    .from('submissions')
    .select('id, content, display_name')
    .eq('party_id', currentParty.id)
    .eq('game_id', game.id)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: true });

  const { data: votes } = await supabase
    .from('votes')
    .select('submission_id, user_id')
    .eq('party_id', currentParty.id)
    .eq('game_id', game.id);

  const myVote = (votes||[]).find(v => v.user_id === user?.id)?.submission_id || null;
  const counts = new Map();
  (votes||[]).forEach(v => counts.set(v.submission_id, (counts.get(v.submission_id)||0)+1));

  gridEl.innerHTML = (approved||[]).map(row => {
    const img = row.content?.image_url ? `<img src="${escapeHTML(row.content.image_url)}" alt="">` : '';
    const active = String(myVote) === String(row.id);
    return `
      <div class="album-card" data-id="${row.id}">
        ${img}
        <div class="meta">
          <div class="small">by ${escapeHTML(row.display_name||'Anonymous')}</div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="vote-count">${counts.get(row.id)||0}</span>
            <button class="vote-btn ${active ? 'active':''}" ${user?'':'disabled'}>${active?'Voted':'Vote'}</button>
          </div>
        </div>
      </div>
    `;
  }).join('') || `<div class="small">No approved photos yet.</div>`;

  if (!user) return;

  gridEl.querySelectorAll('.vote-btn').forEach(btn=>{
    btn.addEventListener('click', async () => {
      const subId = btn.closest('.album-card').dataset.id;
      const { error } = await supabase.from('votes').upsert({
        party_id: currentParty.id,
        game_id: game.id,
        user_id: user.id,
        submission_id: subId
      }, { onConflict: 'user_id,game_id' });
      if (error) return alert(error.message);
      renderAlbum(game, gridEl);
    });
  });
}

/* ----- About You: form + stats + checklist ----- */
async function bindAboutPanel(root){
  const form = root.querySelector('#aboutForm');
  const hint = root.querySelector('#aboutHint');
  const statsCard = root.querySelector('#aboutStats');

  if (user?.email) {
    const base = user.email.split('@')[0];
    if (!form.display_name.value) form.display_name.value = base;
  }

  const my = await supabase
    .from('party_profiles')
    .select('display_name,zodiac_sign,birth_city,fav_dest_city,theme')
    .eq('party_id', currentParty.id)
    .eq('user_id', user.id)
    .limit(1);

  const myRow = my.data?.[0] || null;
  if (myRow) {
    const p = myRow;
    if (p.display_name) form.display_name.value = p.display_name;
    if (p.zodiac_sign) form.zodiac_sign.value = p.zodiac_sign;
    if (p.birth_city)  form.birth_city.value  = p.birth_city;
    if (p.fav_dest_city) form.fav_dest_city.value = p.fav_dest_city;
    const theme = p.theme || {};
    if (theme.team)    form.team.value = theme.team;
    if (theme.fav_jam) form.fav_jam.value = theme.fav_jam;
    hint.textContent = 'Saved. You can update anytime.';
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = {
      party_id: currentParty.id,
      user_id: user.id,
      display_name: form.display_name.value.trim(),
      zodiac_sign: normalizeSign(form.zodiac_sign.value),
      birth_city:  form.birth_city.value.trim() || null,
      fav_dest_city: form.fav_dest_city.value.trim() || null,
      theme: {
        team: form.team.value || null,
        fav_jam: form.fav_jam.value || null
      }
    };
    if (!payload.display_name || !payload.zodiac_sign) {
      return alert('Please fill at least Display name and Zodiac.');
    }

    const { data: existing } = await supabase
      .from('party_profiles')
      .select('id').eq('party_id', currentParty.id).eq('user_id', user.id).limit(1);

    if (existing && existing.length) {
      const { error: upErr } = await supabase.from('party_profiles')
        .update(payload).eq('party_id', currentParty.id).eq('user_id', user.id);
      if (upErr) return alert(upErr.message);
    } else {
      const { error: insErr } = await supabase.from('party_profiles').insert(payload);
      if (insErr) return alert(insErr.message);
    }

    hint.textContent = 'Saved! Showing party stats…';
    statsCard.hidden = false;
    await renderPartyStats(root);
    renderChecklist(root);
    statsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (myRow) {
    statsCard.hidden = false;
    await renderPartyStats(root);
  }

  renderChecklist(root);
}

function renderChecklist(root){
  const tbody = root.querySelector('#checklistBody');
  if (!tbody) return;
  tbody.innerHTML = (games || []).map(g => {
    const mine = submissionsByGame.get(g.id);
    // For favorite_song (Song Requests), always show "Add More" to encourage multiple submissions
    const isSongRequest = g.type === 'favorite_song';
    const statusHostBadge = (isHostForCurrentParty && g.status === 'closed')
      ? '<span class="badge open">Closed</span>'
      : (isSongRequest 
          ? '<span class="badge open">Add More</span>'
          : (mine ? '<span class="badge ok">Added</span>' : '<span class="badge open">Add</span>'));
    return `
      <tr>
        <td>${escapeHTML(g.title || defaultGameTitle(g.type))}</td>
        <td>${statusHostBadge}</td>
        <td><button class="link goTabBtn" data-id="${g.id}">Go →</button></td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="3" class="small">No games yet.</td></tr>`;

  tbody.querySelectorAll('.goTabBtn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      selectTab(btn.dataset.id);
    });
  });
}

function normalizeSign(s){
  if (!s) return s;
  return s.replace(/\s*♈︎|\s*♉︎|\s*♊︎|\s*♋︎|\s*♌︎|\s*♍︎|\s*♎︎|\s*♏︎|\s*♐︎|\s*♑︎|\s*♒︎|\s*♓︎/g,'').trim();
}

async function renderPartyStats(root){
  const { data: zodiacRows } = await supabase.rpc('party_zodiac_counts', { p_party_id: currentParty.id });
  const { data: placeRows }  = await supabase.rpc('party_birth_points', { p_party_id: currentParty.id });
  const { data: destRows }   = await supabase.rpc('party_dest_points',  { p_party_id: currentParty.id });

  const chartEl = root.querySelector('#zodiacChart');
  const labels = [
    'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
    'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces','Prefer not to say'
  ];
  const countsMap = Object.fromEntries(labels.map(l=>[l,0]));
  (zodiacRows || []).forEach(r => {
    const key = normalizeSign(r.zodiac_sign || 'Prefer not to say') || 'Prefer not to say';
    if (countsMap[key] !== undefined) countsMap[key] += Number(r.count) || 0;
  });
  const data = labels.map(l => countsMap[l]);

  if (zodiacChart) { zodiacChart.destroy(); }
  if (window.Chart && chartEl) {
    zodiacChart = new window.Chart(chartEl.getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Guests', data }] },
      options: {
        responsive: true,
        plugins: { legend: { display:false } },
        scales: { y: { beginAtZero: true, ticks: { precision:0 } } }
      }
    });
  }

  await renderBubbleMap(root.querySelector('#aboutMap'), root.querySelector('#aboutPlacesFallback'),
    (placeRows||[]).map(r => ({ lng: r.birth_lng, lat: r.birth_lat, city: r.birth_city, country: r.birth_country, count: Number(r.count)||0 })),
    '#16a34a', 'Top places');
  await renderBubbleMap(root.querySelector('#destMap'), root.querySelector('#destPlacesFallback'),
    (destRows||[]).map(r => ({ lng: r.fav_dest_lng, lat: r.fav_dest_lat, city: r.fav_dest_city, country: r.fav_dest_country, count: Number(r.count)||0 })),
    '#ef4444', 'Top destinations');
}

async function renderBubbleMap(container, fallback, points, colorHex, listLabel){
  const features = (points||[]).filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
    .map(p => ({
      type:'Feature',
      properties: { count: p.count || 1, label: `${p.city || 'Unknown'}${p.country ? ', '+p.country : ''}` },
      geometry: { type:'Point', coordinates: [p.lng, p.lat] }
    }));
  const geo = { type:'FeatureCollection', features };

  if (window.maplibregl && container) {
    container.innerHTML = '';
    const map = new window.maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap' }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      center: [10, 20], zoom: features.length ? 1.5 : 0.8
    });

    map.on('load', () => {
      map.addSource('pts', { type:'geojson', data: geo });
      map.addLayer({
        id: 'pts-dots',
        type: 'circle',
        source: 'pts',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get','count'], 1, 4, 8, 14, 16, 20],
          'circle-color': colorHex,
          'circle-opacity': 0.8,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1.2
        }
      });
      if (features.length) {
        const b = new window.maplibregl.LngLatBounds();
        features.forEach(f => b.extend(f.geometry.coordinates));
        map.fitBounds(b, { padding: 30, maxZoom: 5 });
      }
    });

    if (fallback) fallback.hidden = true;
  } else if (fallback) {
    const top = [...(features || [])]
      .sort((a,b)=> (b.properties.count||0)-(a.properties.count||0))
      .slice(0,8)
      .map(f => `${f.properties.label}: ${f.properties.count}`);
    fallback.hidden = false;
    fallback.innerHTML = top.length ? `${listLabel}: ${top.map(x=>escapeHTML(x)).join(' • ')}` : `Add entries to see ${listLabel.toLowerCase()}!`;
  }
}

/* ----- Form helpers & submit (games) ----- */
function makeField(kind, opts){
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const id = `f_${opts.name}_${Math.random().toString(36).slice(2,7)}`;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = opts.label || opts.name;

  let input;
  if (kind === 'textarea'){
    input = document.createElement('textarea'); input.className = 'textarea';
  } else if (kind === 'file'){
    input = document.createElement('input'); input.type = 'file'; input.className = 'file';
    if (opts.accept) input.accept = opts.accept;
  } else {
    input = document.createElement('input'); input.type = 'text'; input.className = 'input';
    input.placeholder = opts.placeholder || '';
  }
  input.id = id; input.name = opts.name;
  wrap.append(label, input);
  return wrap;
}

function gameInstructions(type){
  switch(type){
    case 'about_you':  return 'Answer a few fun questions to help your host and guests get to know you — quick and delightful!';
    case 'baby_photo':   return 'Upload your cutest baby photo. Takes ~30s.';
    case 'teen_photo':   return 'Upload a teenage photo.';
    case 'wedding_photo':return 'Upload your wedding photo.';
    case 'favorite_song':return 'Paste a link to your favorite track and add title + artist. You can add more than one!';
    case 'two_facts':    return 'Share two short prompts or facts.';
    default:             return 'Add your entry below.';
  }
}

async function submitEntry(game, formEl){
  try {
    let payload = null;
    let display_name = '';
    const fd = new FormData(formEl);
    display_name = (fd.get('display_name') || '').toString().trim();

    if (['baby_photo','teen_photo','wedding_photo'].includes(game.type)) {
      const file = fd.get('image_file');
      if (!display_name) return alert('Please enter a display name.');
      if (!(file instanceof File)) return alert('Please choose a photo.');

      const mb = file.size / (1024 * 1024);
      if (mb > MAX_IMAGE_MB) return alert(`Please upload a smaller photo (under ${MAX_IMAGE_MB} MB).`);
      if (!file.type.startsWith('image/')) return alert('Please upload an image file.');

      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `party/${currentParty.id}/game/${game.id}/user/${user.id}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const image_url = pub?.publicUrl;
      payload = { image_url, storage_path: path };
    } else if (game.type === 'favorite_song') {
      const title  = (fd.get('title')  || '').toString().trim();
      const artist = (fd.get('artist') || '').toString().trim();
      const link   = (fd.get('link')   || '').toString().trim() || null;
      if (!display_name || !title || !artist) return alert('Please enter display name, title, and artist.');

      const { data: existing } = await supabase
        .from('submissions')
        .select('id, content, user_id')
        .eq('party_id', currentParty.id)
        .eq('game_id', game.id);

      const key = normSongKey(title, artist);
      const dup = (existing||[]).some(r => {
        const c = r.content||{};
        return normSongKey(c.title, c.artist) === key;
      });
      if (dup) return alert('That song is already in the list!');
      
      // Check if this user has any existing songs
      const userHasExistingSongs = (existing||[]).some(r => r.user_id === user?.id);

      payload = { title, artist, link, _isFirstSong: !userHasExistingSongs };
    } else if (game.type === 'two_facts') {
      const fact1 = (fd.get('fact1') || '').toString().trim();
      const fact2 = (fd.get('fact2') || '').toString().trim();
      if (!display_name || !fact1 || !fact2) return alert('Please enter display name and two items.');
      payload = { fact1, fact2 };
    } else if (game.type === 'about_you') {
      // collect question answers (fields named q_0, q_1, ... based on game.config)
      const parsedCfg = normalizeConfig(game.config) || {};
      const qsList = parsedCfg.questions || [];
      const answers = {};
      for (let i=0;i<qsList.length;i++) {
        const key = `q_${i}`;
        answers[key] = (fd.get(key) || '').toString().trim();
      }
      if (!display_name) return alert('Please enter a display name.');
      // require at least one non-empty answer
      const any = Object.values(answers).some(x => x && x.length);
      if (!any) return alert('Please answer at least one question.');
      payload = { answers };
    } else {
      const text = (fd.get('text') || '').toString().trim();
      if (!display_name || !text) return alert('Please enter display name and your entry.');
      payload = { text };
    }

    if (game.type === 'favorite_song') {
      const { error } = await supabase
        .from('submissions')
        .insert({
          party_id: currentParty.id,
          game_id: game.id,
          user_id: user.id,
          display_name,
          content: payload,
          moderation_status: 'pending'
        });
      if (error) throw error;
    } else {
      const { data: mine } = await supabase
        .from('submissions').select('id')
        .eq('party_id', currentParty.id).eq('game_id', game.id).eq('user_id', user.id).limit(1);

      if (mine && mine.length) {
        const { error } = await supabase
          .from('submissions')
          .update({
            display_name,
            content: payload,
            moderation_status: 'pending'
          })
          .eq('id', mine[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('submissions')
          .insert({
            party_id: currentParty.id,
            game_id: game.id,
            user_id: user.id,
            display_name,
            content: payload,
            moderation_status: 'pending'
          });
        if (error) throw error;
      }
    }

    if (game.type === 'favorite_song') {
      const songsWrap = byId(`panel-${game.id}`)?.querySelector('[data-slot="songsWrap"]');
      if (songsWrap) {
        await renderSongLists(game.id,
          songsWrap.querySelector('[data-slot="songsAll"]'),
          songsWrap.querySelector('[data-slot="songsMine"]'));
      }
      
      // Only show dialog and reload for first song submission
      if (payload._isFirstSong) {
        alert('Song submitted! Host will review before it goes live.');
        location.reload();
      }
      // For subsequent songs, just silently update the list (no dialog, no reload)
    } else if (['baby_photo','teen_photo','wedding_photo'].includes(game.type)) {
      const albumWrap = byId(`panel-${game.id}`)?.querySelector('[data-slot="albumWrap"]');
      if (albumWrap) await renderAlbum(game, albumWrap.querySelector('[data-slot="albumGrid"]'));
      alert('Photo uploaded! Awaiting host approval.');
    } else {
      alert('Saved. Host will review before it goes live.');
    }
  } catch (e){
    console.error(e);
    alert('Could not save your entry. Please try again.');
  }
}

/* ------------ Moderation (dashboard) ------------ */
async function renderModQueue() {
  if (!user || !modList) return;

  const idsCSV   = hostPartiesList?.dataset?.partyIds || '';
  const partyIds = idsCSV ? idsCSV.split(',').filter(Boolean) : [];
  if (partyIds.length === 0) { modList.innerHTML = '<p class="muted">No parties yet.</p>'; return; }

  const { data, error } = await supabase
    .from('submissions')
    .select('id, party_id, game_id, display_name, content, moderation_status, created_at, parties!inner(title, slug), games!inner(type, title, config)')
    .in('party_id', partyIds)
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) { modList.innerHTML = `<p>Error: ${error.message}</p>`; return; }
  if (!data || data.length === 0) { modList.innerHTML = '<p class="muted">Nothing pending.</p>'; return; }

  modList.innerHTML = data.map(row => `
    <div class="item" data-id="${row.id}">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div><strong>${escapeHTML(row.games?.title || '')}</strong> <span class="small">(${escapeHTML(row.games?.type)})</span></div>
          <div class="small">in <code>${escapeHTML(row.parties?.slug)}</code> — ${escapeHTML(row.parties?.title)}</div>
          <div style="margin-top:6px;">${renderSubmissionContent(row.games?.type, row.content, row.games?.config)}</div>
          <div class="small" style="margin-top:6px;">by ${escapeHTML(row.display_name || 'Anonymous')}</div>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button class="link approveBtn">Approve</button>
          <button class="link rejectBtn">Reject</button>
        </div>
      </div>
    </div>
  `).join('');

  modList.querySelectorAll('.approveBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('.item').dataset.id;
      const { error: upErr } = await supabase.from('submissions').update({
        moderation_status: 'approved',
        moderated_by: user.id,
        moderated_at: new Date().toISOString()
      }).eq('id', id);
      if (upErr) return alert(upErr.message);
      renderModQueue();
    });
  });
  modList.querySelectorAll('.rejectBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('.item').dataset.id;
      const { error: upErr } = await supabase.from('submissions').update({
        moderation_status: 'rejected',
        moderated_by: user.id,
        moderated_at: new Date().toISOString()
      }).eq('id', id);
      if (upErr) return alert(upErr.message);
      renderModQueue();
    });
  });
}

/* ------------ Helpers used in moderation cards ------------ */
function renderSubmissionContent(type, content, config) {
  if (!content) return '';
  const parsed = normalizeConfig(config) || null;
  switch (type) {
    case 'two_facts':
      return `<ul style="margin:6px 0 0 16px;"><li>${escapeHTML(content.fact1 || '')}</li><li>${escapeHTML(content.fact2 || '')}</li></ul>`;
    case 'favorite_song':
      return `
        <div><strong>${escapeHTML(content.title || '')}</strong> — ${escapeHTML(content.artist || '')}</div>
        ${content.link ? `<div class="small"><a href="${escapeHTML(content.link)}" target="_blank" rel="noopener">Open link</a></div>` : ''}
      `;
    case 'baby_photo':
    case 'teen_photo':
    case 'wedding_photo':
      return content.image_url ? `<img src="${escapeHTML(content.image_url)}" alt="submission image" />` : '';
    case 'about_you':
      if (!content || !content.answers) return '';
      // Prefer friendly labels from config.questions when available
      const qsCfg = (config && Array.isArray(config.questions)) ? config.questions : null;
      const answers = content.answers || {};
      if (qsCfg) {
        return `<ul style="margin:6px 0 0 16px;">${qsCfg.map((q, i) => {
          const key = `q_${i}`;
          const label = q.label || `Question ${i+1}`;
          return `<li><strong>${escapeHTML(label)}</strong>: ${escapeHTML(answers[key]||'')}</li>`;
        }).join('')}</ul>`;
      }
      // Fallback: show keys
      return `<ul style="margin:6px 0 0 16px;">${Object.keys(answers).map(k=>`<li><strong>${escapeHTML(k)}</strong>: ${escapeHTML(answers[k]||'')}</li>`).join('')}</ul>`;
    default:
      return `<pre class="small">${escapeHTML(JSON.stringify(content))}</pre>`;
  }
}

/* ------------ Welcome (magic link) ------------ */
async function onWelcomeSubmit(e) {
  e.preventDefault();
  const email = (welcomeEmail.value || '').trim();
  if (!email) return;

  const redirectTo = `${location.origin}${location.pathname}${location.search}`;
  const { error } = await auth.signInWithEmail(email, redirectTo);
  if (error) { alert(error.message); return; }

  welcomeStepEnter.hidden = true;
  welcomeStepSent.hidden  = false;
  sentEmailText.textContent = email;

  let secs = 30;
  resendLinkBtn.disabled = true;
  resendLinkBtn.textContent = `Resend link in ${secs}s`;
  const t = setInterval(() => {
    secs--;
    if (secs <= 0) {
      clearInterval(t);
      resendLinkBtn.disabled = false;
      resendLinkBtn.textContent = 'Resend link';
    } else {
      resendLinkBtn.textContent = `Resend link in ${secs}s`;
    }
  }, 1000);

  resendLinkBtn.onclick = async () => {
    if (resendLinkBtn.disabled) return;
    const { error: reErr } = await auth.signInWithEmail(email, redirectTo);
    if (reErr) return alert(reErr.message);
  };
}
