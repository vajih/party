import { auth, supabase } from './auth.js';
import { byId, slugify, fmtDate, copyToClipboard } from './util.js';

// Auth elements
const authMsg = byId('authMsg');
const authForm = byId('authForm');
const authEmail = byId('authEmail');
const signOutBtn = byId('signOutBtn');

// Host elements
const hostCard = byId('hostCard');
const createPartyForm = byId('createPartyForm');
const partyTitle = byId('partyTitle');
const partyDate = byId('partyDate');
const partyVenue = byId('partyVenue');
const partyDesc = byId('partyDesc');
const partySlug = byId('partySlug');
const hostPartiesList = byId('hostPartiesList');

// Add game (dashboard)
const newGameForm = byId('newGameForm');
const hostPartySelect = byId('hostPartySelect');
const gameType = byId('gameType');
const gameTitle = byId('gameTitle');

// Party page elements
const partyCard = byId('partyCard');
const partyHeader = byId('partyHeader');
const partyShare = byId('partyShare');
const partyGames = byId('partyGames');

// Party page host tools
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
const addGameType  = byId('addGameType');
const addGameTitle = byId('addGameTitle');

let session = null;
let user = null;
let currentParty = null;

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('popstate', route);

// Back to dashboard from the party page
backToDashBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  const base = `${location.origin}${location.pathname}`; // strip ?party=...
  history.pushState({}, '', base);
  route();
});

async function init() {
  const { data } = await auth.getSession();
  session = data.session;
  user = session?.user ?? null;
  renderAuth();

  auth.onChange((newSession) => {
    session = newSession;
    user = session?.user ?? null;
    renderAuth();
    route(); // re-evaluate which view to show after auth change
  });

  route();
}

// ===== Auth UI =====
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = authEmail.value.trim();
  if (!email) return;
  const redirectTo = `${location.origin}${location.pathname}${location.search}`;
  const { error } = await auth.signInWithEmail(email, redirectTo);
  authMsg.textContent = error ? `Error: ${error.message}` : 'Check your email for a one-time sign-in link.';
  if (!error) authEmail.value = '';
});

signOutBtn.addEventListener('click', async () => {
  await auth.signOut();
});

function renderAuth() {
  if (user) {
    authMsg.innerHTML = `Signed in as <strong>${user.email}</strong>`;
    authForm.hidden = true;
    signOutBtn.hidden = false;
    if (hostCard) hostCard.hidden = false;
    renderHostParties();
  } else {
    authMsg.textContent = 'Sign in to continue';
    authForm.hidden = false;
    signOutBtn.hidden = true;
    if (hostCard) hostCard.hidden = true;
    hostPartiesList.innerHTML = '';
  }
}

// ===== Router: show Host Dashboard or Party Page based on ?party=slug =====
function route() {
  const params = new URLSearchParams(location.search);
  const slug = params.get('party');

  if (slug) {
    if (hostCard) hostCard.hidden = true;
    if (partyCard) { partyCard.hidden = false; loadParty(slug); }
  } else {
    if (partyCard) partyCard.hidden = true;
    if (user && hostCard) hostCard.hidden = false;
  }
}

// ===== Parties: create & list =====
createPartyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!user) return alert('Please sign in first.');

  const title = partyTitle.value.trim();
  const slugInput = partySlug.value.trim();
  let slug = slugify(slugInput || title);
  if (!slug) return alert('Please provide a title or slug.');

  // add a short random tail to avoid collisions
  slug = `${slug}-${Math.random().toString(36).slice(2,6)}`;

  const { error } = await supabase.from('parties').insert({
    host_id: user.id,
    title,
    description: partyDesc.value.trim() || null,
    date: partyDate.value ? new Date(partyDate.value).toISOString() : null,
    venue: partyVenue.value.trim() || null,
    slug
  });

  if (error) {
    alert(error.message);
  } else {
    partyTitle.value = partyDesc.value = partyVenue.value = partySlug.value = '';
    partyDate.value = '';
    await renderHostParties();
    alert('Party created!');
  }
});

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
    return;
  }

  hostPartiesList.innerHTML = parties.map(p => {
    const url = `${location.origin}${location.pathname}?party=${encodeURIComponent(p.slug)}`;
    return `
      <div class="item">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
          <div>
            <div><strong>${p.title}</strong></div>
            <div class="muted">${fmtDate(p.date)} • ${p.venue || ''}</div>
            <div class="muted">Slug: <code>${p.slug}</code></div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="link copyBtn" data-url="${url}">Copy link</button>
            <a class="badge" href="?party=${encodeURIComponent(p.slug)}">Open</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  hostPartySelect.innerHTML = parties.map(p =>
    `<option value="${p.id}">${p.title} (${p.slug})</option>`
  ).join('');

  hostPartiesList.querySelectorAll('.copyBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      copyToClipboard(btn.dataset.url);
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy link'), 1200);
    });
  });
}

// ===== Add Game (dashboard) =====
newGameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!user) return alert('Please sign in first.');

  const partyId = hostPartySelect.value;
  if (!partyId) return alert('Choose a party.');

  const type = gameType.value;
  const title = (gameTitle.value || '').trim() || defaultGameTitle(type);

  const { error } = await supabase.from('games').insert({
    party_id: partyId,
    type,
    title,
    status: 'open'
  });

  if (error) {
    alert(error.message);
  } else {
    gameTitle.value = '';
    alert('Game added! Open the party link to see it.');
  }
});

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

// ===== Party page (with host tools) =====
async function loadParty(slug) {
  partyHeader.innerHTML = 'Loading…';
  partyGames.innerHTML = '';
  partyShare.innerHTML = '';

  const { data: parties, error } = await supabase
    .from('parties').select('*')
    .eq('slug', slug).limit(1);

  if (error) {
    partyHeader.innerHTML = `<p>Error: ${error.message}</p>`;
    return;
  }
  currentParty = parties?.[0] ?? null;

  if (!currentParty) {
    partyHeader.innerHTML = `<h2>Party not found: ${slug}</h2>`;
    return;
  }

  // Host tools visibility + prefill edit form
  const isHost = user && currentParty.host_id === user.id;
  if (hostTools) hostTools.hidden = !isHost;

  if (isHost && editPartyForm) {
    editTitle.value = currentParty.title || '';
    editVenue.value = currentParty.venue || '';
    editDesc.value  = currentParty.description || '';
    editDate.value  = currentParty.date ? new Date(currentParty.date).toISOString().slice(0,16) : '';
  }

  // One handler each time (use assignment to avoid duplicates)
  if (isHost) {
    if (editPartyToggle) editPartyToggle.onclick = () => {
      editPartyForm.hidden = !editPartyForm.hidden;
      if (!editPartyForm.hidden) addGameHereForm.hidden = true;
    };
    if (addGameToggle) addGameToggle.onclick = () => {
      addGameHereForm.hidden = !addGameHereForm.hidden;
      if (!addGameHereForm.hidden) editPartyForm.hidden = true;
    };
    if (editPartyForm) editPartyForm.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        title: editTitle.value.trim(),
        venue: editVenue.value.trim() || null,
        description: editDesc.value.trim() || null,
        date: editDate.value ? new Date(editDate.value).toISOString() : null,
      };
      const { error: upErr } = await supabase.from('parties')
        .update(payload).eq('id', currentParty.id);
      if (upErr) return alert(upErr.message);
      editPartyForm.hidden = true;
      await loadParty(slug);
      alert('Party updated!');
    };
    if (addGameHereForm) addGameHereForm.onsubmit = async (e) => {
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

  // Header + share
  partyHeader.innerHTML = `
    <h2>${currentParty.title}</h2>
    <p class="muted">${fmtDate(currentParty.date)} • ${currentParty.venue || ''}</p>
    <p>${currentParty.description || ''}</p>
  `;
  const url = `${location.origin}${location.pathname}?party=${encodeURIComponent(slug)}`;
  partyShare.innerHTML = `Share link: <code>${url}</code> <button class="link" id="copyPartyLink">Copy</button>`;
  byId('copyPartyLink')?.addEventListener('click', () => copyToClipboard(url));

  // Games
  const { data: games, error: gErr } = await supabase
    .from('games')
    .select('*')
    .eq('party_id', currentParty.id)
    .eq('status', 'open')
    .order('created_at', { ascending: true });

  if (gErr) {
    partyGames.innerHTML = `<p>Error: ${gErr.message}</p>`;
    return;
  }

  partyGames.innerHTML = (!games || games.length === 0)
    ? '<p class="muted">No games yet.</p>'
    : games.map(g => `
        <div class="game-card">
          <h4>${g.title || defaultGameTitle(g.type)}</h4>
          <div class="muted">Type: ${g.type}</div>
          <p style="margin-top:6px; color:#374151;">
            Submissions & voting will appear here in the next step.
          </p>
        </div>
      `).join('');
}
