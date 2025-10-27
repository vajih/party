import { supabase } from './services/supabaseClient.js';
import { initHostDashboard } from './features/host/dashboard.js';
import { toast } from './ui/toast.js';

/* -------- DOM helpers -------- */
const qs  = (s, r=document) => r.querySelector(s);

/* -------- Fragments -------- */
async function loadFragment(selector, url) {
  const el = qs(selector);
  if (!el) {
    console.error('[fragment] Target element not found', { selector });
    return false;
  }
  try {
    console.log('[fragment] Loading', { selector, url });
    const res = await fetch(url, { 
      cache: 'no-cache',
      headers: { 'Accept': 'text/html' }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    if (!html.trim()) {
      throw new Error('Empty response');
    }
    el.innerHTML = html;
    console.log('[fragment] Loaded successfully', { selector, url });
    return true;
  } catch (err) {
    console.error('[fragment] Failed to load', { selector, url, error: err.message });
    el.innerHTML = `
      <section class="card">
        <h3>Could not load content</h3>
        <p class="small">Failed to load <code>${url}</code></p>
        <p class="small">Error: ${err.message}</p>
      </section>`;
    return false;
  }
}

/* -------- Boot / Router -------- */
window.addEventListener('popstate', () => route());
document.addEventListener('DOMContentLoaded', boot);

async function boot() {
  await loadFragment('#site-header', './partials/header.html');
  await loadFragment('#site-footer', './partials/footer.html');

  await consumeAuthRedirect();   // handle magic-link hash
  wireHeaderAuth();              // header sign-in form

  // re-route on any auth state change
  supabase.auth.onAuthStateChange((_event, session) => {
    route(session?.user ?? null);
  });

  const { data } = await supabase.auth.getSession();
  await route(data?.session?.user ?? null);
}

async function route(userFromEvent) {
  const user = userFromEvent ?? (await supabase.auth.getSession()).data?.session?.user ?? null;

  const params = new URLSearchParams(location.search);
  const slug = params.get('party');

  // Hide header auth strip on party pages
  const strip = document.querySelector('[data-hide-on-party]');
  if (slug) strip?.setAttribute('hidden',''); else strip?.removeAttribute('hidden');

  await updateHeaderAuthState(user);

  if (!slug) {
    if (user) {
      const ok = await loadFragment('#main', './partials/host-dashboard.html');
      if (!ok) qs('#main').innerHTML = rootFallback(false);
      else await initHostDashboard(user);           // <— IMPORTANT
    } else {
      console.log('[route] Loading guest home view');
      const ok = await loadFragment('#main', './partials/guest-home.html');
      if (!ok) {
        console.error('[route] Failed to load guest home view');
        const main = qs('#main');
        if (main) main.innerHTML = rootFallback(true);
      } else {
        console.log('[route] Guest home loaded, initializing...');
        try {
          const mod = await import('./features/guest/home.js');
          if (mod && typeof mod.initGuestHome === 'function') {
            await mod.initGuestHome(user);
            console.log('[route] Guest home initialized');
          } else {
            console.warn('[route] Guest home module or init function not found');
          }
        } catch (e) {
          console.error('[route] Error initializing guest home:', e);
        }
      }
    }
    return;
  }

  // PARTY PAGE (minimal for now)
  const party = await fetchPartyBySlug(slug);
  if (!party) {
    qs('#main').innerHTML = `<section class="card"><h2>Party not found</h2>
    <p class="small">Slug: <code>${escapeHtml(slug)}</code></p></section>`;
    return;
  }

  if (!user) return renderPartyWelcome(party);

  // Fetch games for this party and render a simple tabs-like UI (buttons + content)
  const { data: games, error: gErr } = await supabase
    .from('games')
    .select('*')
    .eq('party_id', party.id)
    .order('created_at', { ascending: true });

  if (gErr) {
    qs('#main').innerHTML = `<section class="card"><h2>${escapeHtml(party.title)}</h2><p class="small">Error loading games: ${escapeHtml(gErr.message)}</p></section>`;
    return;
  }

  const titleHtml = `<h2>${escapeHtml(party.title)}</h2><p class="muted">${fmtDate(party.date)} • ${escapeHtml(party.venue || '')}</p>`;
  if (!games || games.length === 0) {
    qs('#main').innerHTML = `<section class="card">${titleHtml}<div class="card" style="margin-top:12px;"><p class="small">No games configured for this party yet.</p></div></section>`;
    return;
  }

  // Check completion status for progress tracker
  const progressSteps = await getGuestProgressSteps(games, party.id, user.id);

  // Build progress tracker
  const progressHtml = buildProgressTracker(progressSteps);

  // Build basic tabs UI
  const tabsHtml = games.map(g => `<button class="game-tab" data-game-id="${g.id}" data-game-type="${escapeHtml(g.type)}">${escapeHtml(g.title || g.type)}</button>`).join('');
  qs('#main').innerHTML = `
    <section class="card">
      ${titleHtml}
      ${progressHtml}
      <div style="margin-top:12px;">
        <nav class="game-tabs" style="display:flex;gap:8px;flex-wrap:wrap;">${tabsHtml}</nav>
        <div id="game-content" style="margin-top:12px;"></div>
      </div>
    </section>`;

  // Wire up progress tracker clicks
  document.querySelectorAll('.progress-step').forEach(step => {
    step.addEventListener('click', () => {
      if (step.classList.contains('locked')) return;
      const gameId = step.dataset.gameId;
      const tab = document.querySelector(`.game-tab[data-game-id="${gameId}"]`);
      if (tab) tab.click();
    });
  });

  // Helper to map game.type to partial path
  const partialForType = (type) => {
    switch (type) {
      case 'about_you': return './partials/games/about_you.html';
      case 'favorite_song': return './partials/games/favorite_song.html';
      case 'baby_photo': return './partials/games/baby-photos.html';
      case 'song_vote': return './partials/games/song-vote.html';
      case 'bingo': return './partials/games/bingo.html';
      default: return null;
    }
  };

  // Click handler to load partial into #game-content
  qs('#main').addEventListener('click', async (e) => {
    const btn = e.target.closest('.game-tab');
    if (!btn) return;
    const gameId = btn.dataset.gameId;
    const type = btn.dataset.gameType;
    const p = partialForType(type);
    if (!p) {
      const content = document.getElementById('game-content');
      if (content) content.innerHTML = `<div class="card"><p class="small">No partial available for game type: ${escapeHtml(type)}</p></div>`;
      return;
    }
    await loadFragment('#game-content', p);
    
    // For about_you games, dynamically inject question fields from config
    if (type === 'about_you') {
      const game = games.find(g => g.id === gameId);
      if (game) {
        const form = qs('#game-content .game-form');
        if (form) {
          // Parse config
          let config = game.config;
          if (typeof config === 'string') {
            try { config = JSON.parse(config); } catch (e) { config = {}; }
          }
          config = config || {};
          
          const questions = config.questions || [
            { label: 'What is a fun fact about you?' },
            { label: 'What is your favorite memory?' },
            { label: 'What are you looking forward to?' }
          ];
          
          console.debug('[about_you guest] Rendering questions:', questions);
          
          // Find the display_name field
          const displayNameField = form.querySelector('[name="display_name"]');
          let insertAfter = displayNameField ? displayNameField.parentElement : null;
          
          // Add question fields after display_name
          questions.forEach((q, i) => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'field';
            const label = document.createElement('label');
            label.textContent = q.label || `Question ${i + 1}`;
            label.htmlFor = `q_${i}`;
            
            // Check if this is a dropdown question (has options array)
            if (q.options && Array.isArray(q.options) && q.options.length > 0) {
              // Create dropdown
              const select = document.createElement('select');
              select.name = `q_${i}`;
              select.id = `q_${i}`;
              
              // Add placeholder option
              const placeholderOption = document.createElement('option');
              placeholderOption.value = '';
              placeholderOption.textContent = q.placeholder || 'Select an option...';
              select.appendChild(placeholderOption);
              
              // Add options
              q.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                select.appendChild(option);
              });
              
              fieldDiv.appendChild(label);
              fieldDiv.appendChild(select);
            } else {
              // Create text input (default)
              const input = document.createElement('input');
              input.type = 'text';
              input.name = `q_${i}`;
              input.id = `q_${i}`;
              input.placeholder = q.placeholder || '';
              fieldDiv.appendChild(label);
              fieldDiv.appendChild(input);
            }
            
            if (insertAfter) {
              // Insert after the previous field
              insertAfter.insertAdjacentElement('afterend', fieldDiv);
              insertAfter = fieldDiv; // Update to insert the next field after this one
            } else {
              // Prepend to form if no display_name found
              form.prepend(fieldDiv);
            }
          });
        }
        
        // Add form submission handler
        if (form && !form.dataset.boundSubmit) {
          form.dataset.boundSubmit = '1';
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check if user is signed in
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session?.user) {
              alert('Please sign in to submit.');
              return;
            }
            
            const formData = new FormData(form);
            const displayName = formData.get('display_name');
            
            if (!displayName) {
              alert('Please enter a display name.');
              return;
            }
            
            // Collect answers
            const answers = {};
            for (let i = 0; i < questions.length; i++) {
              const key = `q_${i}`;
              const value = (formData.get(key) || '').toString().trim();
              answers[key] = value;
            }
            
            // Require at least one answer
            const hasAnyAnswer = Object.values(answers).some(v => v && v.length);
            if (!hasAnyAnswer) {
              alert('Please answer at least one question.');
              return;
            }
            
            // Submit to database
            const { error } = await supabase.from('submissions').insert({
              game_id: game.id,
              party_id: game.party_id,
              user_id: sessionData.session.user.id,
              content: { answers },
              display_name: displayName,
              moderation_status: 'pending'
            });
            
            if (error) {
              console.error('[about_you] Submission error:', error);
              alert(`Error: ${error.message}`);
            } else {
              alert('Thank you! Your submission has been sent for review.');
              form.reset();
            }
          });
        }
      }
    }
    
    // For favorite_song games, add form submission handler
    if (type === 'favorite_song') {
      const game = games.find(g => g.id === gameId);
      if (game) {
        const form = qs('#game-content .game-form');
        const listWrap = qs('#favoriteSongsList');
        const listEl = qs('#favoriteSongsItems');
        const emptyEl = qs('#favoriteSongsEmpty');

        // Helper to check if current user is host or cohost
        async function isHost(partyId, userId) {
          if (!userId) return false;
          const { data: party } = await supabase.from('parties').select('host_id').eq('id', partyId).single();
          if (party?.host_id === userId) return true;
          const { data: cohosts } = await supabase.from('party_hosts').select('id').eq('party_id', partyId).eq('user_id', userId).limit(1);
          return !!(cohosts && cohosts.length > 0);
        }

        async function renderFavoriteSongs() {
          if (!listEl) return;
          // get session for 'yours' badge and host check
          const { data: sessionData } = await supabase.auth.getSession();
          const myId = sessionData?.session?.user?.id || null;
          const hostMode = myId ? await isHost(game.party_id, myId) : false;

          // Fetch submissions
          const { data, error } = await supabase
            .from('submissions')
            .select('id, user_id, content, moderation_status, created_at')
            .eq('game_id', game.id)
            .eq('party_id', game.party_id)
            .order('created_at', { ascending: true });
          if (error) {
            listEl.innerHTML = `<li class="small">${escapeHtml(error.message)}</li>`;
            if (emptyEl) emptyEl.hidden = true;
            return;
          }
          const rows = data || [];
          if (rows.length === 0) {
            listEl.innerHTML = '';
            if (emptyEl) emptyEl.hidden = false;
            return;
          }

          // Fetch votes for this game
          const { data: votesData } = await supabase
            .from('votes')
            .select('id, user_id, submission_id')
            .eq('game_id', game.id)
            .eq('party_id', game.party_id);
          const allVotes = votesData || [];
          const myVotes = new Set(allVotes.filter(v => v.user_id === myId).map(v => v.submission_id));
          const myVoteCount = myVotes.size;
          const voteCounts = {};
          allVotes.forEach(v => {
            voteCounts[v.submission_id] = (voteCounts[v.submission_id] || 0) + 1;
          });

          if (emptyEl) emptyEl.hidden = true;
          listEl.innerHTML = rows.map(r => {
            const c = r.content || {};
            const title = escapeHtml(c.title || '');
            const artist = escapeHtml(c.artist || '');
            const link = c.link ? `<a href="${escapeHtml(c.link)}" target="_blank" rel="noopener" class="small">link</a>` : '';
            const mine = myId && r.user_id === myId;
            const status = (hostMode && r.moderation_status && r.moderation_status !== 'approved') ? `<span class=\"badge muted\" style=\"margin-left:6px;\">${escapeHtml(r.moderation_status)}</span>` : '';
            const mineBadge = mine ? `<span class=\"badge\" style=\"margin-left:6px;\">Yours</span>` : '';
            
            // Vote UI
            const voteCount = voteCounts[r.id] || 0;
            const hasVoted = myVotes.has(r.id);
            let voteUI = '';
            if (hostMode) {
              // Host sees vote count
              voteUI = voteCount > 0 ? `<span class="badge" style="margin-left:6px;">${voteCount} vote${voteCount !== 1 ? 's' : ''}</span>` : '';
            } else if (myId) {
              // Guest sees vote button
              const canVote = !hasVoted && myVoteCount < 5;
              const btnClass = hasVoted ? 'link' : (canVote ? 'link primary' : 'link muted');
              const btnText = hasVoted ? '✓ Voted' : (canVote ? 'Vote' : 'Vote (5 max)');
              const btnDisabled = !canVote && !hasVoted ? 'disabled' : '';
              voteUI = `<button class="vote-btn ${btnClass}" data-submission-id="${r.id}" data-voted="${hasVoted}" ${btnDisabled} style="margin-left:6px;font-size:12px;padding:2px 8px;">${btnText}</button>`;
            }
            
            const meta = [status, link].filter(Boolean).join(' ');
            return `<li class="item" data-id="${r.id}"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><div><strong>${title}</strong>${artist ? ` — ${artist}` : ''}</div><div style="display:flex;align-items:center;gap:4px;">${mineBadge}${voteUI}${meta ? ' ' + meta : ''}</div></div></li>`;
          }).join('');

          // Wire up vote buttons
          if (!hostMode && myId) {
            listEl.querySelectorAll('.vote-btn').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const submissionId = btn.dataset.submissionId;
                const hasVoted = btn.dataset.voted === 'true';
                
                if (hasVoted) {
                  // Unvote
                  const { error: delError } = await supabase
                    .from('votes')
                    .delete()
                    .eq('user_id', myId)
                    .eq('submission_id', submissionId)
                    .eq('game_id', game.id)
                    .eq('party_id', game.party_id);
                  if (delError) {
                    console.error('[vote] Delete error:', delError);
                    alert(`Error: ${delError.message}`);
                  } else {
                    renderFavoriteSongs();
                  }
                } else {
                  // Vote
                  const { error: voteError } = await supabase.from('votes').insert({
                    user_id: myId,
                    submission_id: submissionId,
                    game_id: game.id,
                    party_id: game.party_id
                  });
                  if (voteError) {
                    console.error('[vote] Insert error:', voteError);
                    alert(`Error: ${voteError.message}`);
                  } else {
                    renderFavoriteSongs();
                  }
                }
              });
            });
          }
        }

        // initial render of list
        renderFavoriteSongs().catch(()=>{});
        if (form && !form.dataset.boundSubmit) {
          form.dataset.boundSubmit = '1';
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check if user is signed in
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session?.user) {
              alert('Please sign in to submit.');
              return;
            }
            
            const formData = new FormData(form);
            const title = (formData.get('title') || '').toString().trim();
            const artist = (formData.get('artist') || '').toString().trim();
            const link = (formData.get('link') || '').toString().trim();
            
            if (!title) {
              alert('Please enter a song title.');
              return;
            }
            
            // Submit to database
            const { error } = await supabase.from('submissions').insert({
              game_id: game.id,
              party_id: game.party_id,
              user_id: sessionData.session.user.id,
              content: { title, artist, link },
              display_name: null,
              moderation_status: 'pending'
            });
            
            if (error) {
              console.error('[favorite_song] Submission error:', error);
              alert(`Error: ${error.message}`);
            } else {
              alert('Thank you! Your song has been submitted for review.');
              form.reset();
              // refresh list after successful submission
              renderFavoriteSongs().catch(()=>{});
            }
          });
        }
      }
    }

    // For baby_photo games, add file upload handler
    if (type === 'baby_photo') {
      const game = games.find(g => g.id === gameId);
      if (game) {
        const form = qs('#game-content .game-form');
        const fileInput = qs('#photoUpload');
        const preview = qs('#photoPreview');
        const previewContainer = qs('.preview-container');
        const clearBtn = qs('#clearPreview');

        // Preview image when selected
        if (fileInput && preview && previewContainer) {
          fileInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                preview.src = event.target.result;
                previewContainer.hidden = false;
              };
              reader.readAsDataURL(file);
            }
          });

          if (clearBtn) {
            clearBtn.addEventListener('click', () => {
              fileInput.value = '';
              preview.src = '';
              previewContainer.hidden = true;
            });
          }
        }

        // Form submission
        if (form && !form.dataset.boundSubmit) {
          form.dataset.boundSubmit = '1';
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check if user is signed in
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session?.user) {
              alert('Please sign in to submit.');
              return;
            }

            const formData = new FormData(form);
            const photoInfo = (formData.get('photo_info') || '').toString().trim();
            const photoFile = fileInput?.files?.[0];
            const user = sessionData.session.user;

            if (!photoFile) {
              alert('Please select a photo to upload.');
              return;
            }

            // Disable submit button and show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn?.textContent || 'Submit Photo';
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.textContent = 'Uploading...';
            }

            try {
              // Upload photo to storage
              const fileExt = photoFile.name.split('.').pop();
              const fileName = `baby-photos/${game.party_id}/${game.id}/${user.id}_${Date.now()}.${fileExt}`;
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('party-media')
                .upload(fileName, photoFile, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (uploadError) {
                console.error('[baby_photo] Upload error:', uploadError);
                alert(`Upload failed: ${uploadError.message}`);
                return;
              }

              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('party-media')
                .getPublicUrl(fileName);

              // Save submission to database
              const { error: dbError } = await supabase.from('submissions').insert({
                game_id: game.id,
                party_id: game.party_id,
                user_id: user.id,
                content: { 
                  photo_url: publicUrl, 
                  file_path: fileName,
                  photo_info: photoInfo,
                  submitted_by_name: user.email || user.user_metadata?.name || 'Anonymous',
                  submitted_by_email: user.email
                },
                display_name: photoInfo || null,
                moderation_status: 'pending'
              });

              if (dbError) {
                console.error('[baby_photo] Database error:', dbError);
                alert(`Error saving submission: ${dbError.message}`);
                return;
              }

              // Show confirmation screen
              const gameContent = qs('#game-content');
              if (gameContent) {
                gameContent.innerHTML = `
                  <div class="card" style="text-align:center;padding:32px;">
                    <div style="font-size:48px;margin-bottom:16px;">✓</div>
                    <h3 style="color:var(--success-color, #22c55e);margin-bottom:8px;">Photo Uploaded Successfully!</h3>
                    <p class="muted" style="margin-bottom:24px;">Your baby photo has been submitted for review. The host will approve it before it appears in the gallery.</p>
                    <div style="display:flex;flex-direction:column;gap:8px;max-width:280px;margin:0 auto;">
                      <button class="primary" id="submitAnother">Submit Another Photo</button>
                      <button class="link" id="viewGallery">View Gallery</button>
                    </div>
                  </div>
                `;

                // Wire up buttons
                const submitAnotherBtn = qs('#submitAnother');
                const viewGalleryBtn = qs('#viewGallery');

                if (submitAnotherBtn) {
                  submitAnotherBtn.addEventListener('click', () => {
                    // Reload the game tab
                    const gameTab = document.querySelector(`.game-tab[data-game-id="${game.id}"]`);
                    if (gameTab) gameTab.click();
                  });
                }

                if (viewGalleryBtn) {
                  viewGalleryBtn.addEventListener('click', () => {
                    // Scroll to gallery if it exists, or reload to show it
                    const gallery = document.querySelector('.submissions-gallery');
                    if (gallery) {
                      gallery.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      const gameTab = document.querySelector(`.game-tab[data-game-id="${game.id}"]`);
                      if (gameTab) gameTab.click();
                    }
                  });
                }
              }

            } catch (err) {
              console.error('[baby_photo] Unexpected error:', err);
              alert('An unexpected error occurred. Please try again.');
            } finally {
              // Re-enable submit button
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
              }
            }
          });
        }
      }
    }
  });

  // Auto-load first game
  const first = document.querySelector('.game-tab');
  if (first) first.click();
}

/* -------- Header auth -------- */
function devRedirectOrigin() {
  const host = location.host;
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  return isLocal ? `http://${host}` : location.origin;
}

function wireHeaderAuth() {
  const form = document.getElementById('authFormHeader');
  const input = document.getElementById('authEmailHeader');
  const msg = document.getElementById('authMsgHeader');
  if (!form || !input || !msg) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (input.value || '').trim();
    if (!email) return;
    const redirectTo = devRedirectOrigin() + location.pathname + location.search;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    msg.textContent = error ? `Error: ${error.message}` : `Check your email: ${email}`;
    if (!error) input.value = '';
  });

  // role badge quick action (after header fragment is loaded)
  const roleBtn = document.getElementById('roleBadge');
  if (roleBtn) {
    roleBtn.addEventListener('click', () => {
      const r = roleBtn.dataset.role || 'guest';
      try {
        toast(`You are signed in as: ${r && r[0]?.toUpperCase() + r.slice(1)}`);
      } catch (e) {
        // fallback to alert if toast isn't available for some reason
        alert(`You are signed in as: ${r && r[0]?.toUpperCase() + r.slice(1)}`);
      }
    });
  }
}

async function fetchRole(user){
  if (!user) return { role: 'guest', source: null };

  // By default avoid probing the `profiles` table (some deployments name it differently).
  // Set `window.__HAS_PROFILES = true` in `config/env.local.js` if your Supabase project has the
  // top-level `profiles` table (this prevents noisy 404s when the table is missing).
  if (typeof window === 'undefined' || !window.__HAS_PROFILES) {
    return { role: 'guest', source: null };
  }

  // Prefer the canonical `profiles` table which holds the global role.
  try {
    const res = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (res.error) {
      console.debug('[fetchRole] profiles read error', res.error);
      return { role: 'guest', source: null };
    }
    const role = res.data?.role || null;
    return { role: role === 'host' ? 'host' : 'guest', source: role ? 'profiles' : null };
  } catch (e) {
    console.debug('[fetchRole] unexpected error', e);
    return { role: 'guest', source: null };
  }
}

function setRoleBadge(role, source=null){
  const btn = document.getElementById('roleBadge');
  if (!btn) return;
  const r = role === 'host' ? 'host' : 'guest';
  btn.textContent = r === 'host' ? 'Host' : 'Guest';
  btn.dataset.role = r;
  if (source) btn.dataset.source = source;
  btn.setAttribute('data-role', r);
  btn.setAttribute('aria-pressed', r === 'host' ? 'true' : 'false');
}

async function updateHeaderAuthState(user){
  const msg = document.getElementById('authMsgHeader');
  if (msg) msg.textContent = user?.email ? `Signed in as ${user.email}` : 'Sign in to continue';

  const res = await fetchRole(user);
  setRoleBadge(res.role, res.source);
}

/* -------- Magic-link handling -------- */
async function consumeAuthRedirect() {
  const url = new URL(window.location.href);
  const hash = url.hash.replace(/^#/, '');
  if (!hash) return;

  const hp = new URLSearchParams(hash);
  const access_token = hp.get('access_token');
  const refresh_token = hp.get('refresh_token');
  const error = hp.get('error');
  const error_description = hp.get('error_description');

  if (error) {
    try { sessionStorage.setItem('auth_error', `${error}: ${error_description || ''}`); } catch {}
  }
  if (access_token && refresh_token) {
    try { await supabase.auth.setSession({ access_token, refresh_token }); }
    catch (e) { console.warn('setSession error', e); }
  }
  history.replaceState({}, '', url.pathname + url.search); // clear #
}

/* -------- Party helpers -------- */
async function fetchPartyBySlug(slug) {
  try{
    const { data, error } = await supabase.from('parties').select('*').eq('slug', slug).limit(1);
    if (error) { console.error('[fetchPartyBySlug]', error); return null; }
    return data?.[0] ?? null;
  }catch(e){
    console.error('[fetchPartyBySlug] client error', e);
    return null;
  }
}

function renderPartyWelcome(party) {
  const err = sessionStorage.getItem('auth_error');
  if (err) sessionStorage.removeItem('auth_error');

  qs('#main').innerHTML = `
    <section class="card">
      <h2>${escapeHtml(party.title)}</h2>
      <p class="muted">${fmtDate(party.date)} • ${escapeHtml(party.venue || '')}</p>
      <div class="card" style="margin-top:12px;">
        <h3>Enter the party</h3>
        <p class="small">We’ll email you a one-time sign-in link.</p>
        ${err ? `<div class="notice" style="margin-bottom:8px;">${escapeHtml(err)}</div>` : ''}
        <form id="welcomeForm" class="row" autocomplete="on">
          <input type="email" id="welcomeEmail" placeholder="you@example.com" required />
          <button type="submit">Email me a magic link</button>
        </form>
        <div id="welcomeStatus" class="small" style="margin-top:8px;"></div>
      </div>
    </section>`;
  const form = qs('#welcomeForm');
  const email = qs('#welcomeEmail');
  const status = qs('#welcomeStatus');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const addr = (email.value || '').trim();
    if (!addr) return;
    const redirectTo = devRedirectOrigin() + location.pathname + location.search;
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: redirectTo }
    });
    status.textContent = error ? `Error: ${error.message}` : `Check your email: ${addr}`;
    if (!error) email.value = '';
  });
}

/* -------- Utils -------- */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch { return ''; }
}
function rootFallback(isGuest=false){
  return `<section class="card">
    <h2>${isGuest ? 'Welcome 🎉' : 'Host Dashboard'}</h2>
    <p class="small">Fragment failed to load. This is a safe fallback so the page isn't blank.</p>
  </section>`;
}

/* -------- Progress Tracker for Guests -------- */
async function getGuestProgressSteps(games, partyId, userId) {
  // Define the recommended order
  const recommendedOrder = ['about_you', 'favorite_song', 'baby_photo'];
  
  // Check which games user has completed
  const { data: submissions } = await supabase
    .from('submissions')
    .select('game_id, id')
    .eq('party_id', partyId)
    .eq('user_id', userId);
  
  const completedGameIds = new Set((submissions || []).map(s => s.game_id));
  
  // Build steps in recommended order
  const steps = [];
  const gamesByType = {};
  games.forEach(g => {
    if (!gamesByType[g.type]) gamesByType[g.type] = g;
  });
  
  let firstIncomplete = null;
  
  recommendedOrder.forEach((type, index) => {
    const game = gamesByType[type];
    if (!game) return;
    
    const isCompleted = completedGameIds.has(game.id);
    const isActive = !isCompleted && firstIncomplete === null;
    const isLocked = firstIncomplete !== null && !isCompleted;
    
    if (!isCompleted && firstIncomplete === null) {
      firstIncomplete = game.id;
    }
    
    steps.push({
      number: index + 1,
      gameId: game.id,
      title: game.title || type,
      type: type,
      description: getStepDescription(type),
      isCompleted,
      isActive,
      isLocked
    });
  });
  
  return steps;
}

function getStepDescription(type) {
  const descriptions = {
    'about_you': 'Tell us about yourself - start here!',
    'favorite_song': 'Share your favorite song and vote',
    'baby_photo': 'Upload your cutest baby photo'
  };
  return descriptions[type] || 'Complete this activity';
}

function buildProgressTracker(steps) {
  if (!steps || steps.length === 0) return '';
  
  const currentStep = steps.find(s => s.isActive);
  const completedCount = steps.filter(s => s.isCompleted).length;
  const totalCount = steps.length;
  
  // Current task banner
  let bannerHtml = '';
  if (currentStep) {
    const emoji = currentStep.type === 'about_you' ? '✨' : 
                  currentStep.type === 'favorite_song' ? '🎵' : '👶';
    bannerHtml = `
      <div class="current-task-banner">
        <div class="icon">${emoji}</div>
        <div class="content">
          <div class="title">Next Step: ${escapeHtml(currentStep.title)}</div>
          <div class="description">${escapeHtml(currentStep.description)}</div>
        </div>
      </div>
    `;
  } else if (completedCount === totalCount) {
    bannerHtml = `
      <div class="current-task-banner" style="background: var(--gradient-accent);">
        <div class="icon">🎉</div>
        <div class="content">
          <div class="title">All Done!</div>
          <div class="description">You've completed all activities. Great job!</div>
        </div>
      </div>
    `;
  }
  
  // Progress steps
  const stepsHtml = steps.map(step => {
    const statusClass = step.isCompleted ? 'completed' : 
                       step.isActive ? 'active' : 
                       step.isLocked ? 'locked' : '';
    
    const statusIcon = step.isCompleted ? '✓' : step.number;
    
    const badgeText = step.isCompleted ? 'Done' : 
                     step.isActive ? 'Start' : 'Locked';
    
    return `
      <div class="progress-step ${statusClass}" data-game-id="${step.gameId}">
        <div class="step-status">${statusIcon}</div>
        <div class="step-info">
          <div class="step-title">${escapeHtml(step.title)}</div>
          <div class="step-description">${escapeHtml(step.description)}</div>
        </div>
        <div class="step-badge">${badgeText}</div>
      </div>
    `;
  }).join('');
  
  return `
    ${bannerHtml}
    <div class="progress-tracker">
      <div class="title">Your Party Checklist (${completedCount}/${totalCount})</div>
      <div class="progress-steps">
        ${stepsHtml}
      </div>
    </div>
  `;
}
