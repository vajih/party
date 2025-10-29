import { supabase } from './services/supabaseClient.js';
import { initHostDashboard } from './features/host/dashboard.js';
import { toast } from './ui/toast.js';
import { initAboutYouExtended } from '../js/about-you-controller.js';

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

  // Get initial session
  const { data } = await supabase.auth.getSession();
  const initialUser = data?.session?.user ?? null;
  
  // Do initial route
  await route(initialUser);
  
  // re-route on any FUTURE auth state changes (skip the initial SIGNED_IN event)
  let isInitialAuth = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    // Skip the first auth state change event which fires immediately
    if (isInitialAuth) {
      isInitialAuth = false;
      return;
    }
    route(session?.user ?? null);
  });
}

async function route(userFromEvent) {
  const user = userFromEvent ?? (await supabase.auth.getSession()).data?.session?.user ?? null;

  const params = new URLSearchParams(location.search);
  const slug = params.get('party');

  // Hide header auth strip on party pages
  const strip = document.querySelector('[data-hide-on-party]');
  if (slug) strip?.setAttribute('hidden',''); else strip?.removeAttribute('hidden');

  // Clear party info from header if not on a party page
  if (!slug) {
    clearHeaderPartyInfo();
  }

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

  // Build party header with countdown (removed - now in global header)
  // Update global header with party info
  updateHeaderPartyInfo(party);
  
  if (!games || games.length === 0) {
    qs('#main').innerHTML = `<section class="card"><div class="card" style="margin-top:12px;"><p class="small">No games configured for this party yet.</p></div></section>`;
    return;
  }

  // Check completion status for progress tracker
  const progressSteps = await getGuestProgressSteps(games, party.id, user.id);

  // Show welcome modal FIRST for first-time guests (before rendering content)
  await showWelcomeModalIfNeeded(party, user);

  // Build progress tracker HTML
  const progressHtml = buildProgressTracker(progressSteps);

  qs('#main').innerHTML = `
    <section class="card">
      ${progressHtml}
      <div id="game-content" style="margin-top:24px;"></div>
      <!-- Birth map temporarily hidden -->
      <!-- <div id="birthMap" class="birth-map-container" style="margin-top:32px;"></div> -->
    </section>`;
  
  // Initialize countdown timer in header
  initHeaderCountdown(party.date);
  
  // Initialize birth map - temporarily disabled
  // initBirthMapComponent(party.id, user.id);

  // Wire up progress tracker clicks to load content directly
  document.querySelectorAll('.progress-step').forEach(step => {
    step.addEventListener('click', async () => {
      if (step.classList.contains('locked')) return;
      
      const gameId = step.dataset.gameId;
      const game = games.find(g => g.id === gameId);
      if (!game) return;
      
      // Load the game content directly
      await loadGameContent(game, games, party, user);
      
      // Scroll to game content after a short delay
      setTimeout(() => {
        const gameContent = document.getElementById('game-content');
        if (gameContent) {
          gameContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    });
  });

  // Listen for submission updates to refresh progress tracker
  window.addEventListener('submission-updated', async () => {
    console.log('[Progress Tracker] Refreshing after submission');
    const updatedSteps = await getGuestProgressSteps(games, party.id, user.id);
    const updatedProgressHtml = buildProgressTracker(updatedSteps);
    const trackerContainer = document.querySelector('.progress-tracker')?.parentElement;
    if (trackerContainer) {
      // Find and replace the entire progress section (banner + tracker)
      const currentBanner = document.querySelector('.current-task-banner');
      if (currentBanner) {
        currentBanner.remove();
      }
      const currentTracker = document.querySelector('.progress-tracker');
      if (currentTracker) {
        currentTracker.outerHTML = updatedProgressHtml;
        // Re-wire click handlers
        document.querySelectorAll('.progress-step').forEach(step => {
          step.addEventListener('click', async () => {
            if (step.classList.contains('locked')) return;
            const gameId = step.dataset.gameId;
            const game = games.find(g => g.id === gameId);
            if (!game) return;
            await loadGameContent(game, games, party, user);
            setTimeout(() => {
              const gameContent = document.getElementById('game-content');
              if (gameContent) {
                gameContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          });
        });
      }
    }
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

  // Helper function to load game content
  async function loadGameContent(game, allGames, party, user) {
    const type = game.type;
    const gameId = game.id;
    const p = partialForType(type);
    
    if (!p) {
      const content = document.getElementById('game-content');
      if (content) content.innerHTML = `<div class="card"><p class="small">No partial available for game type: ${escapeHtml(type)}</p></div>`;
      return;
    }
    
    await loadFragment('#game-content', p);
    
    // For about_you games, initialize the extended question experience
    if (type === 'about_you') {
      console.log('[about_you] Initializing extended questions');
      await initAboutYouExtended(party.id, user.id);
      return; // Extended controller handles everything
    }
    
    // Legacy: For about_you games with old config, dynamically inject question fields
    if (type === 'about_you_legacy') {
      const form = qs('#game-content .game-form');
      if (form && game) {
        // Check if questions are already rendered (prevent duplicates)
        if (form.dataset.questionsRendered === 'true') {
          console.debug('[about_you guest] Questions already rendered, skipping');
          return;
        }
        
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
          
          // Store questions count in form for later use
          form.dataset.questionsCount = questions.length;
          
          // Mark as rendered to prevent duplicates
          form.dataset.questionsRendered = 'true';
          
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
        
        // Add form submission handler
        if (form && !form.dataset.boundSubmit) {
          form.dataset.boundSubmit = '1';
          console.log('[about_you] Binding submit handler to form');
          
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[about_you] Form submitted');
            
            // Check if user is signed in
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session?.user) {
              alert('Please sign in to submit.');
              return;
            }
            
            console.log('[about_you] User authenticated:', sessionData.session.user.id);
            
            const formData = new FormData(form);
            const displayName = formData.get('display_name');
            const birthCity = (formData.get('birth_city') || '').trim();
            
            if (!displayName) {
              alert('Please enter a display name.');
              return;
            }
            
            if (!birthCity) {
              alert('Please enter your birth city.');
              return;
            }
            
            // Get questions count from form dataset
            const questionsCount = parseInt(form.dataset.questionsCount) || 0;
            
            // Collect answers
            const answers = {};
            for (let i = 0; i < questionsCount; i++) {
              const key = `q_${i}`;
              const value = (formData.get(key) || '').toString().trim();
              answers[key] = value;
            }
            
            console.log('[about_you] Collected answers:', answers);
            
            // Require at least one answer
            const hasAnyAnswer = Object.values(answers).some(v => v && v.length);
            if (!hasAnyAnswer) {
              alert('Please answer at least one question.');
              return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.textContent = 'Submitting...';
            }
            
            console.log('[about_you] Submitting to database...');
            
            // Geocode birth city
            let birthLat = null;
            let birthLng = null;
            if (birthCity) {
              try {
                const geoResult = await geocodeCity(birthCity);
                if (geoResult) {
                  birthLat = geoResult.lat;
                  birthLng = geoResult.lng;
                  console.log('[about_you] Geocoded city:', birthCity, '→', geoResult);
                }
              } catch (geoError) {
                console.warn('[about_you] Geocoding failed:', geoError);
                // Continue anyway - city name is still saved
              }
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
            
            // Save to party_profiles (upsert birth city data)
            if (!error) {
              const profileData = {
                party_id: game.party_id,
                user_id: sessionData.session.user.id,
                display_name: displayName,
                birth_city: birthCity,
                birth_lat: birthLat,
                birth_lng: birthLng
              };
              
              const { error: profileError } = await supabase
                .from('party_profiles')
                .upsert(profileData, {
                  onConflict: 'party_id,user_id'
                });
              
              if (profileError) {
                console.warn('[about_you] Failed to save party profile:', profileError);
              } else {
                console.log('[about_you] Party profile saved successfully');
                // Trigger map update event
                window.dispatchEvent(new CustomEvent('birth-map-updated'));
              }
            }
            
            // Restore button state
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
            }
            
            if (error) {
              console.error('[about_you] Submission error:', error);
              
              // Show error state
              const errorMsg = document.createElement('div');
              errorMsg.className = 'submission-status error';
              errorMsg.innerHTML = `
                <div class="status-icon">❌</div>
                <div class="status-content">
                  <div class="status-title">Submission Failed</div>
                  <div class="status-message">${escapeHtml(error.message)}</div>
                  <button class="link" onclick="this.parentElement.parentElement.remove()">Try Again</button>
                </div>
              `;
              form.insertAdjacentElement('beforebegin', errorMsg);
              
              // Scroll to error
              errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              console.log('[about_you] Submission successful');
              
              // Store submitted data for potential edit
              const submittedData = {
                display_name: displayName,
                answers: answers
              };
              form.dataset.submittedData = JSON.stringify(submittedData);
              
              // Show success state
              const successMsg = document.createElement('div');
              successMsg.className = 'submission-status success';
              successMsg.innerHTML = `
                <div class="status-icon">✓</div>
                <div class="status-content">
                  <div class="status-title">Submitted Successfully! 🎉</div>
                  <div class="status-message">
                    Thank you, <strong>${escapeHtml(displayName)}</strong>! Your answers have been sent to the host for review.
                    You'll receive a notification once they're approved.
                  </div>
                  <div class="status-actions">
                    <button class="link primary" onclick="
                      const nextStep = document.querySelector('.progress-step:not(.completed):not(.locked)');
                      if (nextStep) {
                        nextStep.click();
                      } else {
                        const gameContent = document.getElementById('game-content');
                        if (gameContent) gameContent.scrollIntoView({ behavior: 'smooth' });
                      }
                    ">
                      Continue to Next Activity →
                    </button>
                    <button class="link" onclick="
                      const form = document.querySelector('.game-form');
                      const data = JSON.parse(form.dataset.submittedData || '{}');
                      
                      // Re-populate form
                      if (data.display_name) {
                        form.querySelector('[name=display_name]').value = data.display_name;
                      }
                      Object.entries(data.answers || {}).forEach(([key, val]) => {
                        const input = form.querySelector('[name=' + key + ']');
                        if (input) input.value = val;
                      });
                      
                      // Show form, hide success
                      this.closest('.submission-status').remove();
                      form.style.display = 'block';
                      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    ">
                      ✏️ Edit My Answers
                    </button>
                  </div>
                </div>
              `;
              
              // Hide form and show success
              form.style.display = 'none';
              form.insertAdjacentElement('beforebegin', successMsg);
              
              // Scroll to success message
              setTimeout(() => {
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
              
              // Trigger progress update
              window.dispatchEvent(new CustomEvent('submission-updated'));
            }
          });
        } else if (form) {
          console.log('[about_you] Form already has submit handler bound');
        } else {
          console.error('[about_you] Form not found!');
        }
      }
    }
    
    // For favorite_song games, add form submission handler
    if (type === 'favorite_song') {
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
      if (game) {
        // Check if user already submitted a photo
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        
        if (userId) {
          const { data: existingSubmissions, error: checkError } = await supabase
            .from('submissions')
            .select('id, content, moderation_status, created_at')
            .eq('game_id', game.id)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (!checkError && existingSubmissions && existingSubmissions.length > 0) {
            const submission = existingSubmissions[0];
            const status = submission.moderation_status;
            const statusText = status === 'approved' ? 'approved and is visible in the gallery' :
                             status === 'rejected' ? 'was reviewed but not approved' :
                             'is pending review by the host';
            const statusColor = status === 'approved' ? 'var(--success)' :
                              status === 'rejected' ? 'var(--danger)' :
                              'var(--warning)';
            
            // Show already submitted message
            const gameContent = qs('#game-content');
            if (gameContent) {
              gameContent.innerHTML = `
                <div class="submission-status success" style="border-color: ${statusColor};">
                  <div class="status-icon" style="color: ${statusColor};">${status === 'approved' ? '✓' : status === 'rejected' ? '✕' : '⏳'}</div>
                  <div class="status-content">
                    <div class="status-title">You've Already Submitted a Photo!</div>
                    <div class="status-message">
                      Your baby photo ${statusText}. You can only submit one photo per party.
                      ${status === 'pending' ? ' The host will review it soon!' : ''}
                    </div>
                    <div class="status-actions">
                      <button class="link primary" onclick="
                        const gallery = document.querySelector('.submissions-gallery');
                        if (gallery) {
                          gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                          window.location.reload();
                        }
                      ">
                        View Gallery
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }
            return; // Exit early, don't set up form handlers
          }
        }
        
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
                  <div class="submission-status success">
                    <div class="status-icon">✓</div>
                    <div class="status-content">
                      <div class="status-title">Photo Submitted Successfully! 🎉</div>
                      <div class="status-message">
                        Your baby photo has been sent to the host for review. 
                        You'll see it in the gallery once it's approved!
                        <br><br>
                        <strong>Note:</strong> You can only submit one photo per party.
                      </div>
                      <div class="status-actions">
                        <button class="link primary" onclick="
                          const nextStep = document.querySelector('.progress-step:not(.completed):not(.locked)');
                          if (nextStep) {
                            nextStep.click();
                          } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        ">
                          Continue to Next Activity →
                        </button>
                        <button class="link" onclick="
                          const gallery = document.querySelector('.submissions-gallery');
                          if (gallery) {
                            gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        ">
                          View Gallery
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }
              
              // Trigger progress update
              window.dispatchEvent(new CustomEvent('submission-updated'));

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
    } // End of if (type === 'baby_photo')
  } // End of loadGameContent function

  // Auto-load first incomplete game
  const firstIncompleteStep = document.querySelector('.progress-step:not(.completed)');
  if (firstIncompleteStep) {
    const firstGame = games.find(g => g.id === firstIncompleteStep.dataset.gameId);
    if (firstGame) {
      await loadGameContent(firstGame, games, party, user);
    }
  }
} // End of route function

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
    
    if (error) {
      msg.textContent = `Error: ${error.message}`;
    } else {
      // Hide the form and show clear success message
      form.style.display = 'none';
      msg.innerHTML = `
        <div style="text-align: center; padding: 16px; background: var(--mint-tint); border: 1px solid var(--mint); border-radius: 12px;">
          <div style="font-size: 24px; margin-bottom: 8px;">📧</div>
          <div style="font-weight: 600; margin-bottom: 8px;">Party link sent to your email!</div>
          <div style="color: var(--text-secondary); font-size: 14px;">Check your inbox at <strong>${email}</strong> and click the link to join the party.</div>
        </div>
      `;
      input.value = '';
    }
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

/* -------- Party Header Info (in global header) -------- */
function updateHeaderPartyInfo(party) {
  const headerInfo = document.getElementById('headerPartyInfo');
  if (!headerInfo) {
    console.log('[updateHeaderPartyInfo] headerInfo element not found');
    return;
  }
  
  console.log('[updateHeaderPartyInfo] party:', party);
  console.log('[updateHeaderPartyInfo] party.date:', party.date);
  console.log('[updateHeaderPartyInfo] fmtDate result:', fmtDate(party.date));
  
  const hasDetails = party.description || party.venue;
  
  headerInfo.innerHTML = `
    <div class="party-header-line1">
      <span class="party-name">${escapeHtml(party.title)}</span>
      <span class="party-separator">•</span>
      <span class="party-date-inline">${fmtDate(party.date)}</span>
      ${hasDetails ? `
        <button class="party-info-btn" title="View party details" aria-label="View party details">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C4.5 2 1.7 4.7 1 8c.7 3.3 3.5 6 7 6s6.3-2.7 7-6c-.7-3.3-3.5-6-7-6zm0 10a4 4 0 110-8 4 4 0 010 8z" fill="currentColor"/>
          </svg>
        </button>
      ` : ''}
    </div>
    <div class="party-countdown-inline" data-date="${party.date}">
      <span class="countdown-loading-inline">...</span>
    </div>
  `;
  
  console.log('[updateHeaderPartyInfo] HTML set, headerInfo.innerHTML:', headerInfo.innerHTML);
  
  // Wire up info button to show modal with details
  if (hasDetails) {
    const infoBtn = headerInfo.querySelector('.party-info-btn');
    if (infoBtn) {
      infoBtn.addEventListener('click', () => {
        showPartyDetailsModal(party);
      });
    }
  }
}

function showPartyDetailsModal(party) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal party-details-modal">
      <div class="modal-header">
        <h3>${escapeHtml(party.title)}</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        ${party.description ? `<p class="party-description">${escapeHtml(party.description)}</p>` : ''}
        ${party.venue ? `<p class="party-venue"><strong>Location:</strong> ${escapeHtml(party.venue)}</p>` : ''}
        <p class="party-date-full"><strong>Date:</strong> ${fmtDate(party.date)}</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close handlers
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  // ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function initHeaderCountdown(eventDate) {
  if (!eventDate) return;
  
  const countdownEl = document.querySelector('.party-countdown-inline');
  if (!countdownEl) return;
  
  const targetDate = new Date(eventDate).getTime();
  
  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;
    
    if (distance < 0) {
      countdownEl.innerHTML = `<span class="countdown-complete-inline">🎉 Now!</span>`;
      return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    
    let text = '';
    if (days > 0) {
      text = `${days}d ${hours}h`;
    } else if (hours > 0) {
      text = `${hours}h ${minutes}m`;
    } else {
      text = `${minutes}m`;
    }
    
    countdownEl.innerHTML = `<span class="countdown-value-inline">${text}</span>`;
  }
  
  // Update immediately and then every minute (no need for seconds in header)
  updateCountdown();
  const intervalId = setInterval(updateCountdown, 60000);
  
  // Store interval ID
  countdownEl.dataset.intervalId = intervalId;
}

function clearHeaderPartyInfo() {
  const headerInfo = document.getElementById('headerPartyInfo');
  if (headerInfo) {
    headerInfo.innerHTML = 'Party App';
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
  btn.textContent = r === 'host' ? 'H' : 'G';
  btn.dataset.role = r;
  if (source) btn.dataset.source = source;
  btn.setAttribute('data-role', r);
  btn.setAttribute('aria-pressed', r === 'host' ? 'true' : 'false');
  btn.setAttribute('title', r === 'host' ? 'Host' : 'Guest');
}

async function updateHeaderAuthState(user){
  const msg = document.getElementById('authMsgHeader');
  if (msg) msg.textContent = user?.email ? `Signed in as ${user.email}` : 'Sign in to continue';

  // Update email display in header
  const emailDisplay = document.getElementById('userEmailDisplay');
  if (emailDisplay && user?.email) {
    emailDisplay.textContent = user.email;
    emailDisplay.style.display = 'inline-block';
    emailDisplay.title = `Signed in as ${user.email}`;
  } else if (emailDisplay) {
    emailDisplay.style.display = 'none';
  }

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
    
    if (error) {
      status.textContent = `Error: ${error.message}`;
    } else {
      // Hide the form and show clear success message
      form.style.display = 'none';
      status.innerHTML = `
        <div style="text-align: center; padding: 20px; background: var(--mint-tint); border: 1px solid var(--mint); border-radius: 12px; margin-top: 16px;">
          <div style="font-size: 32px; margin-bottom: 12px;">📧</div>
          <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: var(--ink);">Party link sent!</div>
          <div style="color: var(--text-secondary); line-height: 1.6;">
            <p style="margin-bottom: 8px;">We sent a magic link to:</p>
            <p style="font-weight: 600; color: var(--ink); margin-bottom: 12px;">${addr}</p>
            <p style="margin-bottom: 0;">Open your email and click the link to join the party.</p>
          </div>
        </div>
      `;
      email.value = '';
    }
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
  // Define the recommended order - removed baby_photo since it's now part of about_you
  const recommendedOrder = ['about_you', 'favorite_song'];
  
  // Check which games user has completed
  const { data: submissions } = await supabase
    .from('submissions')
    .select('game_id, id')
    .eq('party_id', partyId)
    .eq('user_id', userId);
  
  const completedGameIds = new Set((submissions || []).map(s => s.game_id));
  
  // Special check for About You - check if all 4 batches are complete
  const { data: profile } = await supabase
    .from('party_profiles')
    .select('batch_progress')
    .eq('party_id', partyId)
    .eq('user_id', userId)
    .single();
  
  const aboutYouGame = games.find(g => g.type === 'about_you');
  if (aboutYouGame && profile?.batch_progress) {
    const batchProgress = profile.batch_progress;
    const allBatchesComplete = 
      batchProgress.batch_1 === 'complete' && 
      batchProgress.batch_2 === 'complete' && 
      batchProgress.batch_3 === 'complete' &&
      batchProgress.batch_4 === 'complete';
    
    if (allBatchesComplete) {
      completedGameIds.add(aboutYouGame.id);
    }
  }
  
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
    'about_you': 'Complete your profile (4 batches including baby photo)',
    'favorite_song': 'Share your favorite song and vote'
  };
  return descriptions[type] || 'Complete this activity';
}

function buildProgressTracker(steps) {
  if (!steps || steps.length === 0) return '';
  
  const completedCount = steps.filter(s => s.isCompleted).length;
  const totalCount = steps.length;
  
  // Show completion celebration banner only when all done
  let bannerHtml = '';
  if (completedCount === totalCount) {
    bannerHtml = `
      <div class="current-task-banner completion-banner">
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

/* -------- Welcome Modal for First-Time Guests -------- */
async function showWelcomeModalIfNeeded(party, user) {
  // Check if user has seen welcome modal for this party
  const storageKey = `welcome-seen-${party.id}-${user.id}`;
  if (localStorage.getItem(storageKey)) {
    return; // Already seen
  }

  // Check if modal already exists (prevent duplicates)
  if (document.getElementById('welcomeModal')) {
    console.log('[Welcome Modal] Modal already exists, skipping');
    return;
  }

  console.log('[Welcome Modal] Creating modal for first-time user');

  // Format party date
  let formattedDate = 'To be announced';
  let formattedTime = 'To be announced';
  if (party.date) {
    const partyDate = new Date(party.date);
    // Format: "Saturday, November 23rd, 2025"
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    formattedDate = partyDate.toLocaleDateString('en-US', options);
    
    // Format time: "6:00 PM"
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    formattedTime = partyDate.toLocaleTimeString('en-US', timeOptions);
  }
  
  const venue = party.venue || 'Venue to be announced';

  // Create and show welcome modal
  const modalHtml = `
    <div class="modal-overlay" id="welcomeModal">
      <div class="modal modal-welcome modal-invitation">
        <button class="modal-close" aria-label="Close" id="closeWelcome">×</button>
        
        <div class="invitation-card">
          <div class="invitation-header">
            <div class="invitation-ornament">✦</div>
            <h2 class="invitation-title">${escapeHtml(party.title)}</h2>
            <div class="invitation-ornament">✦</div>
          </div>
          
          <div class="invitation-body">
            <p class="invitation-thank-you">
              Thank you for being our guest and confirming your attendance.
            </p>
            
            <p class="invitation-greeting">
              We request the pleasure of your company on
            </p>
            
            <div class="invitation-event-details">
              <p class="event-date">${escapeHtml(formattedDate)}</p>
              <p class="event-time">${escapeHtml(formattedTime)}</p>
              <p class="event-at">at</p>
              <p class="event-venue">${escapeHtml(venue)}</p>
            </div>
            
            <blockquote class="invitation-quote">
              "Let the beauty of what you love be what you do."
              <cite>— Rumi</cite>
            </blockquote>
            
            <p class="invitation-note">
              The theme of the evening is <strong>getting to know you</strong>. We've prepared activities to help us all 
              share and connect—favorite songs, memories, and stories that make gatherings meaningful.
              
            </p>
            
            <p class="invitation-cta">
              Please take a few moments to complete the interactive activities ahead. Your stories and participation will help create an unforgettable evening together!
            </p>
            
            <div class="invitation-hosts-bottom">
              Sarah & Waqar <span class="host-separator">•</span> Ghazala & Aftab <span class="host-separator">•</span> Fatima & Vajih
            </div>
          </div>
          
          <div class="invitation-footer">
            <button class="cta-button" id="startJourney">Continue</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insert modal into DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Prevent body scroll and preserve scroll position
  const scrollY = window.scrollY;
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  document.body.style.top = `-${scrollY}px`;

  console.log('[Welcome Modal] Modal inserted into DOM, scroll position:', scrollY);

  // Wire up close handlers - Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    console.log('[Welcome Modal] Setting up event listeners...');
    
    const modal = document.getElementById('welcomeModal');
    const closeBtn = document.getElementById('closeWelcome');
    const startBtn = document.getElementById('startJourney');

    console.log('[Welcome Modal] Elements:', {
      modal: modal,
      closeBtn: closeBtn,
      startBtn: startBtn
    });

    if (!modal || !closeBtn || !startBtn) {
      console.error('[Welcome Modal] Failed to find modal elements', {
        modal: !!modal,
        closeBtn: !!closeBtn,
        startBtn: !!startBtn
      });
      return;
    }

    console.log('[Welcome Modal] All elements found, wiring up handlers');

    function closeModal() {
      console.log('[Welcome Modal] Closing modal...');
      modal.classList.add('closing');
      setTimeout(() => {
        modal.remove();
        
        // Restore body scroll and position
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        const scrollY = document.body.style.top;
        document.body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
        
        console.log('[Welcome Modal] Modal closed, scroll restored');
      }, 300);
      localStorage.setItem(storageKey, 'true');
    }

    function startJourney() {
      console.log('[Welcome Modal] Starting journey...');
      closeModal();
      // Auto-click the first game tab
      setTimeout(() => {
        const firstTab = document.querySelector('.game-tab');
        console.log('[Welcome Modal] First tab:', firstTab);
        if (firstTab) {
          firstTab.click();
          // Scroll to game content
          setTimeout(() => {
            const gameContent = document.getElementById('game-content');
            if (gameContent) {
              gameContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      }, 400);
    }

    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Welcome Modal] Close button clicked');
      closeModal();
    });
    
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Welcome Modal] Start button clicked');
      startJourney();
    });

    // Also add onclick as a backup
    startBtn.onclick = (e) => {
      e.preventDefault();
      console.log('[Welcome Modal] Start button onclick fired');
      startJourney();
    };
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('[Welcome Modal] Overlay clicked');
        closeModal();
      }
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        console.log('[Welcome Modal] Escape key pressed');
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Add confetti effect after handlers are set up
    try {
      createConfetti();
    } catch (err) {
      console.error('[Welcome Modal] Confetti error:', err);
    }
  }, 100);
}

function createConfetti() {
  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
  const modal = document.querySelector('.modal-header');
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    modal.appendChild(confetti);
    
    // Remove after animation
    setTimeout(() => confetti.remove(), 5000);
  }
}

/* -------- Geocoding & Map Utilities -------- */

/**
 * Geocode a city name to lat/lng using Nominatim (OpenStreetMap)
 * Free, no API key required
 */
async function geocodeCity(cityName) {
  if (!cityName || !cityName.trim()) return null;
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
      q: cityName,
      format: 'json',
      limit: '1'
    });
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PartyApp/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok) {
      console.error('[geocodeCity] HTTP error:', response.status);
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('[geocodeCity] Error:', error);
    return null;
  }
}

/**
 * Load birth points map data for a party
 */
async function fetchBirthPoints(partyId) {
  try {
    console.log('[fetchBirthPoints] Fetching for party:', partyId);
    const { data, error } = await supabase
      .rpc('party_birth_points', { p_party_id: partyId });
    
    if (error) {
      console.error('[fetchBirthPoints] Error:', error);
      return [];
    }
    
    console.log('[fetchBirthPoints] Received data:', data);
    console.log('[fetchBirthPoints] Data length:', data?.length);
    
    return data || [];
  } catch (error) {
    console.error('[fetchBirthPoints] Error:', error);
    return [];
  }
}

/**
 * Check if current user has submitted their birth city
 */
async function hasUserSubmittedBirthCity(partyId, userId) {
  try {
    const { data, error} = await supabase
      .from('party_profiles')
      .select('birth_city')
      .eq('party_id', partyId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[hasUserSubmittedBirthCity] Error:', error);
      return false;
    }
    
    return !!(data && data.birth_city);
  } catch (error) {
    console.error('[hasUserSubmittedBirthCity] Error:', error);
    return false;
  }
}

/**
 * Initialize the birth map component
 */
async function initBirthMapComponent(partyId, userId) {
  console.log('[initBirthMapComponent] Starting - partyId:', partyId, 'userId:', userId);
  
  const container = document.getElementById('birthMap');
  if (!container) {
    console.error('[birthMap] Container not found');
    return;
  }

  // Check if user has submitted their birth city
  const hasSubmitted = await hasUserSubmittedBirthCity(partyId, userId);
  console.log('[initBirthMapComponent] User has submitted birth city:', hasSubmitted);
  
  if (!hasSubmitted) {
    // Show locked state
    container.innerHTML = `
      <div class="birth-map-locked">
        <div class="lock-icon">🔒</div>
        <h3>Where is Everyone From?</h3>
        <p>Unlock this interactive map by completing the "About You" activity and sharing your birth city!</p>
        <button class="link primary" onclick="
          const aboutYouStep = Array.from(document.querySelectorAll('.progress-step')).find(step => {
            const game = step.textContent.toLowerCase();
            return game.includes('about') || game.includes('you');
          });
          if (aboutYouStep) aboutYouStep.click();
        ">
          Complete About You to Unlock →
        </button>
      </div>
    `;
    return;
  }

  // Fetch birth points data
  console.log('[initBirthMapComponent] Fetching birth points...');
  const birthPoints = await fetchBirthPoints(partyId);
  console.log('[initBirthMapComponent] Fetched birth points:', birthPoints);
  
  if (!birthPoints || birthPoints.length === 0) {
    console.log('[initBirthMapComponent] No birth points found');
    container.innerHTML = `
      <div class="birth-map-empty">
        <div class="icon">🌍</div>
        <p>No birth cities submitted yet. You're the first!</p>
      </div>
    `;
    return;
  }

  // Render the map
  console.log('[initBirthMapComponent] Rendering map with', birthPoints.length, 'points');
  renderBirthMap(container, birthPoints);
  
  // Listen for updates
  window.addEventListener('birth-map-updated', async () => {
    console.log('[birthMap] Received update event, refreshing...');
    const updatedPoints = await fetchBirthPoints(partyId);
    if (updatedPoints && updatedPoints.length > 0) {
      renderBirthMap(container, updatedPoints);
    }
  });
}

/**
 * Render the Leaflet map with birth city markers
 */
function renderBirthMap(container, birthPoints) {
  console.log('[renderBirthMap] Rendering map with points:', birthPoints);
  console.log('[renderBirthMap] Number of points:', birthPoints.length);
  
  // Clear container and set up structure
  container.innerHTML = `
    <div class="birth-map-header">
      <h3>🌍 Where We're All From</h3>
      <p class="muted">${birthPoints.length} ${birthPoints.length === 1 ? 'city' : 'cities'} represented • ${birthPoints.reduce((sum, p) => sum + (p.count || 0), 0)} guests</p>
    </div>
    <div id="leafletMap" style="height: 400px; border-radius: 12px; overflow: hidden;"></div>
  `;

  // Wait for Leaflet to be available
  if (typeof L === 'undefined') {
    console.error('[birthMap] Leaflet not loaded');
    container.innerHTML = '<p class="error">Map library not loaded. Please refresh the page.</p>';
    return;
  }

  // Wait for DOM to be ready, then initialize map
  setTimeout(() => {
    const mapContainer = document.getElementById('leafletMap');
    if (!mapContainer) {
      console.error('[renderBirthMap] Map container element not found in DOM');
      return;
    }
    
    try {
      // Remove existing map instance if it exists
      if (mapContainer._leaflet_id) {
        console.log('[renderBirthMap] Removing existing map instance');
        mapContainer._leaflet_id = undefined;
        mapContainer.innerHTML = '';
      }
      
      // Initialize Leaflet map
      const map = L.map('leafletMap').setView([20, 0], 2);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // Calculate max count for scaling
      const maxCount = Math.max(...birthPoints.map(p => parseInt(p.count) || 1));
      console.log('[renderBirthMap] Max count:', maxCount);
      
      // Add markers with scaled circles
      birthPoints.forEach((point, index) => {
        const { birth_city, birth_lat, birth_lng, count } = point;
        
        console.log(`[renderBirthMap] Processing point ${index + 1}:`, {
          city: birth_city,
          lat: birth_lat,
          lng: birth_lng,
          count: count
        });
        
        if (!birth_lat || !birth_lng) {
          console.warn(`[renderBirthMap] Skipping point ${index + 1} - missing coordinates`);
          return;
        }
        
        // Scale radius based on count
        // Minimum 8px, maximum 30px
        const baseRadius = 8;
        const maxRadius = 30;
        const countInt = parseInt(count) || 1;
        const radius = maxCount > 1 
          ? baseRadius + ((countInt / maxCount) * (maxRadius - baseRadius))
          : baseRadius;
        
        console.log(`[renderBirthMap] Circle for ${birth_city}: radius=${radius.toFixed(1)}px (count=${countInt}/${maxCount})`);
        
        // Circle marker
        const circle = L.circleMarker([birth_lat, birth_lng], {
          radius: radius,
          fillColor: '#8b5cf6',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.7
        }).addTo(map);
        
        // Popup
        const plural = countInt === 1 ? 'guest' : 'guests';
        circle.bindPopup(`
          <div class="map-popup">
            <strong>${escapeHtml(birth_city || 'Unknown')}</strong><br>
            <span class="muted">${countInt} ${plural}</span>
          </div>
        `);
      });

      // Fit map to show all markers
      if (birthPoints.length > 0) {
        const bounds = birthPoints
          .filter(p => p.birth_lat && p.birth_lng)
          .map(p => [p.birth_lat, p.birth_lng]);
        
        if (bounds.length > 0) {
          console.log('[renderBirthMap] Fitting map to bounds:', bounds.length, 'points');
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
      
      console.log('[renderBirthMap] Map rendered successfully');
    } catch (error) {
      console.error('[renderBirthMap] Error rendering map:', error);
      container.innerHTML = '<p class="error">Failed to render map. Please refresh the page.</p>';
    }
  }, 200); // Increased timeout to ensure DOM is ready
}
