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

    // Count parties
    const { data: parties } = await supabase
      .from('parties')
      .select('id', { count: 'exact', head: true });
    stats.totalParties.textContent = parties?.count || 0;

    // Count active games
    const { data: games } = await supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open');
    stats.activeGames.textContent = games?.count || 0;

    // Count guests
    const { data: guests } = await supabase
      .from('party_profiles')
      .select('user_id', { count: 'exact', head: true });
    stats.totalGuests.textContent = guests?.count || 0;

    // Count pending mods
    const { data: mods } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('moderation_status', 'pending');
    stats.pendingMods.textContent = mods?.count || 0;
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