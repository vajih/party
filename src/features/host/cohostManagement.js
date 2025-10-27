// Co-Host Management functionality
import { supabase } from '../../services/supabaseClient.js';
import { toast } from '../../ui/toast.js';

const qs = (s, r=document) => r.querySelector(s);
const log = (...a) => console.debug('[cohost-management]', ...a);

// Helper function to safely escape HTML
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to get required DOM elements
function getElements() {
  return {
    partySelect: qs('#cohostPartySelect'),
    cohostSection: qs('#cohostSection'),
    addForm: qs('#addCohostForm'),
    emailInput: qs('#cohostEmail'),
    roleSelect: qs('#cohostRole'),
    list: qs('#cohostList')
  };
}

// Initialize co-host management UI
export async function initCohostManagement() {
  const elements = getElements();
  if (!elements.partySelect) {
    console.error('Missing required DOM elements for co-host management');
    return;
  }

  // Load initial parties list
  await refreshPartySelect();

  // Show/hide co-host section based on party selection
  elements.partySelect.addEventListener('change', () => {
    const partyId = elements.partySelect.value;
    elements.cohostSection.hidden = !partyId;
    if (partyId) {
      renderCohostList(partyId);
    }
  });

  // Listen for party updates
  window.addEventListener('party-updated', refreshPartySelect);

  // Handle form submission
  elements.addForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const partyId = elements.partySelect.value;
    if (!partyId) return;

    const email = elements.emailInput.value.trim().toLowerCase();
    const role = elements.roleSelect.value;

    try {
      // Check if already invited
      const { data: existing } = await supabase
        .from('party_hosts')
        .select('id')
        .eq('party_id', partyId)
        .eq('invite_email', email)
        .limit(1);

      if (existing?.length) {
        toast('This email has already been invited', { type: 'warning' });
        return;
      }

      const { error } = await supabase.from('party_hosts').insert({
        party_id: partyId,
        invite_email: email,
        role
      });

      if (error) throw error;

      elements.emailInput.value = '';
      toast('Co-host added successfully', { type: 'success' });
      await renderCohostList(partyId);

    } catch (err) {
      console.error('Failed to add co-host:', err);
      toast('Failed to add co-host: ' + err.message, { type: 'error' });
    }
  });
}

// Refresh the party select dropdown
export async function refreshPartySelect() {
  const elements = getElements();
  if (!elements.partySelect) return;

  try {
    const { data: parties, error } = await supabase
      .from('parties')
      .select('id, title, slug')
      .eq('host_id', (await supabase.auth.getUser())?.data?.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!parties?.length) {
      elements.partySelect.innerHTML = '<option value="">No parties found</option>';
      elements.cohostSection.hidden = true;
      return;
    }

    elements.partySelect.innerHTML = parties
      .map(p => `<option value="${p.id}">${escapeHtml(p.title)} (${escapeHtml(p.slug)})</option>`)
      .join('');

    // Show/hide section based on whether we have any parties
    elements.cohostSection.hidden = !elements.partySelect.value;
    
    // If we have a selected party, refresh its co-host list
    if (elements.partySelect.value) {
      await renderCohostList(elements.partySelect.value);
    }

  } catch (err) {
    console.error('Failed to load parties:', err);
    elements.partySelect.innerHTML = '<option value="">Failed to load parties</option>';
    elements.cohostSection.hidden = true;
  }
}

// Render the list of co-hosts for a party
async function renderCohostList(partyId) {
  const { list } = getElements();
  if (!list) return;

  list.innerHTML = '<p class="small">Loading...</p>';

  try {
    const { data: cohosts, error } = await supabase
      .from('party_hosts')
      .select('id, invite_email, role, created_at, user_id')
      .eq('party_id', partyId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!cohosts?.length) {
      list.innerHTML = '<p class="small">No co-hosts added yet.</p>';
      return;
    }

    list.innerHTML = cohosts.map(host => `
      <div class="item" data-id="${host.id}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <div>
            <div><strong>${host.role === 'cohost' ? 'Co-Host' : 'Moderator'}</strong></div>
            <div class="small">
              ${escapeHtml(host.invite_email)}
              ${!host.user_id ? ' (Invited)' : ''}
            </div>
          </div>
          <button class="link danger removeCohostBtn">Remove</button>
        </div>
      </div>
    `).join('');

    // Wire up remove buttons
    list.querySelectorAll('.removeCohostBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const hostId = btn.closest('.item').dataset.id;
        if (!confirm('Remove this co-host? They will no longer have access to manage this party.')) {
          return;
        }

        try {
          const { error } = await supabase
            .from('party_hosts')
            .delete()
            .eq('id', hostId);

          if (error) throw error;
          toast('Co-host removed successfully', { type: 'success' });
          await renderCohostList(partyId);

        } catch (err) {
          console.error('Failed to remove co-host:', err);
          toast('Failed to remove co-host: ' + err.message, { type: 'error' });
        }
      });
    });

  } catch (err) {
    console.error('Failed to load co-hosts:', err);
    list.innerHTML = '<p class="small error">Failed to load co-hosts. Please try again.</p>';
  }
}