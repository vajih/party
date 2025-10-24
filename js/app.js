import { auth, supabase } from './auth.js';
import { byId, slugify, fmtDate, copyToClipboard } from './util.js';

/* ---------- Elements ---------- */
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
const partySlug       = byId('partySlug');
const hostPartiesList = byId('hostPartiesList');

const newGameForm     = byId('newGameForm');
const hostPartySelect = byId('hostPartySelect');
const gameType        = byId('gameType');
const gameTitle       = byId('gameTitle');

const partyCard   = byId('partyCard');
const partyHeader = byId('partyHeader');
const partyShare  = byId('partyShare');
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
const addGameType  = byId('addGameType');
const addGameTitle = byId('addGameTitle');

/* Manage hosts UI */
const manageHostsToggle = byId('manageHostsToggle');
const manageHostsForm   = byId('manageHostsForm');
const cohostEmail       = byId('cohostEmail');
const cohostRole        = byId('cohostRole');
const hostsList         = byId('hostsList');

const refreshMod = byId('refreshMod');
const modList    = byId('modList');

/* ---------- State ---------- */
let session = null;
let user    = null;
let currentParty = null;

/* ---------- Helpers to truly hide/show ---------- */
function hideEl(el){ if(!el) return; el.hidden = true; el.style.display = 'none'; }
function showEl(el, display=''){ if(!el) return; el.hidden = false; el.style.display = display; }

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('popstate', route);

backToDashBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  const base = `${location.origin}${location.pathname}`;
  history.pushState({}, '', base);
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
  signOutBtn?.addEventListener('click', async () => { await auth.signOut(); });

  createPartyForm?.addEventListener('submit', onCreateParty);
  newGameForm?.addEventListener('submit', onAddGame);
  refreshMod?.addEventListener('click', renderModQueue);

  route();
}

/* ---------- Auth UI ---------- */
function renderAuth() {
  const signedIn = !!user;

  if (signedIn) {
    authMsg.innerHTML = `Signed in as <strong>${user.email}</strong>`;
    hideEl(authForm);
    showEl(signOutBtn);
  } else {
    authMsg.textContent = 'Sign in to continue';
    showEl(authForm, '');
    hideEl(signOutBtn);
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

/* ---------- Router ---------- */
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

/* ---------- Parties: create & list ---------- */
async function onCreateParty(e) {
  e.preventDefault();
  if (!user) return alert('Please sign in first.');

  const title     = partyTitle.value.trim();
  const slugInput = partySlug.value.trim();
  let slug = slugify(slugInput || title);
  if (!slug) return alert('Please provide a title or slug.');

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

  hostPartiesList.dataset.partyIds = parties.map(p => p.id).join(',');
}

/* ---------- Add Game (dashboard) ---------- */
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
  else { gameTitle.value = ''; alert('Game added! Open the party link to see it.'); }
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

/* ---------- Party page ---------- */
async function loadParty(slug) {
  if (partyHeader) { partyHeader.hidden = false; partyHeader.innerHTML = 'Loading…'; }
  if (partyShare)  { partyShare.hidden  = false; partyShare.innerHTML  = ''; }
  if (partyGames)  { partyGames.hidden  = false; partyGames.innerHTML  = ''; }

  const { data: parties, error } = await supabase
    .from('parties').select('*')
    .eq('slug', slug).limit(1);

  if (error) { partyHeader.innerHTML = `<p>Error: ${error.message}</p>`; return; }
  currentParty = parties?.[0] ?? null;
  if (!currentParty) { partyHeader.innerHTML = `<h2>Party not found: ${slug}</h2>`; return; }

  if (welcomeTitle)   welcomeTitle.textContent    = currentParty.title || 'Welcome';
  if (welcomeSubtitle)welcomeSubtitle.textContent = `${fmtDate(currentParty.date)} • ${currentParty.venue || ''}`;

  if (!user) {
    showEl(welcomeCard);
    hideEl(partyHeader);
    hideEl(partyShare);
    hideEl(partyGames);
  } else {
    hideEl(welcomeCard);
  }

  /* Determine host status:
     - Owner (parties.host_id)
     - OR in party_hosts by user_id or invite_email
  */
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

  // Host tools
  editPartyForm.hidden = true;
  addGameHereForm.hidden = true;
  manageHostsForm.hidden = true;

  if (!isHost) {
    hideEl(hostTools);
    hideEl(backToDashBtn);
  } else {
    showEl(hostTools);
    showEl(backToDashBtn);

    // Prefill edit form
    editTitle.value = currentParty.title || '';
    editVenue.value = currentParty.venue || '';
    editDesc.value  = currentParty.description || '';
    editDate.value  = currentParty.date ? new Date(currentParty.date).toISOString().slice(0,16) : '';

    editPartyToggle.onclick = () => {
      editPartyForm.hidden = !editPartyForm.hidden;
      if (!editPartyForm.hidden) { addGameHereForm.hidden = true; manageHostsForm.hidden = true; }
    };
    addGameToggle.onclick = () => {
      addGameHereForm.hidden = !addGameHereForm.hidden;
      if (!addGameHereForm.hidden) { editPartyForm.hidden = true; manageHostsForm.hidden = true; }
    };

    /* Manage hosts toggle & handlers */
    manageHostsToggle.onclick = async () => {
      manageHostsForm.hidden = !manageHostsForm.hidden;
      if (!manageHostsForm.hidden) {
        editPartyForm.hidden = true;
        addGameHereForm.hidden = true;
        await renderHostsList();
      }
    };

    manageHostsForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = (cohostEmail.value || '').trim().toLowerCase();
      const role  = cohostRole.value || 'cohost';
      if (!email) return alert('Enter an email to invite.');

      const { error: insErr } = await supabase.from('party_hosts').insert({
        party_id: currentParty.id,
        invite_email: email,
        role
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
              <div><strong>${escapeHtml(h.role)}</strong></div>
              <div class="small">${h.user_id ? 'Linked user' : 'Invite'}: ${escapeHtml(h.invite_email || '—')}</div>
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
    .from('games').select('*')
    .eq('party_id', currentParty.id)
    .eq('status', 'open')
    .order('created_at', { ascending: true });

  if (gErr) { partyGames.innerHTML = `<p>Error: ${gErr.message}</p>`; return; }
  if (!games || games.length === 0) { partyGames.innerHTML = '<p class="small">No games yet.</p>'; return; }

  partyGames.innerHTML = games.map(renderGameCardSkeleton).join('');
  for (const g of games) await hydrateGameCard(g);
}

function renderGameCardSkeleton(g) {
  return `
    <div class="game-card" id="game-${g.id}">
      <h4>${g.title || defaultGameTitle(g.type)}</h4>
      <div class="muted">Type: ${g.type}</div>
      <div class="game-submit" id="submit-${g.id}" style="margin-top:8px;"></div>
      <div class="game-list" id="list-${g.id}" style="margin-top:8px;"></div>
    </div>
  `;
}

async function hydrateGameCard(game) {
  const submitWrap = byId(`submit-${game.id}`);
  const listWrap   = byId(`list-${game.id}`);

  let my = null;
  if (user) {
    const { data: mine } = await supabase
      .from('submissions').select('*')
      .eq('game_id', game.id).eq('user_id', user.id).limit(1);
    my = mine?.[0] ?? null;
  }

  const { data: approved } = await supabase
    .from('submissions').select('*')
    .eq('game_id', game.id).eq('moderation_status', 'approved')
    .order('created_at', { ascending: true });

  if (!user) {
    submitWrap.innerHTML = `<p class="small">Sign in to submit.</p>`;
  } else if (my) {
    submitWrap.innerHTML = `
      <div class="submission">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div><strong>Your submission</strong></div>
          <span class="pill ${my.moderation_status}">${my.moderation_status}</span>
        </div>
        ${renderSubmissionContent(game.type, my.content)}
      </div>
    `;
  } else {
    submitWrap.innerHTML = renderSubmissionForm(game);
    const form = submitWrap.querySelector('form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = readSubmissionForm(game, form);
      if (!payload) return;
      const { error } = await supabase.from('submissions').insert({
        party_id: currentParty.id,
        game_id: game.id,
        user_id: user.id,
        display_name: payload.display_name,
        content: payload.content,
        moderation_status: 'pending'
      });
      if (error) return alert(error.message);
      await hydrateGameCard(game);
      alert('Submitted! Awaiting host approval.');
    });
  }

  if (!approved || approved.length === 0) {
    listWrap.innerHTML = `<p class="small">No approved entries yet.</p>`;
  } else {
    listWrap.innerHTML = approved.map(row => `
      <div class="submission">
        ${renderSubmissionContent(game.type, row.content)}
        <div class="small" style="margin-top:6px;">by ${escapeHtml(row.display_name || 'Anonymous')}</div>
      </div>
    `).join('');
  }
}

/* ----- Submission forms (MVP) ----- */
function renderSubmissionForm(game) {
  switch (game.type) {
    case 'two_facts':
      return `
        <form class="stack">
          <input name="display_name" placeholder="Display name (shown after approval)" required />
          <input name="fact1" placeholder="Prompt / Fun fact #1" required />
          <input name="fact2" placeholder="Prompt / Fun fact #2" required />
          <button type="submit">Submit</button>
          <p class="small">Host will review before it goes live.</p>
        </form>
      `;
    case 'favorite_song':
      return `
        <form class="stack">
          <input name="display_name" placeholder="Display name" required />
          <input name="title" placeholder="Song title" required />
          <input name="artist" placeholder="Artist" required />
          <input name="link" type="url" placeholder="Link (Spotify, YouTube, etc.)" />
          <button type="submit">Submit</button>
          <p class="small">Host will review before it goes live.</p>
        </form>
      `;
    case 'baby_photo':
    case 'teen_photo':
    case 'wedding_photo':
      return `
        <form class="stack">
          <input name="display_name" placeholder="Display name" required />
          <input name="image_url" type="url" placeholder="Public image URL (.jpg/.png)" required />
          <button type="submit">Submit</button>
          <p class="small">Photos are reviewed by host before posting.</p>
        </form>
      `;
    default:
      return `<p>Submission not supported for this game type (yet).</p>`;
  }
}

function readSubmissionForm(game, form) {
  const fd = new FormData(form);
  const display_name = (fd.get('display_name') || '').toString().trim();
  if (!display_name) { alert('Please enter a display name.'); return null; }

  switch (game.type) {
    case 'two_facts': {
      const fact1 = (fd.get('fact1') || '').toString().trim();
      const fact2 = (fd.get('fact2') || '').toString().trim();
      if (!fact1 || !fact2) { alert('Please enter two items.'); return null; }
      return { display_name, content: { fact1, fact2 } };
    }
    case 'favorite_song': {
      const title = (fd.get('title') || '').toString().trim();
      const artist = (fd.get('artist') || '').toString().trim();
      const link = (fd.get('link') || '').toString().trim() || null;
      if (!title || !artist) { alert('Please enter song title and artist.'); return null; }
      return { display_name, content: { title, artist, link } };
    }
    case 'baby_photo':
    case 'teen_photo':
    case 'wedding_photo': {
      const image_url = (fd.get('image_url') || '').toString().trim();
      try { new URL(image_url); } catch { alert('Please paste a valid public image URL.'); return null; }
      return { display_name, content: { image_url } };
    }
    default:
      return null;
  }
}

function renderSubmissionContent(type, content) {
  if (!content) return '';
  switch (type) {
    case 'two_facts':
      return `<ul style="margin:6px 0 0 16px;"><li>${escapeHtml(content.fact1)}</li><li>${escapeHtml(content.fact2)}</li></ul>`;
    case 'favorite_song':
      return `
        <div><strong>${escapeHtml(content.title || '')}</strong> — ${escapeHtml(content.artist || '')}</div>
        ${content.link ? `<div class="small"><a href="${escapeHtml(content.link)}" target="_blank" rel="noopener">Open link</a></div>` : ''}
      `;
    case 'baby_photo':
    case 'teen_photo':
    case 'wedding_photo':
      return content.image_url ? `<img src="${escapeHtml(content.image_url)}" alt="submission image" />` : '';
    default:
      return `<pre class="small">${escapeHtml(JSON.stringify(content))}</pre>`;
  }
}

/* ---------- Welcome flow ---------- */
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

/* ---------- Moderation ---------- */
async function renderModQueue() {
  if (!user || !modList) return;

  const idsCSV   = hostPartiesList?.dataset?.partyIds || '';
  const partyIds = idsCSV ? idsCSV.split(',').filter(Boolean) : [];
  if (partyIds.length === 0) { modList.innerHTML = '<p class="muted">No parties yet.</p>'; return; }

  const { data, error } = await supabase
    .from('submissions')
    .select('id, party_id, game_id, display_name, content, moderation_status, created_at, parties!inner(title, slug), games!inner(type, title)')
    .in('party_id', partyIds)
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) { modList.innerHTML = `<p>Error: ${error.message}</p>`; return; }
  if (!data || data.length === 0) { modList.innerHTML = '<p class="muted">Nothing pending.</p>'; return; }

  modList.innerHTML = data.map(row => `
    <div class="item" data-id="${row.id}">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div><strong>${escapeHtml(row.games?.title || '')}</strong> <span class="small">(${escapeHtml(row.games?.type)})</span></div>
          <div class="small">in <code>${escapeHtml(row.parties?.slug)}</code> — ${escapeHtml(row.parties?.title)}</div>
          <div style="margin-top:6px;">${renderSubmissionContent(row.games?.type, row.content)}</div>
          <div class="small" style="margin-top:6px;">by ${escapeHtml(row.display_name || 'Anonymous')}</div>
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
      const p = new URLSearchParams(location.search).get('party');
      if (p) loadParty(p);
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
      const p = new URLSearchParams(location.search).get('party');
      if (p) loadParty(p);
    });
  });
}

/* ---------- Local util ---------- */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
