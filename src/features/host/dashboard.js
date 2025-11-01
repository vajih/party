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

  // Ensure we have the required DOM elements (hostPartySelect is optional - only in report section)
  if (!hostPartiesList || !hostGamesList) {
    console.error('Missing required DOM elements for host dashboard. Elements found:', 
      { hostPartiesList, hostGamesList });
    return;
  }

  // Defensive: ensure header role badge reflects Host when dashboard initializes
  try {
    const rb = document.getElementById('roleBadge');
    if (rb) {
      rb.textContent = 'H';
      rb.dataset.role = 'host';
      rb.setAttribute('data-role','host');
      rb.setAttribute('aria-pressed','true');
      rb.setAttribute('title', 'Host');
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
    await renderAboutYouReport(user);

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
    await renderHostParties(user);
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
    // clear any party selects (removed #hostPartySelect as it's no longer in header)
    ['#hostPartySelectList', '#gamePartySelect', '#cohostPartySelect'].forEach(sel => qsa(sel).forEach(el => el.innerHTML = ''));
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

  // Populate all relevant party selects (About You report, game add form, cohost selector)
  // Note: removed #hostPartySelect from header as it was redundant
  const partySelectIds = ['#hostPartySelectList', '#gamePartySelect', '#cohostPartySelect'];
  partySelectIds.forEach(sel => {
    qsa(sel).forEach(el => { el.innerHTML = opts; });
  });

  // Wire up copy link buttons
  hostPartiesList.querySelectorAll('.copyBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = btn.dataset.url;
      try {
        await navigator.clipboard.writeText(url);
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1500);
      } catch (err) {
        console.error('Failed to copy:', err);
        btn.textContent = 'Failed to copy';
        setTimeout(() => {
          btn.textContent = 'Copy link';
        }, 1500);
      }
    });
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

  const partySel = qs('#gamePartySelect'); // Use game form's party selector instead of header
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

  // Listen for party selection changes in the game form
  partySel?.addEventListener('change', renderHostGamesListFromSelect);
}

export async function renderHostGamesListFromSelect(){
  const { hostGamesList } = getDashboardElements();
  // Use the game-specific selector from the form
  const gamePartySel = qs('#gamePartySelect');
  const partyId = gamePartySel?.value;
  const list = hostGamesList;
  if (!list) return;
  if (!partyId) { list.innerHTML = '<p class="small">Pick a party above.</p>'; return; }

  list.innerHTML = '<p class="small">Loading…</p>';
  const { data: games, error } = await supabase.from('games').select('*').eq('party_id', partyId).order('created_at', { ascending: true });
  if (error) { list.innerHTML = `<p>Error: ${escapeHtml(error.message)}</p>`; return; }
  if (!games?.length) { list.innerHTML = '<p class="small">No games yet.</p>'; return; }

  list.innerHTML = games.map(g => `
    <div class="item" data-id="${g.id}" data-type="${g.type}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div>
          <div><strong>${escapeHtml(g.title || defaultGameTitle(g.type))}</strong></div>
          <div class="muted">Type: ${escapeHtml(g.type)} • Status: ${escapeHtml(g.status)}</div>
        </div>
        <div style="display:flex;gap:8px;">
          ${g.type === 'about_you' ? '<button class="link previewQuestionsBtn">Preview Questions</button>' : ''}
          ${g.type === 'favorite_song' ? '<button class="link viewSongsBtn">View Songs</button>' : ''}
          ${g.type === 'baby_photo' ? '<button class="link viewPhotosBtn">View Photos</button>' : ''}
          <button class="link toggleStatusBtn">${g.status === 'open' ? 'Close' : 'Open'}</button>
          <button class="link renameBtn">Rename</button>
          <button class="link danger delBtn">Delete</button>
        </div>
      </div>
    </div>`).join('');

  // Preview Questions button (for About You games only)
  qsa('.previewQuestionsBtn', list).forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.item');
      const gameType = row?.getAttribute('data-type');
      
      if (gameType === 'about_you') {
        // Import the questions config
        try {
          const { QUESTION_BATCHES } = await import('../../../js/questions-config.js');
          showQuestionsPreviewModal(QUESTION_BATCHES);
        } catch (error) {
          console.error('[previewQuestions] Error loading questions:', error);
          alert('Failed to load questions configuration');
        }
      }
    });
  });

  // View Songs button (for Favorite Song games)
  qsa('.viewSongsBtn', list).forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.item');
      const gameId = row?.getAttribute('data-id');
      
      if (gameId) {
        await showSongsModal(gameId);
      }
    });
  });

  // View Photos button (for Baby Photo games)
  qsa('.viewPhotosBtn', list).forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.item');
      const gameId = row?.getAttribute('data-id');
      
      if (gameId) {
        await showPhotosModal(gameId);
      }
    });
  });

  qsa('.toggleStatusBtn', list).forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.item');
      const id = row?.getAttribute('data-id');
      const game = games.find(g => g.id === id);
      if (!game) return;
      
      const newStatus = game.status === 'open' ? 'closed' : 'open';
      const { error } = await supabase.from('games').update({ status: newStatus }).eq('id', id);
      if (error) { console.error('[toggleStatus] error', error); return alert(error.message); }
      await renderHostGamesListFromSelect();
    });
  });

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
    .neq('games.type', 'about_you')  // Exclude About You from moderation
    .order('created_at', { ascending: true });

  if (error) { modList.innerHTML = `<p>Error: ${escapeHtml(error.message)}</p>`; return; }
  if (!data?.length) { modList.innerHTML = '<p class="small">Nothing pending.</p>'; return; }

  function formatSubmission(row) {
    const type = row.games?.type;
    const content = row.content || {};
    
    // Handle baby_photo submissions with image preview
    if (type === 'baby_photo' && content.photo_url) {
      const photoInfo = content.photo_info ? `<div class="small" style="margin-top:4px;"><strong>Photo Info:</strong> ${escapeHtml(content.photo_info)}</div>` : '';
      const submittedBy = content.submitted_by_name || row.display_name || 'Anonymous';
      const submittedEmail = content.submitted_by_email || '';
      const submittedWhatsapp = content.submitted_by_whatsapp || '';
      return `<div style="margin-top:8px;">
        <img src="${escapeHtml(content.photo_url)}" 
             alt="Baby photo submission" 
             style="max-width:200px;max-height:200px;border-radius:8px;border:1px solid #e5e7eb;object-fit:cover;" />
        ${photoInfo}
        <div class="small" style="margin-top:8px;">
          <strong>Name:</strong> ${escapeHtml(submittedBy)}<br>
          <strong>Email:</strong> ${escapeHtml(submittedEmail) || '<span style=\"color:#aaa;\">N/A</span>'}<br>
          <strong>WhatsApp:</strong> ${escapeHtml(submittedWhatsapp) || '<span style=\"color:#aaa;\">N/A</span>'}
        </div>
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

/**
 * ABOUT YOU REPORT
 * Displays aggregated answers from guests for About You questions
 */
async function renderAboutYouReport(user) {
  const reportPartySelect = qs('#reportPartySelect');
  const reportContent = qs('#reportContent');
  const refreshBtn = qs('#refreshReportBtn');
  const exportBtn = qs('#exportReportBtn');
  const viewModeSelect = qs('#reportViewMode');
  const filterSelect = qs('#reportFilterCompletion');

  if (!reportPartySelect || !reportContent) return;

  // Populate party selector
  const { data: parties } = await supabase
    .from('parties')
    .select('id, slug, title')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  if (!parties || parties.length === 0) {
    reportContent.innerHTML = '<p class="small muted">You have no parties yet. Create a party to see reports.</p>';
    return;
  }

  reportPartySelect.innerHTML = '<option value="">Select a party...</option>' +
    parties.map(p => `<option value="${p.id}">${escapeHtml(p.title)}</option>`).join('');

  // Handle party selection change
  const loadReport = async () => {
    const partyId = reportPartySelect.value;
    if (!partyId) {
      reportContent.innerHTML = '<p class="small muted">Select a party to view the About You report.</p>';
      return;
    }

    // Query all profiles for this party with batch_progress and extended_answers
    const { data: profiles, error } = await supabase
      .from('party_profiles')
      .select('party_id, user_id, display_name, batch_progress, extended_answers, birth_city, birth_lat, birth_lng, fav_dest_city, fav_dest_lat, fav_dest_lng')
      .eq('party_id', partyId)
      .order('display_name');

    if (error) {
      console.error('[report] error fetching profiles', error);
      console.error('[report] error details:', error.message, error.code, error.details);
      
      // Check if columns don't exist yet
      if (error.message && (error.message.includes('batch_progress') || error.message.includes('extended_answers'))) {
        reportContent.innerHTML = `
          <div class="card" style="padding: 24px; text-align: center;">
            <h3 style="color: var(--warning-text); margin-bottom: 16px;">⚠️ Database Migration Required</h3>
            <p style="margin-bottom: 16px;">The About You Report requires new database columns. Please run the migration:</p>
            <ol style="text-align: left; margin: 0 auto; max-width: 500px; line-height: 1.8;">
              <li>Open Supabase Dashboard → SQL Editor</li>
              <li>Copy the contents of <code>sql/migration_about_you_batches.sql</code></li>
              <li>Run the migration script</li>
              <li>Refresh this page</li>
            </ol>
            <p style="margin-top: 16px; font-size: 0.875rem; color: var(--text-2);">
              Error: ${escapeHtml(error.message)}
            </p>
          </div>
        `;
      } else {
        toast('Error loading report: ' + error.message, 'error');
        reportContent.innerHTML = `<p class="small muted">Error loading report: ${escapeHtml(error.message)}</p>`;
      }
      return;
    }

    if (!profiles || profiles.length === 0) {
      reportContent.innerHTML = '<p class="small muted">No guest profiles found for this party.</p>';
      return;
    }

    // Calculate stats
    const total = profiles.length;
    const withProgress = profiles.filter(p => p.batch_progress);
    const completed = withProgress.filter(p => {
      const bp = p.batch_progress || {};
      return bp.batch_1 === 'complete' && bp.batch_2 === 'complete' && bp.batch_3 === 'complete';
    }).length;
    const inProgress = withProgress.filter(p => {
      const bp = p.batch_progress || {};
      return (bp.batch_1 || bp.batch_2 || bp.batch_3) && 
        !(bp.batch_1 === 'complete' && bp.batch_2 === 'complete' && bp.batch_3 === 'complete');
    }).length;

    // Calculate average completion percentage
    const avgCompletion = withProgress.length > 0
      ? Math.round(withProgress.reduce((sum, p) => {
          const bp = p.batch_progress || {};
          let count = 0;
          if (bp.batch_1 === 'complete') count++;
          if (bp.batch_2 === 'complete') count++;
          if (bp.batch_3 === 'complete') count++;
          return sum + (count / 3 * 100);
        }, 0) / withProgress.length)
      : 0;

    // Update stats
    qs('#reportTotalProfiles').textContent = total;
    qs('#reportCompleted').textContent = completed;
    qs('#reportInProgress').textContent = inProgress;
    qs('#reportAvgCompletion').textContent = `${avgCompletion}%`;

    // Filter profiles based on selection
    const filterMode = filterSelect.value;
    let filteredProfiles = profiles;
    if (filterMode === 'complete') {
      filteredProfiles = profiles.filter(p => {
        const bp = p.batch_progress || {};
        return bp.batch_1 === 'complete' && bp.batch_2 === 'complete' && bp.batch_3 === 'complete';
      });
    } else if (filterMode === 'incomplete') {
      filteredProfiles = profiles.filter(p => {
        const bp = p.batch_progress || {};
        return !(bp.batch_1 === 'complete' && bp.batch_2 === 'complete' && bp.batch_3 === 'complete');
      });
    }

    // Render based on view mode
    const viewMode = viewModeSelect.value;
    if (viewMode === 'summary') {
      renderSummaryView(filteredProfiles);
    } else if (viewMode === 'detailed') {
      renderDetailedView(filteredProfiles);
    } else if (viewMode === 'aggregate') {
      renderAggregateView(profiles);
    }
  };

  // Render summary view (list of guests with progress)
  function renderSummaryView(profiles) {
    if (profiles.length === 0) {
      reportContent.innerHTML = '<p class="small muted">No profiles match the selected filter.</p>';
      return;
    }

    const html = `
      <ul class="report-guest-list">
        ${profiles.map(p => {
          const bp = p.batch_progress || {};
          const b1 = bp.batch_1 || 'not_started';
          const b2 = bp.batch_2 || 'not_started';
          const b3 = bp.batch_3 || 'not_started';
          
          let completedCount = 0;
          if (b1 === 'complete') completedCount++;
          if (b2 === 'complete') completedCount++;
          if (b3 === 'complete') completedCount++;
          const percentage = Math.round((completedCount / 3) * 100);

          return `
            <li class="report-guest-item" data-profile-user-id="${p.user_id}">
              <div class="report-guest-header">
                <span class="report-guest-name">${escapeHtml(p.display_name || 'Anonymous')}</span>
                <div class="report-batch-status">
                  <span class="report-batch-badge ${b1 === 'complete' ? 'complete' : b1 === 'in_progress' ? 'in-progress' : ''}" title="Batch 1">1</span>
                  <span class="report-batch-badge ${b2 === 'complete' ? 'complete' : b2 === 'in_progress' ? 'in-progress' : ''}" title="Batch 2">2</span>
                  <span class="report-batch-badge ${b3 === 'complete' ? 'complete' : b3 === 'in_progress' ? 'in-progress' : ''}" title="Batch 3">3</span>
                </div>
              </div>
              <div class="report-progress-bar">
                <div class="report-progress-fill" style="width: ${percentage}%"></div>
              </div>
              <div class="report-completion-text">${completedCount} of 3 batches complete (${percentage}%)</div>
              ${p.extended_answers ? '<button class="report-view-details-btn link" data-profile-user-id="' + p.user_id + '">View Answers</button>' : '<span class="small muted">No answers yet</span>'}
            </li>
          `;
        }).join('')}
      </ul>
    `;

    reportContent.innerHTML = html;

    // Add click handlers for view details
    qsa('.report-view-details-btn', reportContent).forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-profile-user-id');
        const profile = profiles.find(p => p.user_id === userId);
        if (profile) showAnswerDetailsModal(profile);
      });
    });
  }

  // Render detailed view (all answers for each guest)
  function renderDetailedView(profiles) {
    if (profiles.length === 0) {
      reportContent.innerHTML = '<p class="small muted">No profiles match the selected filter.</p>';
      return;
    }

    // Import questions config dynamically
    import('../../../js/questions-config.js').then(module => {
      const { QUESTION_BATCHES } = module;
      const allQuestions = {};
      QUESTION_BATCHES.forEach(batch => {
        batch.questions.forEach(q => {
          allQuestions[q.id] = q;
        });
      });

      const html = profiles.map(p => {
        const answers = p.extended_answers || {};
        const hasAnswers = Object.keys(answers).length > 0;

        if (!hasAnswers) {
          return `
            <div style="margin-bottom: 32px;">
              <h3>${escapeHtml(p.display_name || 'Anonymous')}</h3>
              <p class="small muted">No answers submitted yet.</p>
            </div>
          `;
        }

        const answerHtml = Object.entries(answers).map(([qId, answer]) => {
          const question = allQuestions[qId];
          if (!question) return '';

          let displayAnswer = '';
          if (question.kind === 'either_or') {
            // Resolve A/B to actual label text
            let selectedId = (typeof answer === 'object') ? answer.selected : answer;
            let modifiers = (typeof answer === 'object') ? (answer.modifiers || []) : [];
            
            if (selectedId && question.options) {
              const option = question.options.find(opt => opt.id === selectedId);
              displayAnswer = option ? option.label : selectedId;
            } else {
              displayAnswer = 'No answer';
            }
            
            if (modifiers.length > 0) {
              displayAnswer += ` <span class="detailed-answer-tag">${modifiers.join(', ')}</span>`;
            }
          } else if (question.kind === 'single_choice') {
            displayAnswer = answer || 'No answer';
          } else if (question.kind === 'short_text') {
            displayAnswer = answer || 'No answer';
          }

          return `
            <div class="detailed-answer-item">
              <div class="detailed-answer-question">${escapeHtml(question.prompt)}</div>
              <div class="detailed-answer-response">${displayAnswer}</div>
            </div>
          `;
        }).join('');

        return `
          <div class="detailed-guest-section">
            <h3>${escapeHtml(p.display_name || 'Anonymous')}</h3>
            ${answerHtml}
          </div>
        `;
      }).join('');

      reportContent.innerHTML = html || '<p class="small muted">No answers to display.</p>';
    });
  }

  // Initialize birth city map
  function initBirthCityMap(profiles) {
    console.log('[initBirthCityMap] Called with profiles:', profiles);
    
    const mapContainer = document.getElementById('birthCityMap');
    if (!mapContainer) {
      console.error('[initBirthCityMap] Map container not found');
      return;
    }

    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
      console.error('[initBirthCityMap] Leaflet not loaded');
      return;
    }

    // Don't clear the container - Leaflet needs it to exist
    // Just check if map already exists and remove it
    if (mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
    }
    mapContainer.innerHTML = '';
    
    // Create map - use the container ID
    const map = L.map('birthCityMap', {
      center: [30, 0],
      zoom: 2
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Group profiles by city to count users per city
    const cityGroups = {};
    profiles.forEach(p => {
      console.log('[initBirthCityMap] Profile:', {
        display_name: p.display_name,
        birth_city: p.birth_city,
        birth_lat: p.birth_lat,
        birth_lng: p.birth_lng
      });
      
      if (p.birth_lat && p.birth_lng && p.birth_city) {
        const cityKey = `${p.birth_city}-${p.birth_lat}-${p.birth_lng}`;
        if (!cityGroups[cityKey]) {
          cityGroups[cityKey] = {
            city: p.birth_city,
            lat: p.birth_lat,
            lng: p.birth_lng,
            guests: []
          };
        }
        cityGroups[cityKey].guests.push(p.display_name || 'Guest');
      }
    });

    const cityData = Object.values(cityGroups);
    console.log('[initBirthCityMap] City data:', cityData);
    
    if (cityData.length === 0) {
      console.warn('[initBirthCityMap] No cities with coordinates found');
      return;
    }

    // Find max count for scaling
    const maxCount = Math.max(...cityData.map(c => c.guests.length));
    console.log('[initBirthCityMap] Max count:', maxCount);
    
    // Add circle markers with proportional sizing
    const bounds = [];
    cityData.forEach(city => {
      const count = city.guests.length;
      
      // Scale radius based on count (8-30px range)
      const radius = 8 + (count / maxCount) * 22;
      
      console.log('[initBirthCityMap] Adding circle:', {
        city: city.city,
        lat: city.lat,
        lng: city.lng,
        count: count,
        radius: radius
      });
      
      // Create circle marker
      const circle = L.circleMarker([city.lat, city.lng], {
        radius: radius,
        fillColor: '#8b5cf6',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7
      }).addTo(map);
      
      // Create popup with guest list
      const guestList = city.guests.map(name => `• ${escapeHtml(name)}`).join('<br/>');
      const plural = count === 1 ? 'guest' : 'guests';
      circle.bindPopup(`
        <div style="min-width: 150px;">
          <strong style="font-size: 1.1em; color: #1f2937;">${escapeHtml(city.city)}</strong>
          <div style="color: #6b7280; font-size: 0.9em; margin: 4px 0 8px 0;">${count} ${plural}</div>
          <div style="font-size: 0.85em; line-height: 1.5; color: #4b5563;">${guestList}</div>
        </div>
      `);
      
      bounds.push([city.lat, city.lng]);
    });

    console.log('[initBirthCityMap] Total circles added:', cityData.length);

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  // Initialize favorite travel destination map
  function initTravelDestMap(profiles) {
    console.log('[initTravelDestMap] Called with profiles:', profiles);
    
    const mapContainer = document.getElementById('travelDestMap');
    if (!mapContainer) {
      console.error('[initTravelDestMap] Map container not found');
      return;
    }

    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
      console.error('[initTravelDestMap] Leaflet not loaded');
      return;
    }

    // Handle existing map
    if (mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
    }
    mapContainer.innerHTML = '';
    
    // Create map
    const map = L.map('travelDestMap', {
      center: [30, 0],
      zoom: 2
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Group profiles by destination city to count users per city
    const cityGroups = {};
    profiles.forEach(p => {
      console.log('[initTravelDestMap] Profile:', {
        display_name: p.display_name,
        fav_dest_city: p.fav_dest_city,
        fav_dest_lat: p.fav_dest_lat,
        fav_dest_lng: p.fav_dest_lng
      });
      
      if (p.fav_dest_lat && p.fav_dest_lng && p.fav_dest_city) {
        const cityKey = `${p.fav_dest_city}-${p.fav_dest_lat}-${p.fav_dest_lng}`;
        if (!cityGroups[cityKey]) {
          cityGroups[cityKey] = {
            city: p.fav_dest_city,
            lat: p.fav_dest_lat,
            lng: p.fav_dest_lng,
            guests: []
          };
        }
        cityGroups[cityKey].guests.push(p.display_name || 'Guest');
      }
    });

    const cityData = Object.values(cityGroups);
    console.log('[initTravelDestMap] City data:', cityData);
    
    if (cityData.length === 0) {
      console.warn('[initTravelDestMap] No destination cities with coordinates found');
      return;
    }

    // Find max count for scaling
    const maxCount = Math.max(...cityData.map(c => c.guests.length));
    console.log('[initTravelDestMap] Max count:', maxCount);
    
    // Add circle markers with proportional sizing
    const bounds = [];
    cityData.forEach(city => {
      const count = city.guests.length;
      
      // Scale radius based on count (8-30px range)
      const radius = 8 + (count / maxCount) * 22;
      
      console.log('[initTravelDestMap] Adding circle:', {
        city: city.city,
        lat: city.lat,
        lng: city.lng,
        count: count,
        radius: radius
      });
      
      // Create circle marker with different color (teal/cyan for travel)
      const circle = L.circleMarker([city.lat, city.lng], {
        radius: radius,
        fillColor: '#06b6d4',  // Cyan color for travel
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7
      }).addTo(map);
      
      // Create popup with guest list
      const guestList = city.guests.map(name => `• ${escapeHtml(name)}`).join('<br/>');
      const plural = count === 1 ? 'guest' : 'guests';
      circle.bindPopup(`
        <div style="min-width: 150px;">
          <strong style="font-size: 1.1em; color: #1f2937;">✈️ ${escapeHtml(city.city)}</strong>
          <div style="color: #6b7280; font-size: 0.9em; margin: 4px 0 8px 0;">${count} ${plural} want to visit</div>
          <div style="font-size: 0.85em; line-height: 1.5; color: #4b5563;">${guestList}</div>
        </div>
      `);
      
      bounds.push([city.lat, city.lng]);
    });

    console.log('[initTravelDestMap] Total circles added:', cityData.length);

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  // Render aggregate view (statistics across all guests)
  function renderAggregateView(profiles) {
    import('../../../js/questions-config.js').then(async module => {
      const { QUESTION_BATCHES } = module;
      
      const html = QUESTION_BATCHES.map(batch => {
        const batchHtml = batch.questions.map(q => {
          const answers = profiles
            .map(p => (p.extended_answers || {})[q.id])
            .filter(a => a !== undefined && a !== null && a !== '');

          console.log(`[renderAggregateView] Question: ${q.id}, kind: ${q.kind}, answers:`, answers);

          if (answers.length === 0) {
            return `
              <div class="aggregate-question-block">
                <div class="aggregate-question-title">${escapeHtml(q.prompt)}</div>
                <p class="small muted" style="color: #9ca3af; font-size: 0.9375rem;">No responses yet</p>
              </div>
            `;
          }

          let resultsHtml = '';
          
          // Special handling for birth_city - show map
          if (q.id === 'birth_city') {
            console.log('[renderAggregateView] Processing birth_city question');
            console.log('[renderAggregateView] Answers:', answers);
            console.log('[renderAggregateView] Profiles:', profiles);
            
            const cities = answers.filter(a => a);
            console.log('[renderAggregateView] Filtered cities:', cities);
            
            if (cities.length > 0) {
              console.log('[renderAggregateView] Creating map container and scheduling init');
              resultsHtml = `
                <div class="report-map-container" id="birthCityMap"></div>
                <p style="color: #6b7280; font-size: 0.875rem; margin-top: 12px; text-align: center;">
                  ${cities.length} ${cities.length === 1 ? 'city' : 'cities'} marked
                </p>
              `;
              
              // Initialize map after DOM is ready
              setTimeout(() => {
                console.log('[renderAggregateView] setTimeout executing, calling initBirthCityMap');
                initBirthCityMap(profiles);
              }, 100);
            } else {
              console.log('[renderAggregateView] No cities found, showing no data message');
              resultsHtml = '<div class="report-no-map-data"><i class="fas fa-map-marked-alt" style="margin-right: 8px;"></i> No birth cities with coordinates available</div>';
            }
          } 
          // Special handling for fav_city_travel - show travel destination map
          else if (q.id === 'fav_city_travel') {
            console.log('[renderAggregateView] Processing fav_city_travel question');
            console.log('[renderAggregateView] Travel answers:', answers);
            
            const cities = answers.filter(a => a);
            console.log('[renderAggregateView] Filtered travel cities:', cities);
            
            if (cities.length > 0) {
              console.log('[renderAggregateView] Creating travel map container and scheduling init');
              resultsHtml = `
                <div class="report-map-container" id="travelDestMap"></div>
                <p style="color: #6b7280; font-size: 0.875rem; margin-top: 12px; text-align: center;">
                  ${cities.length} ${cities.length === 1 ? 'destination' : 'destinations'} marked
                </p>
              `;
              
              // Initialize map after DOM is ready
              setTimeout(() => {
                console.log('[renderAggregateView] setTimeout executing, calling initTravelDestMap');
                initTravelDestMap(profiles);
              }, 100);
            } else {
              console.log('[renderAggregateView] No travel destinations found, showing no data message');
              resultsHtml = '<div class="report-no-map-data"><i class="fas fa-plane-departure" style="margin-right: 8px;"></i> No travel destinations with coordinates available</div>';
            }
          }
          else if (q.kind === 'either_or') {
            const counts = {};
            answers.forEach(a => {
              // Get the selected ID (A or B)
              const selectedId = (typeof a === 'object') ? a.selected : a;
              
              // Resolve ID to label text
              let displayLabel = selectedId;
              if (selectedId && q.options) {
                const option = q.options.find(opt => opt.id === selectedId);
                displayLabel = option ? option.label : selectedId;
              }
              
              counts[displayLabel] = (counts[displayLabel] || 0) + 1;
            });

            const total = answers.length;
            resultsHtml = Object.entries(counts)
              .sort(([, a], [, b]) => b - a)
              .map(([optionLabel, count]) => {
                const percentage = Math.round((count / total) * 100);
                return `
                  <li class="aggregate-result-item">
                    <span class="aggregate-result-label">${escapeHtml(optionLabel)}</span>
                    <div class="aggregate-result-bar">
                      <div class="aggregate-result-fill" style="width: ${percentage}%">${percentage}%</div>
                    </div>
                    <span class="aggregate-result-count">${count} guests</span>
                  </li>
                `;
              }).join('');

          } 
          else if (q.kind === 'dropdown') {
            console.log('[renderAggregateView] Processing dropdown question:', q.id);
            
            // Special handling for dropdown questions like zodiac sign
            const counts = {};
            answers.forEach(a => {
              const key = typeof a === 'string' ? a.toLowerCase() : a;
              counts[key] = (counts[key] || 0) + 1;
            });

            console.log('[renderAggregateView] Dropdown counts:', counts);
            const total = answers.length;
            
            // For zodiac_sign, show a visual histogram
            if (q.id === 'zodiac_sign') {
              console.log('[renderAggregateView] Rendering zodiac histogram');
              
              // Define zodiac order and emojis
              const zodiacOrder = [
                { id: 'aries', label: 'Aries', emoji: '♈' },
                { id: 'taurus', label: 'Taurus', emoji: '♉' },
                { id: 'gemini', label: 'Gemini', emoji: '♊' },
                { id: 'cancer', label: 'Cancer', emoji: '♋' },
                { id: 'leo', label: 'Leo', emoji: '♌' },
                { id: 'virgo', label: 'Virgo', emoji: '♍' },
                { id: 'libra', label: 'Libra', emoji: '♎' },
                { id: 'scorpio', label: 'Scorpio', emoji: '♏' },
                { id: 'sagittarius', label: 'Sagittarius', emoji: '♐' },
                { id: 'capricorn', label: 'Capricorn', emoji: '♑' },
                { id: 'aquarius', label: 'Aquarius', emoji: '♒' },
                { id: 'pisces', label: 'Pisces', emoji: '♓' },
                { id: 'idk', label: "I don't know", emoji: '❓' }
              ];

              resultsHtml = zodiacOrder
                .map(zodiac => {
                  // Check both lowercase id and capitalized label
                  const count = counts[zodiac.id] || counts[zodiac.label] || 0;
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  
                  // Only show signs that have at least one response
                  if (count === 0) return '';
                  
                  console.log(`[renderAggregateView] Zodiac ${zodiac.label}: count=${count}, percentage=${percentage}%`);
                  
                  return `
                    <li class="aggregate-result-item">
                      <span class="aggregate-result-label">
                        <span style="font-size: 1.2em; margin-right: 6px;">${zodiac.emoji}</span>
                        ${escapeHtml(zodiac.label)}
                      </span>
                      <div class="aggregate-result-bar">
                        <div class="aggregate-result-fill" style="width: ${percentage}%; background: linear-gradient(90deg, #8b5cf6, #6366f1);">
                          ${percentage}%
                        </div>
                      </div>
                      <span class="aggregate-result-count">${count} ${count === 1 ? 'guest' : 'guests'}</span>
                    </li>
                  `;
                })
                .filter(Boolean)
                .join('');
                
              console.log('[renderAggregateView] Zodiac resultsHtml length:', resultsHtml.length);
            } else {
              // Default dropdown rendering (alphabetical by label)
              resultsHtml = Object.entries(counts)
                .sort(([, a], [, b]) => b - a)
                .map(([option, count]) => {
                  const percentage = Math.round((count / total) * 100);
                  return `
                    <li class="aggregate-result-item">
                      <span class="aggregate-result-label">${escapeHtml(option)}</span>
                      <div class="aggregate-result-bar">
                        <div class="aggregate-result-fill" style="width: ${percentage}%">${percentage}%</div>
                      </div>
                      <span class="aggregate-result-count">${count} ${count === 1 ? 'guest' : 'guests'}</span>
                    </li>
                  `;
                }).join('');
            }
          }
          else if (q.kind === 'single_choice') {
            const counts = {};
            answers.forEach(a => {
              counts[a] = (counts[a] || 0) + 1;
            });

            const total = answers.length;
            resultsHtml = Object.entries(counts)
              .sort(([, a], [, b]) => b - a)
              .map(([option, count]) => {
                const percentage = Math.round((count / total) * 100);
                return `
                  <li class="aggregate-result-item">
                    <span class="aggregate-result-label">${escapeHtml(option)}</span>
                    <div class="aggregate-result-bar">
                      <div class="aggregate-result-fill" style="width: ${percentage}%">${percentage}%</div>
                    </div>
                    <span class="aggregate-result-count">${count} guests</span>
                  </li>
                `;
              }).join('');

          } else if (q.kind === 'short_text') {
            // Show list of text responses
            resultsHtml = `
              <div style="max-height: 300px; overflow-y: auto; padding: 12px; background: #f9fafb; border-radius: 8px;">
                ${answers.map(a => `
                  <div style="padding: 8px 12px; margin-bottom: 8px; background: white; border-radius: 6px; border-left: 3px solid #3b82f6; color: #374151; font-size: 0.9375rem;">
                    "${escapeHtml(a)}"
                  </div>
                `).join('')}
              </div>
              <p style="color: #6b7280; font-size: 0.875rem; margin-top: 12px; text-align: center;">
                ${answers.length} ${answers.length === 1 ? 'response' : 'responses'}
              </p>
            `;
          }

          return `
            <div class="aggregate-question-block">
              <div class="aggregate-question-title">${escapeHtml(q.prompt)}</div>
              <ul class="aggregate-results-list">${resultsHtml}</ul>
            </div>
          `;
        }).join('');

        return `
          <div class="aggregate-batch-section">
            <h3>${batch.emoji || ''} ${batch.title}</h3>
            ${batchHtml}
          </div>
        `;
      }).join('');

      reportContent.innerHTML = html || '<p class="small muted">No data to display.</p>';
    });
  }

  // Show modal with detailed answers
  function showAnswerDetailsModal(profile) {
    console.log('[Report] Profile data:', profile);
    console.log('[Report] Extended answers:', profile.extended_answers);
    
    import('../../../js/questions-config.js').then(module => {
      const { QUESTION_BATCHES } = module;
      const allQuestions = {};
      QUESTION_BATCHES.forEach(batch => {
        batch.questions.forEach(q => {
          allQuestions[q.id] = q;
        });
      });

      const answers = profile.extended_answers || {};
      console.log('[Report] Processing answers:', answers);
      console.log('[Report] All questions:', allQuestions);
      
      const answerHtml = Object.entries(answers).map(([qId, answer]) => {
        const question = allQuestions[qId];
        if (!question) {
          console.warn('[Report] Question not found for ID:', qId);
          return '';
        }

        console.log('[Report] Question:', question.prompt, 'Answer:', answer, 'Kind:', question.kind);

        let displayAnswer = '';
        if (question.kind === 'either_or') {
          // Check if answer is an object with 'selected' property or just a string
          let selectedId = null;
          let modifiers = [];
          
          if (typeof answer === 'object' && answer.selected) {
            selectedId = answer.selected;
            modifiers = answer.modifiers || [];
          } else if (typeof answer === 'string') {
            selectedId = answer;
          }
          
          // Resolve the ID (A/B) to the actual label text
          if (selectedId && question.options) {
            const option = question.options.find(opt => opt.id === selectedId);
            displayAnswer = option ? option.label : selectedId;
          } else {
            displayAnswer = 'No answer';
          }
          
          // Add modifiers like "Both" or "Neither"
          if (modifiers.length > 0) {
            displayAnswer += ` <span class="detailed-answer-tag">${modifiers.join(', ')}</span>`;
          }
        } else {
          displayAnswer = answer || 'No answer';
        }
        
        console.log('[Report] Display answer:', displayAnswer);

        return `
          <div style="margin-bottom: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <div style="font-weight: 600; font-size: 0.9375rem; color: #6b7280; margin-bottom: 8px; line-height: 1.4;">
              ${escapeHtml(question.prompt)}
            </div>
            <div style="font-size: 1.0625rem; color: #111827; font-weight: 500;">${displayAnswer}</div>
          </div>
        `;
      }).join('');

      const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);" id="answerModal">
          <div style="background: #ffffff; border-radius: 16px; padding: 32px; max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <button style="position: absolute; top: 20px; right: 20px; background: #f3f4f6; border: none; width: 32px; height: 32px; border-radius: 8px; font-size: 1.25rem; cursor: pointer; color: #6b7280; transition: all 0.2s; display: flex; align-items: center; justify-content: center;" id="closeModal" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">&times;</button>
            <h2 style="margin-bottom: 28px; font-size: 1.5rem; font-weight: 700; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px;">${escapeHtml(profile.display_name || 'Anonymous')}'s Answers</h2>
            ${answerHtml || '<p style="color: #9ca3af; font-size: 0.9375rem; text-align: center; padding: 40px 0;">No answers submitted yet.</p>'}
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      qs('#closeModal').addEventListener('click', () => {
        qs('#answerModal')?.remove();
      });
      qs('#answerModal').addEventListener('click', (e) => {
        if (e.target.id === 'answerModal') {
          qs('#answerModal')?.remove();
        }
      });
    });
  }

  // Export to CSV
  async function exportToCSV() {
    const partyId = reportPartySelect.value;
    if (!partyId) {
      toast('Please select a party first', 'error');
      return;
    }

    const { data: profiles } = await supabase
      .from('party_profiles')
      .select('display_name, batch_progress, extended_answers')
      .eq('party_id', partyId)
      .order('display_name');

    if (!profiles || profiles.length === 0) {
      toast('No data to export', 'error');
      return;
    }

    // Import questions to get prompts
    import('../../../js/questions-config.js').then(module => {
      const { QUESTION_BATCHES } = module;
      const allQuestions = {};
      QUESTION_BATCHES.forEach(batch => {
        batch.questions.forEach(q => {
          allQuestions[q.id] = q;
        });
      });

      // Build CSV header
      const questionIds = Object.keys(allQuestions).sort();
      const headers = ['Guest Name', 'Batch 1 Status', 'Batch 2 Status', 'Batch 3 Status', ...questionIds.map(qId => allQuestions[qId].prompt)];
      
      // Build CSV rows
      const rows = profiles.map(p => {
        const bp = p.batch_progress || {};
        const answers = p.extended_answers || {};
        
        const row = [
          p.display_name || 'Anonymous',
          bp.batch_1 || 'not_started',
          bp.batch_2 || 'not_started',
          bp.batch_3 || 'not_started'
        ];

        questionIds.forEach(qId => {
          const answer = answers[qId];
          const question = allQuestions[qId];
          let cell = '';
          
          if (question.kind === 'either_or' && answer) {
            // Get the selected ID
            const selectedId = (typeof answer === 'object') ? answer.selected : answer;
            
            // Resolve ID to label text
            if (selectedId && question.options) {
              const option = question.options.find(opt => opt.id === selectedId);
              cell = option ? option.label : selectedId;
            } else {
              cell = selectedId || '';
            }
            
            // Add modifiers if present
            if (typeof answer === 'object' && answer.modifiers && answer.modifiers.length > 0) {
              cell += ` (${answer.modifiers.join(', ')})`;
            }
          } else {
            cell = answer || '';
          }
          
          row.push(cell);
        });

        return row;
      });

      // Convert to CSV string
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `about-you-report-${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      
      toast('Report exported successfully', 'success');
    });
  }

  // Event listeners
  reportPartySelect.addEventListener('change', loadReport);
  viewModeSelect?.addEventListener('change', loadReport);
  filterSelect?.addEventListener('change', loadReport);
  refreshBtn?.addEventListener('click', loadReport);
  exportBtn?.addEventListener('click', exportToCSV);
}

/* ---------- Questions Preview Modal ---------- */
function showQuestionsPreviewModal(questionBatches) {
  // Create modal HTML
  const batchesHtml = questionBatches.map((batch, batchIndex) => {
    const questionsHtml = batch.questions.map((q, qIndex) => {
      let questionType = '';
      if (q.kind === 'short_text') questionType = 'Text input';
      else if (q.kind === 'either_or') questionType = 'Either/Or choice';
      else if (q.kind === 'single_choice') questionType = 'Multiple choice';
      else if (q.kind === 'dropdown') questionType = 'Dropdown';
      else questionType = q.kind;

      let optionsHtml = '';
      if (q.options) {
        optionsHtml = `<ul style="margin:4px 0 0 20px; font-size:13px; color:#6b7280;">
          ${q.options.map(opt => `<li>${escapeHtml(opt.label || opt.id)}</li>`).join('')}
        </ul>`;
      }

      return `
        <div style="padding:12px; border-left:3px solid #e5e7eb; margin-bottom:12px; background:#f9fafb;">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <div style="flex:1;">
              <strong>${qIndex + 1}. ${escapeHtml(q.prompt)}</strong>
              ${q.required ? '<span style="color:#ef4444; margin-left:4px;">*</span>' : ''}
              <div style="font-size:13px; color:#6b7280; margin-top:4px;">
                Type: ${questionType}
              </div>
              ${optionsHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="margin-bottom:24px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span style="font-size:24px;">${batch.emoji}</span>
          <div>
            <h4 style="margin:0; font-size:16px;">${escapeHtml(batch.title)}</h4>
            <div style="font-size:13px; color:#6b7280;">${escapeHtml(batch.description)} • ${batch.questions.length} questions</div>
          </div>
        </div>
        ${questionsHtml}
      </div>
    `;
  }).join('');

  const modalHtml = `
    <div class="modal-overlay" id="questionsPreviewModal" style="z-index:9999;">
      <div class="modal" style="max-width:700px; max-height:80vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; position:sticky; top:0; background:white; padding-bottom:12px; border-bottom:1px solid #e5e7eb;">
          <h3 style="margin:0;">About You Questions Preview</h3>
          <button class="modal-close" id="closeQuestionsPreview" style="background:none; border:none; font-size:24px; cursor:pointer; color:#6b7280;">×</button>
        </div>
        <div style="color:#6b7280; margin-bottom:20px; font-size:14px;">
          This is what your guests will see when they answer About You questions. Questions marked with * are required.
        </div>
        ${batchesHtml}
        <div style="margin-top:20px; padding-top:20px; border-top:1px solid #e5e7eb;">
          <button class="primary" id="closeQuestionsPreviewBtn">Close Preview</button>
        </div>
      </div>
    </div>
  `;

  // Insert modal into DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Add event listeners
  const modal = document.getElementById('questionsPreviewModal');
  const closeBtn = document.getElementById('closeQuestionsPreview');
  const closeBtn2 = document.getElementById('closeQuestionsPreviewBtn');

  function closeModal() {
    modal.remove();
  }

  closeBtn?.addEventListener('click', closeModal);
  closeBtn2?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

/* ---------- Songs View Modal ---------- */
async function showSongsModal(gameId) {
  // Fetch submissions for this game
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('id, display_name, content, created_at')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[showSongsModal] Error fetching songs:', error);
    alert('Failed to load songs');
    return;
  }

  // Fetch votes for this game
  const { data: votes } = await supabase
    .from('votes')
    .select('submission_id')
    .eq('game_id', gameId);

  const voteCounts = {};
  (votes || []).forEach(v => {
    voteCounts[v.submission_id] = (voteCounts[v.submission_id] || 0) + 1;
  });

  const songsHtml = submissions.length > 0 ? submissions.map((sub, index) => {
    const content = sub.content || {};
    const title = content.title || 'Untitled';
    const artist = content.artist || 'Unknown Artist';
    const voteCount = voteCounts[sub.id] || 0;
    const submittedBy = content.submitted_by_name || sub.display_name || 'Anonymous';
    const date = new Date(sub.created_at).toLocaleDateString();

    return `
      <div style="padding:16px; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:start;">
          <div style="flex:1;">
            <div style="font-size:16px; font-weight:600; margin-bottom:4px;">
              ${index + 1}. ${escapeHtml(title)}
            </div>
            <div style="font-size:14px; color:#6b7280; margin-bottom:8px;">
              by ${escapeHtml(artist)}
            </div>
            <div style="font-size:13px; color:#9ca3af;">
              Submitted by <strong>${escapeHtml(submittedBy)}</strong> on ${date}
            </div>
          </div>
          <div style="text-align:center; min-width:60px;">
            <div style="font-size:24px;">${voteCount > 0 ? '❤️' : '🤍'}</div>
            <div style="font-size:13px; color:#6b7280;">${voteCount} ${voteCount === 1 ? 'vote' : 'votes'}</div>
          </div>
        </div>
      </div>
    `;
  }).join('') : '<p style="text-align:center; color:#9ca3af; padding:40px;">No songs submitted yet.</p>';

  const modalHtml = `
    <div class="modal-overlay" id="songsViewModal" style="z-index:9999;">
      <div class="modal" style="max-width:700px; max-height:80vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; position:sticky; top:0; background:white; padding-bottom:12px; border-bottom:1px solid #e5e7eb;">
          <h3 style="margin:0;">Submitted Songs (${submissions.length})</h3>
          <button class="modal-close" id="closeSongsView" style="background:none; border:none; font-size:24px; cursor:pointer; color:#6b7280;">×</button>
        </div>
        <div style="color:#6b7280; margin-bottom:20px; font-size:14px;">
          All songs submitted by your guests, sorted by most recent first.
        </div>
        ${songsHtml}
        <div style="margin-top:20px; padding-top:20px; border-top:1px solid #e5e7eb;">
          <button class="primary" id="closeSongsViewBtn">Close</button>
        </div>
      </div>
    </div>
  `;

  // Insert modal into DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Add event listeners
  const modal = document.getElementById('songsViewModal');
  const closeBtn = document.getElementById('closeSongsView');
  const closeBtn2 = document.getElementById('closeSongsViewBtn');

  function closeModal() {
    modal.remove();
  }

  closeBtn?.addEventListener('click', closeModal);
  closeBtn2?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

/* ---------- Photos Gallery Modal ---------- */
/* ADD THIS TO THE END OF src/features/host/dashboard.js */

async function showPhotosModal(gameId) {
  // Fetch photo submissions for this game
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('id, display_name, content, created_at')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[showPhotosModal] Error fetching photos:', error);
    alert('Failed to load photos');
    return;
  }

  const photosHtml = submissions.length > 0 ? submissions.map((sub) => {
    const content = sub.content || {};
    const photoUrl = content.photo_url;
    const photoInfo = content.photo_info || '';
    const submittedBy = content.submitted_by_name || sub.display_name || 'Anonymous';
    const submittedEmail = content.submitted_by_email || '';
    const submittedWhatsapp = content.submitted_by_whatsapp || '';
    const date = new Date(sub.created_at).toLocaleDateString();

    if (!photoUrl) return ''; // Skip if no photo

    return `
      <div style="border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; background:white;">
        <div style="aspect-ratio:1; overflow:hidden; background:#f3f4f6; display:flex; align-items:center; justify-content:center;">
          <img src="${escapeHtml(photoUrl)}" 
               alt="Baby photo from ${escapeHtml(submittedBy)}" 
               style="width:100%; height:100%; object-fit:cover;" />
        </div>
        <div style="padding:12px;">
          <div style="font-weight:600; margin-bottom:2px;">
            ${escapeHtml(submittedBy)}<br>
            <span style="font-size:13px; color:#6b7280;">${escapeHtml(submittedEmail) || '<span style="color:#aaa;">N/A</span>'}</span>
          </div>
          ${photoInfo ? `<div style="font-size:13px; color:#6b7280; margin-bottom:4px;">${escapeHtml(photoInfo)}</div>` : ''}
          <div style="font-size:12px; color:#9ca3af;">${date}</div>
          <div style="margin-top:8px; font-size:13px; color:#444;">
            <strong>WhatsApp:</strong> ${escapeHtml(submittedWhatsapp) || '<span style="color:#aaa;">N/A</span>'}
          </div>
        </div>
      </div>
    `;
  }).filter(Boolean).join('') : '<p style="text-align:center; color:#9ca3af; padding:40px; grid-column:1/-1;">No photos submitted yet.</p>';

  const modalHtml = `
    <div class="modal-overlay" id="photosViewModal" style="z-index:9999;">
      <div class="modal" style="max-width:900px; max-height:85vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; position:sticky; top:0; background:white; padding-bottom:12px; border-bottom:1px solid #e5e7eb; z-index:10;">
          <h3 style="margin:0;">Baby Photo Gallery (${submissions.filter(s => s.content?.photo_url).length})</h3>
          <button class="modal-close" id="closePhotosView" style="background:none; border:none; font-size:24px; cursor:pointer; color:#6b7280;">×</button>
        </div>
        <div style="color:#6b7280; margin-bottom:20px; font-size:14px;">
          All baby photos submitted by your guests. Can you guess who's who?
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:16px;">
          ${photosHtml}
        </div>
        <div style="margin-top:20px; padding-top:20px; border-top:1px solid #e5e7eb;">
          <button class="primary" id="closePhotosViewBtn">Close</button>
        </div>
      </div>
    </div>
  `;

  // Insert modal into DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Add event listeners
  const modal = document.getElementById('photosViewModal');
  const closeBtn = document.getElementById('closePhotosView');
  const closeBtn2 = document.getElementById('closePhotosViewBtn');

  function closeModal() {
    modal.remove();
  }

  closeBtn?.addEventListener('click', closeModal);
  closeBtn2?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}
