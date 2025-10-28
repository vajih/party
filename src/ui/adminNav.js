// Admin Navigation functionality
import { supabase } from '../services/supabaseClient.js';

const qs = (s, r=document) => r.querySelector(s);
const qsa = (s, r=document) => [...r.querySelectorAll(s)];

// Initialize admin navigation
export function initAdminNav() {
  // Get DOM elements
  const navLinks = qsa('.admin-sidebar .nav-item');
  const sections = qsa('.admin-main .section');
  const quickActions = {
    newGame: qs('#newGameBtn'),
    inviteCohost: qs('#inviteCohostBtn'),
    checkMod: qs('#checkModQueueBtn'),
    headerCreateParty: qs('#headerCreatePartyBtn'),
    overviewCreateParty: qs('#overviewCreatePartyBtn'),
    scrollToCreateForm: qs('#scrollToCreateFormBtn'),
    newGameToggle: qs('#newGameToggle'),
  };

  // Show initial section (Overview)
  showSection('overview');
  updateActiveNav('overview');

  // Handle navigation clicks
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('href').slice(1);
      showSection(sectionId);
      updateActiveNav(sectionId);
    });
  });

  // Wire up quick action buttons
  quickActions.newGame?.addEventListener('click', () => {
    showSection('games');
    updateActiveNav('games');
  });

  quickActions.inviteCohost?.addEventListener('click', () => {
    showSection('cohosts');
    updateActiveNav('cohosts');
  });

  quickActions.checkMod?.addEventListener('click', () => {
    showSection('moderation');
    updateActiveNav('moderation');
  });

  // Handle "Create Party" buttons from header and overview
  const handleCreateParty = () => {
    showSection('parties');
    updateActiveNav('parties');
    // Scroll to create form after a brief delay to ensure section is visible
    setTimeout(() => {
      const createCard = qs('#createPartyCard');
      if (createCard) {
        createCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  quickActions.headerCreateParty?.addEventListener('click', handleCreateParty);
  quickActions.overviewCreateParty?.addEventListener('click', handleCreateParty);
  quickActions.scrollToCreateForm?.addEventListener('click', () => {
    const createCard = qs('#createPartyCard');
    if (createCard) {
      createCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Handle "Add Game" toggle button
  quickActions.newGameToggle?.addEventListener('click', () => {
    const newGameCard = qs('#newGameCard');
    if (newGameCard) {
      const isHidden = newGameCard.style.display === 'none';
      newGameCard.style.display = isHidden ? 'block' : 'none';
      quickActions.newGameToggle.textContent = isHidden ? 'Hide Form' : 'Add Game';
      
      if (isHidden) {
        // Scroll to form when showing
        setTimeout(() => {
          newGameCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  });

  // Handle URL hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || 'overview';
    showSection(hash);
    updateActiveNav(hash);
  });

  // Update stats when showing overview
  async function updateStats() {
    const stats = {
      totalParties: qs('#totalParties'),
      activeGames: qs('#activeGames'),
      totalGuests: qs('#totalGuests'),
      pendingMods: qs('#pendingMods')
    };

    if (!stats.totalParties) return;

    // Get current user to filter by host
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Count parties for this host
    const { count: partyCount } = await supabase
      .from('parties')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', user.id);
    stats.totalParties.textContent = partyCount || 0;

    // Get party IDs for this host
    const { data: hostParties } = await supabase
      .from('parties')
      .select('id')
      .eq('host_id', user.id);
    
    const partyIds = hostParties?.map(p => p.id) || [];

    // Count active games for host's parties
    if (partyIds.length > 0) {
      const { count: gameCount } = await supabase
        .from('games')
        .select('id', { count: 'exact', head: true })
        .in('party_id', partyIds)
        .eq('status', 'open');
      stats.activeGames.textContent = gameCount || 0;

      // Count guests across host's parties
      const { count: guestCount } = await supabase
        .from('party_profiles')
        .select('user_id', { count: 'exact', head: true })
        .in('party_id', partyIds);
      stats.totalGuests.textContent = guestCount || 0;

      // Count pending mods for host's parties
      const { count: modCount } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .in('party_id', partyIds)
        .eq('moderation_status', 'pending');
      stats.pendingMods.textContent = modCount || 0;
    } else {
      stats.activeGames.textContent = '0';
      stats.totalGuests.textContent = '0';
      stats.pendingMods.textContent = '0';
    }
  }

  // Update stats on first load
  updateStats();
}

// Helper to show a section
function showSection(id) {
  const sections = qsa('.admin-main .section');
  sections.forEach(section => {
    section.hidden = section.id !== id;
  });
}

// Helper to update active nav link
function updateActiveNav(id) {
  const links = qsa('.admin-sidebar .nav-item');
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    const target = href.replace('#', '');
    if (target === id) link.classList.add('active');
    else link.classList.remove('active');
  });
}