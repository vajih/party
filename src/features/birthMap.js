/**
 * Birth City Map Component
 * Shows a world map with markers for guest birth cities
 * Unlocked only after the user submits their own birth city
 */

import { supabase } from '../services/supabaseClient.js';

/**
 * Initialize the birth map for a party
 * @param {string} partyId - The party ID
 * @param {string} userId - The current user ID
 * @param {string} containerId - DOM element ID to render the map into
 */
export async function initBirthMap(partyId, userId, containerId = 'birthMap') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('[birthMap] Container not found:', containerId);
    return;
  }

  // Check if user has submitted their birth city
  const hasSubmitted = await hasUserSubmittedBirthCity(partyId, userId);
  
  if (!hasSubmitted) {
    // Show locked state
    container.innerHTML = `
      <div class="birth-map-locked">
        <div class="lock-icon">🔒</div>
        <h3>Where is Everyone From?</h3>
        <p>Unlock this interactive map by completing the "About You" activity and sharing your birth city!</p>
        <button class="link primary" onclick="
          const aboutYouStep = document.querySelector('.progress-step[data-game-id]');
          if (aboutYouStep) aboutYouStep.click();
        ">
          Complete About You to Unlock →
        </button>
      </div>
    `;
    return;
  }

  // Fetch birth points data
  const birthPoints = await fetchBirthPoints(partyId);
  
  if (!birthPoints || birthPoints.length === 0) {
    container.innerHTML = `
      <div class="birth-map-empty">
        <div class="icon">🌍</div>
        <p>No birth cities submitted yet. Be the first!</p>
      </div>
    `;
    return;
  }

  // Render the map
  renderBirthMap(container, birthPoints);
  
  // Listen for updates
  window.addEventListener('birth-map-updated', async () => {
    console.log('[birthMap] Received update event, refreshing...');
    const updatedPoints = await fetchBirthPoints(partyId);
    renderBirthMap(container, updatedPoints);
  });
}

/**
 * Render the Leaflet map with birth city markers
 */
function renderBirthMap(container, birthPoints) {
  // Clear container
  container.innerHTML = `
    <div class="birth-map-header">
      <h3>🌍 Where We're All From</h3>
      <p class="muted">${birthPoints.length} ${birthPoints.length === 1 ? 'city' : 'cities'} represented</p>
    </div>
    <div id="leafletMap" style="height: 400px; border-radius: 12px; overflow: hidden;"></div>
  `;

  // Wait for Leaflet to be available
  if (typeof L === 'undefined') {
    console.error('[birthMap] Leaflet not loaded');
    container.innerHTML = '<p class="error">Map library not loaded. Please refresh the page.</p>';
    return;
  }

  // Initialize Leaflet map
  const map = L.map('leafletMap').setView([20, 0], 2);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  // Add markers with scaled circles
  const maxCount = Math.max(...birthPoints.map(p => p.count));
  
  birthPoints.forEach(point => {
    const { birth_city, birth_lat, birth_lng, count } = point;
    
    if (!birth_lat || !birth_lng) return;
    
    // Scale radius based on count (5-25px range)
    const radius = 5 + (count / maxCount) * 20;
    
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
    const plural = count === 1 ? 'guest' : 'guests';
    circle.bindPopup(`
      <div class="map-popup">
        <strong>${birth_city || 'Unknown'}</strong><br>
        <span class="muted">${count} ${plural}</span>
      </div>
    `);
  });

  // Fit map to show all markers
  if (birthPoints.length > 0) {
    const bounds = birthPoints
      .filter(p => p.birth_lat && p.birth_lng)
      .map(p => [p.birth_lat, p.birth_lng]);
    
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}

/**
 * Check if user has submitted their birth city
 */
async function hasUserSubmittedBirthCity(partyId, userId) {
  try {
    const { data, error } = await supabase
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
 * Fetch birth points data from database
 */
async function fetchBirthPoints(partyId) {
  try {
    const { data, error } = await supabase
      .rpc('party_birth_points', { p_party_id: partyId });
    
    if (error) {
      console.error('[fetchBirthPoints] Error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[fetchBirthPoints] Error:', error);
    return [];
  }
}
