// Enhanced renderFavoriteSongs with voting - to be inserted in main.js

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
