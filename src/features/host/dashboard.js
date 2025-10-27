import { supabase } from '../../services/supabaseClient.js';
import { toast } from '../../ui/toast.js';

const qs  = (s, r=document) => r.querySelector(s);
const qsa = (s, r=document) => [...r.querySelectorAll(s)];
const log = (...a) => console.debug('[host-dashboard]', ...a);

// Helper function to count registered users for a party
async function countRegistered(partyId) {
  const { count } = await supabase
    .from('party_profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('party_id', partyId);
  return count || 0;
}

// Get DOM elements - but don't store them globally since they might not exist yet
function getDashboardElements() {
  const hostPartiesList = qs('#hostPartiesList');
  const hostPartySelect = qs('#hostPartySelect');
  const hostGamesList = qs('#hostGamesList');

  return { hostPartiesList, hostPartySelect, hostGamesList };
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function fmtDate(iso) {
  if (!iso) return '';
  try { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle:'short' }).format(new Date(iso)); }
  catch { return ''; }
}
function slugify(str='') {
  return String(str).toLowerCase().trim().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function defaultGameTitle(type) {
  switch (type) {
    case 'two_facts': return 'Custom Prompts';
    case 'favorite_song': return 'Favorite Song';
    case 'baby_photo': return 'Baby Photo Contest';
    case 'about_you': return 'About You';
    case 'teen_photo': return 'Teenage Photo Contest';
    case 'wedding_photo': return 'Wedding Photo Contest';
    default: return 'Game';
  }
}

export async function initHostDashboard(user){
  log('init', { userId: user?.id, email: user?.email });

  // Wait a moment for DOM to be ready
  await new Promise(resolve => setTimeout(resolve, 0));

  // Get required DOM elements
  const { hostPartiesList, hostPartySelect, hostGamesList } = getDashboardElements();

  // Initialize admin navigation
  const { initAdminNav } = await import('../../ui/adminNav.js');
  await initAdminNav();

  // Ensure we have the required DOM elements
  if (!hostPartiesList || !hostPartySelect || !hostGamesList) {
    console.error('Missing required DOM elements for host dashboard. Elements found:', 
      { hostPartiesList, hostPartySelect, hostGamesList });
    return;
  }

  // Defensive: ensure header role badge reflects Host when dashboard initializes
  try {
    const rb = document.getElementById('roleBadge');
    if (rb) {
      rb.textContent = 'Host';
      rb.dataset.role = 'host';
      rb.setAttribute('data-role','host');
      rb.setAttribute('aria-pressed','true');
    }
  } catch(e) { /* ignore DOM timing issues */ }

  // Import and setup party management features
  try {
    const { setupPartyEditHandlers } = await import('./partyManagement.js');
    const { initCohostManagement } = await import('./cohostManagement.js');
    
    setupPartyEditHandlers();
    await initCohostManagement();

    // Listen for party updates
    window.addEventListener('party-updated', async () => {
      try {
        await renderHostParties(user);
        await renderHostGamesListFromSelect();
      } catch (err) {
        console.error('Error updating parties:', err);
        toast('Failed to refresh party list', { type: 'error' });
      }
    });

    bindCreateParty(user);
    bindAddGame();

    await renderHostParties(user);
    await renderHostGamesListFromSelect();
    await renderModQueue(user);

  } catch (err) {
    console.error('Error initializing host dashboard:', err);
    toast('Failed to initialize host dashboard', { type: 'error' });
  }
}

/* ---------- Create Party ---------- */
function bindCreateParty(user){
  const form = qs('#createPartyForm');
  if (!form) return;

  const title = qs('#partyTitle');
  const date  = qs('#partyDate');
  const venue = qs('#partyVenue');
  const desc  = qs('#partyDesc');
  const exp   = qs('#partyExpected');
  const slug  = qs('#partySlug');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!user) return alert('Please sign in first.');

    const t = (title.value || '').trim();
    if (!t) return alert('Please enter a title.');

    let s = (slug.value || '').trim() || slugify(t);
    s = `${s}-${Math.random().toString(36).slice(2,6)}`;

    // Debug current auth
    const cur = await supabase.auth.getUser();
    log('creating party', { uid: cur?.data?.user?.id, host_id: user.id, slug: s });

    const { data, error } = await supabase.from('parties').insert({
      host_id: user.id,
      title: t,
      description: (desc.value || '').trim() || null,
      date: date.value ? new Date(date.value).toISOString() : null,
      venue: (venue.value || '').trim() || null,
      expected_guests: exp.value ? Number(exp.value) : null,
      slug: s
    }).select('id');

    if (error) {
      console.error('[createParty] error', error);
      alert(`Create failed: ${error.message}`);
      return;
    }

    title.value = date.value = venue.value = desc.value = slug.value = '';
    exp.value = '';
    await renderYourParties(user);
    alert('Party created!');
  });
}

/* ---------- Your Parties ---------- */
export async function renderHostParties(user) {
  if (!user) return;
  
  const { hostPartiesList, hostPartySelect, hostGamesList } = getDashboardElements();
  if (!hostPartiesList) {
    console.error('Missing hostPartiesList element');
    return;
  }

  hostPartiesList.innerHTML = '<p class="muted">Loading…</p>';

  const { data: parties, error } = await supabase
    .from('parties')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    hostPartiesList.innerHTML = `<p>Error: ${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!parties?.length) {
    hostPartiesList.innerHTML = '<p class="small">No parties yet. Create one above.</p>';
    // clear any party selects
    ['#hostPartySelectList', '#hostPartySelect', '#gamePartySelect', '#cohostPartySelect'].forEach(sel => qsa(sel).forEach(el => el.innerHTML = ''));
    hostGamesList.innerHTML = '';
    return;
  }

  // Import party management functions
  const { loadPartyIntoEditForm, cancelParty } = await import('./partyManagement.js');

  hostPartiesList.innerHTML = await Promise.all(parties.map(async p => {
    const url = `${location.origin}${location.pathname}?party=${encodeURIComponent(p.slug)}`;
    const expected = Number(p.expected_guests || 0);
    const regCount = await countRegistered(p.id);
    const pct = expected > 0 ? Math.min(100, Math.round((regCount / expected) * 100)) : 0;
    
    return `
      <div class="item" data-id="${p.id}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <div style="flex:1;">
            <div class="party-header">
              <strong>${escapeHtml(p.title)}</strong>
              ${p.status === 'cancelled' ? '<span class="badge danger">Cancelled</span>' : ''}
            </div>
            <div class="small">${fmtDate(p.date)} • ${escapeHtml(p.venue || '')}</div>
            <div class="small">Slug: <code>${escapeHtml(p.slug)}</code></div>
            <div class="small" style="margin-top:6px;">
              Registered: <strong>${regCount}</strong> / ${expected || '—'} ${expected ? `(${pct}%)` : ''}
            </div>
            <div class="progress" style="margin-top:6px;">
              <span style="width:${pct}%;"></span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            <div style="display:flex;gap:8px;">
              <button class="link copyBtn" data-url="${url}">Copy link</button>
              <a class="badge" href="?party=${encodeURIComponent(p.slug)}">Open</a>
            </div>
            ${p.status !== 'cancelled' ? `
              <div style="display:flex;gap:8px;">
                <button class="link editPartyBtn" data-party-id="${p.id}">Edit</button>
                <button class="link danger cancelPartyBtn" data-party-id="${p.id}">Cancel Party</button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  })).then(parts => parts.join(''));

  const opts = parties
    .filter(p => p.status !== 'cancelled')
    .map(p => `<option value="${p.id}">${escapeHtml(p.title)} (${escapeHtml(p.slug)})</option>`)
    .join('');

  // Populate all relevant party selects (header, game add form, cohost selector)
  const partySelectIds = ['#hostPartySelectList', '#hostPartySelect', '#gamePartySelect', '#cohostPartySelect'];
  partySelectIds.forEach(sel => {
    qsa(sel).forEach(el => { el.innerHTML = opts; });
  });

  // Wire up edit buttons
  hostPartiesList.querySelectorAll('.editPartyBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const partyId = btn.dataset.partyId;
      const party = parties.find(p => p.id === partyId);
      if (party) loadPartyIntoEditForm(party);
    });
  });

  // Wire up cancel buttons
  hostPartiesList.querySelectorAll('.cancelPartyBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const partyId = btn.dataset.partyId;
      if (!confirm('Are you sure you want to cancel this party? This will close all games and cannot be undone.')) return;
      
      const { error } = await cancelParty(partyId);
      if (error) {
        console.error('Cancel party error:', error);
        alert('Failed to cancel party: ' + error.message);
        return;
      }

      window.dispatchEvent(new CustomEvent('party-updated'));
    });
  });
}

/* ---------- Games add / list / rename / delete ---------- */
function bindAddGame(){
  const form = qs('#newGameForm');
  if (!form) return;

  const partySel = qs('#hostPartySelect');
  const typeSel  = qs('#gameType');
  const titleInp = qs('#gameTitle');
  
  // Mark the form so other modules (like app.js) won't attach a duplicate handler
  try { form.dataset.boundByDashboard = '1'; } catch (e) {}
  console.debug('[bindAddGame] Found elements:', { form, partySel, typeSel, titleInp });

  // Show/hide questions builder when 'about_you' selected
  const aboutWrap = qs('#aboutQuestionsWrap');
  if (typeSel && aboutWrap) {
    typeSel.addEventListener('change', () => {
      aboutWrap.style.display = typeSel.value === 'about_you' ? 'block' : 'none';
    });
    // initialize
    aboutWrap.style.display = typeSel.value === 'about_you' ? 'block' : 'none';
  }

  // Live preview binding for questions textarea
  const previewWrap = qs('#aboutPreview');
  const previewInner = qs('#aboutPreviewInner');
  const qta = qs('#aboutQuestions');
  function renderPreview() {
    if (!qta) return;
    const lines = (qta.value||'').split('\n').map(s=>s.trim()).filter(Boolean);
    if (!lines.length) { if (previewWrap) previewWrap.style.display = 'none'; return; }
    if (previewWrap) previewWrap.style.display = 'block';
    const html = ['<div class="small muted">Guests will see these fields:</div>', '<ul style="margin:8px 0 0 16px">', ...lines.map((l,i)=>`<li><strong>${escapeHtml(l)}</strong><div class="small">(sample answer input)</div></li>`), '</ul>'].join('');
    if (previewInner) previewInner.innerHTML = html;
  }
  qta?.addEventListener('input', renderPreview);
  renderPreview();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const partyId = partySel?.value;
    if (!partyId) return alert('Choose a party.');
    const type  = typeSel?.value || 'two_facts';
    const title = (titleInp?.value || '').trim() || defaultGameTitle(type);

    // Build config for about_you
    let config = {};
    if (type === 'about_you') {
      const raw = (qs('#aboutQuestions')?.value || '').split('\n').map(s => s.trim()).filter(Boolean);
      config.questions = raw.map(q => {
        // Check if question has dropdown options in format: "Question [Option1, Option2, ...]"
        const dropdownMatch = q.match(/^(.+?)\s*\[(.+)\]$/);
        if (dropdownMatch) {
          const label = dropdownMatch[1].trim();
          const options = dropdownMatch[2].split(',').map(opt => opt.trim()).filter(Boolean);
          return { label, options };
        }
        return { label: q };
      });
      console.debug('[about_you] Saving config:', config);
      // Ensure we have at least default questions if none provided
      if (!config.questions?.length) {
        config.questions = [
          { label: "What is a fun fact about you?" },
          { label: "What is your favorite memory?" },
          { label: "What are you looking forward to?" }
        ];
      }
    }

    const { error } = await supabase.from('games').insert({ party_id: partyId, type, title, status:'open', config });
    if (error) { console.error('[addGame] error', error); return alert(error.message); }
    titleInp.value = '';
    await renderHostGamesListFromSelect();
    // Notify other parts of the app (reload party view, refresh cohost lists, etc.)
    window.dispatchEvent(new CustomEvent('party-updated'));
    // Broadcast to other tabs/windows
    try {
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('party-updates');
        bc.postMessage({ type: 'party-updated', partyId: partyId });
        bc.close();
      }
    } catch (e) { /* ignore */ }
    alert('Game added!');
  });

  qs('#hostPartySelect')?.addEventListener('change', renderHostGamesListFromSelect);
  partySel?.addEventListener('change', renderHostGamesListFromSelect);
}

export async function renderHostGamesListFromSelect(){
  const { hostPartySelect, hostGamesList } = getDashboardElements();
  // Prefer the game-specific selector if present, otherwise fall back to header host select
  const gamePartySel = qs('#gamePartySelect');
  const partyId = (gamePartySel && gamePartySel.value) || hostPartySelect?.value;
  const list = hostGamesList;
  if (!list) return;
  if (!partyId) { list.innerHTML = '<p class="small">Pick a party above.</p>'; return; }

  list.innerHTML = '<p class="small">Loading…</p>';
  const { data: games, error } = await supabase.from('games').select('*').eq('party_id', partyId).order('created_at', { ascending: true });
  if (error) { list.innerHTML = `<p>Error: ${escapeHtml(error.message)}</p>`; return; }
  if (!games?.length) { list.innerHTML = '<p class="small">No games yet.</p>'; return; }

  list.innerHTML = games.map(g => `
    <div class="item" data-id="${g.id}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div>
          <div><strong>${escapeHtml(g.title || defaultGameTitle(g.type))}</strong></div>
          <div class="muted">Type: ${escapeHtml(g.type)} • Status: ${escapeHtml(g.status)}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="link renameBtn">Rename</button>
          <button class="link danger delBtn">Delete</button>
        </div>
      </div>
    </div>`).join('');

  qsa('.renameBtn', list).forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.item');
      const id = row?.getAttribute('data-id');
      const cur = row?.querySelector('strong')?.textContent || '';
      const title = prompt('New title?', cur);
      if (!title) return;
      const { error } = await supabase.from('games').update({ title }).eq('id', id);
      if (error) { console.error('[renameGame] error', error); return alert(error.message); }
      await renderHostGamesListFromSelect();
    });
  });

  qsa('.delBtn', list).forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('.item')?.getAttribute('data-id');
      if (!confirm('Delete this game? This will also remove its submissions.')) return;
      const { error } = await supabase.from('games').delete().eq('id', id);
      if (error) { console.error('[deleteGame] error', error); return alert(error.message); }
      await renderHostGamesListFromSelect();
    });
  });
}

/* ---------- Moderation queue ---------- */
async function renderModQueue(user){
  const modList = qs('#modList');
  if (!modList) return;

  // grab ids from rendered list (works cross-tenant)
  const ids = [];
  qsa('#hostPartiesList .item').forEach(el => {
    const id = el.getAttribute('data-id');
    if (id) ids.push(id);
  });
  if (!ids.length) { modList.innerHTML = '<p class="small">No parties yet.</p>'; return; }

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      id, party_id, game_id, display_name, content, moderation_status, created_at,
      parties:party_id ( slug, title ),
      games:game_id ( type, title, config )
    `)
    .in('party_id', ids)
    .eq('moderation_status','pending')
    .order('created_at', { ascending: true });

  if (error) { modList.innerHTML = `<p>Error: ${escapeHtml(error.message)}</p>`; return; }
  if (!data?.length) { modList.innerHTML = '<p class="small">Nothing pending.</p>'; return; }

  function formatSubmission(row) {
    const type = row.games?.type;
    const content = row.content || {};
    
    // Handle baby_photo submissions with image preview
    if (type === 'baby_photo' && content.photo_url) {
      const photoInfo = content.photo_info ? `<div class="small" style="margin-top:4px;"><strong>Photo Info:</strong> ${escapeHtml(content.photo_info)}</div>` : '';
      return `<div style="margin-top:8px;">
        <img src="${escapeHtml(content.photo_url)}" 
             alt="Baby photo submission" 
             style="max-width:200px;max-height:200px;border-radius:8px;border:1px solid #e5e7eb;object-fit:cover;" />
        ${photoInfo}
      </div>`;
    }
    
    if (type === 'about_you' && content.answers) {
      let cfg = row.games?.config || null;
      if (typeof cfg === 'string') {
        try { cfg = JSON.parse(cfg); } catch (e) { cfg = null; }
      }
      const qsCfg = (cfg && Array.isArray(cfg.questions)) ? cfg.questions : null;
      if (qsCfg) {
        return `<ul style="margin:6px 0 0 16px;">${qsCfg.map((q, i) => {
          const key = `q_${i}`;
          const label = q.label || `Question ${i+1}`;
          return `<li><strong>${escapeHtml(label)}</strong>: ${escapeHtml((content.answers && content.answers[key])||'')}</li>`;
        }).join('')}</ul>`;
      }
      return `<pre class="small">${escapeHtml(JSON.stringify(content, null, 2))}</pre>`;
    }
    return `<pre class="small" style="white-space:pre-wrap;background:#f9fafb;border:1px solid #eee;padding:6px;border-radius:8px;margin-top:6px;">${escapeHtml(JSON.stringify(content, null, 2))}</pre>`;
  }

  function formatSubmittedBy(row) {
    const content = row.content || {};
    const submittedByName = content.submitted_by_name;
    const displayName = row.display_name;
    
    if (submittedByName) {
      return `Submitted by <strong>${escapeHtml(submittedByName)}</strong>`;
    } else if (displayName) {
      return `by ${escapeHtml(displayName)}`;
    }
    return 'by Anonymous';
  }

  modList.innerHTML = data.map(row => `
    <div class="item" data-id="${row.id}">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div><strong>${escapeHtml(row.games?.title || '')}</strong> <span class="small">(${escapeHtml(row.games?.type)})</span></div>
          <div class="small">in <code>${escapeHtml(row.parties?.slug)}</code> — ${escapeHtml(row.parties?.title)}</div>
          <div class="small" style="margin-top:6px;">${formatSubmittedBy(row)}</div>
          ${formatSubmission(row)}
        </div>
        <div style="display:flex;gap:8px;">
          <button class="link approveBtn">Approve</button>
          <button class="link rejectBtn">Reject</button>
        </div>
      </div>
    </div>`).join('');

  qsa('.approveBtn', modList).forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('.item').getAttribute('data-id');
      const { error } = await supabase.from('submissions').update({
        moderation_status: 'approved',
        moderated_by: user.id,
        moderated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) { console.error('[approve] error', error); return alert(error.message); }
      await renderModQueue(user);
    });
  });
  qsa('.rejectBtn', modList).forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('.item').getAttribute('data-id');
      const { error } = await supabase.from('submissions').update({
        moderation_status: 'rejected',
        moderated_by: user.id,
        moderated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) { console.error('[reject] error', error); return alert(error.message); }
      await renderModQueue(user);
    });
  });
}
