/**
 * About You Extended - Main Controller
 * Handles batch-based question progression, progress tracking, and saving
 */

import { supabase } from '../src/services/supabaseClient.js';
import {
  QUESTION_BATCHES,
  getBatch,
  calculateProgress,
  getNextBatch,
  isBatchLocked
} from './questions-config.js';
import {
  renderBatchQuestions,
  bindQuestionHandlers,
  extractAnswers,
  validateBatch
} from './question-renderer.js';

const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

let currentState = {
  partyId: null,
  userId: null,
  profileData: null,
  currentBatch: null,
  answers: {}
};

/**
 * Initialize the About You extended experience
 */
export async function initAboutYouExtended(partyId, userId) {
  console.log('[AboutYouExtended] Initializing', { partyId, userId });
  
  currentState.partyId = partyId;
  currentState.userId = userId;
  
  // Load existing profile data
  await loadProfileData();
  
  // Determine which view to show
  if (!currentState.profileData || !currentState.profileData.display_name) {
    // Show basic info form first
    showBasicInfoForm();
  } else {
    // Show batch selector
    showBatchSelector();
  }
  
  // Wire up event handlers
  bindEventHandlers();
}

/**
 * Load existing profile data from database
 */
async function loadProfileData() {
  const { data, error } = await supabase
    .from('party_profiles')
    .select('*')
    .eq('party_id', currentState.partyId)
    .eq('user_id', currentState.userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('[AboutYouExtended] Error loading profile:', error);
    return;
  }
  
  currentState.profileData = data || {};
  currentState.answers = data?.extended_answers || {};
  
  console.log('[AboutYouExtended] Loaded profile:', currentState.profileData);
}

/**
 * Show basic info form (name + birthplace)
 */
function showBasicInfoForm() {
  const basicForm = qs('#basicInfoForm');
  const batchSelector = qs('#batchSelector');
  const progressOverview = qs('#profileProgressOverview');
  const firstTimeBanner = qs('#firstTimeBanner');
  
  if (basicForm) {
    basicForm.style.display = 'block';
    
    // Pre-fill if data exists
    if (currentState.profileData) {
      const displayNameInput = qs('#display_name');
      const birthCityInput = qs('#birth_city');
      
      if (displayNameInput && currentState.profileData.display_name) {
        displayNameInput.value = currentState.profileData.display_name;
      }
      if (birthCityInput && currentState.profileData.birth_city) {
        birthCityInput.value = currentState.profileData.birth_city;
      }
    }
  }
  
  if (batchSelector) batchSelector.style.display = 'none';
  if (progressOverview) progressOverview.style.display = 'none';
  if (firstTimeBanner) firstTimeBanner.style.display = 'block';
}

/**
 * Show batch selector with progress
 */
function showBatchSelector() {
  const basicForm = qs('#basicInfoForm');
  const batchSelector = qs('#batchSelector');
  const progressOverview = qs('#profileProgressOverview');
  const batchQuestionsForm = qs('#batchQuestionsForm');
  const firstTimeBanner = qs('#firstTimeBanner');
  
  if (basicForm) basicForm.style.display = 'none';
  if (batchQuestionsForm) batchQuestionsForm.style.display = 'none';
  if (batchSelector) batchSelector.style.display = 'block';
  if (progressOverview) progressOverview.style.display = 'block';
  if (firstTimeBanner) firstTimeBanner.style.display = 'none';
  
  updateBatchSelectorUI();
  updateProgressOverview();
}

/**
 * Update batch selector UI with current status
 */
function updateBatchSelectorUI() {
  const batchProgress = currentState.profileData?.batch_progress || {};
  
  QUESTION_BATCHES.forEach((batch, index) => {
    const card = qs(`.batch-card[data-batch="${batch.id}"]`);
    if (!card) return;
    
    const statusBadge = qs('.status-badge', card);
    const status = batchProgress[batch.id] || 'not_started';
    const locked = isBatchLocked(batch.id, batchProgress);
    
    // Update card state
    card.classList.remove('locked', 'complete');
    if (locked) {
      card.classList.add('locked');
      statusBadge.classList.add('locked');
      statusBadge.textContent = '🔒 Locked';
      statusBadge.dataset.status = 'locked';
    } else if (status === 'complete') {
      card.classList.add('complete');
      statusBadge.classList.remove('locked');
      statusBadge.textContent = '✓ Complete';
      statusBadge.dataset.status = 'complete';
    } else {
      statusBadge.classList.remove('locked');
      statusBadge.textContent = status === 'in_progress' ? 'Continue' : 'Start';
      statusBadge.dataset.status = status;
    }
  });
}

/**
 * Update overall progress overview
 */
function updateProgressOverview() {
  const batchProgress = currentState.profileData?.batch_progress || {};
  const progress = calculateProgress(batchProgress);
  
  const progressText = qs('#overallProgress');
  const progressBar = qs('#overallProgressBar');
  
  if (progressText) progressText.textContent = `${progress}%`;
  if (progressBar) progressBar.style.width = `${progress}%`;
}

/**
 * Show batch questions form
 */
function showBatchQuestionsForm(batchId) {
  const batchSelector = qs('#batchSelector');
  const batchQuestionsForm = qs('#batchQuestionsForm');
  const progressOverview = qs('#profileProgressOverview');
  
  if (batchSelector) batchSelector.style.display = 'none';
  if (progressOverview) progressOverview.style.display = 'none';
  if (batchQuestionsForm) batchQuestionsForm.style.display = 'block';
  
  currentState.currentBatch = batchId;
  renderBatchQuestionsView(batchId);
}

/**
 * Render questions for current batch
 */
function renderBatchQuestionsView(batchId) {
  const batch = getBatch(batchId);
  if (!batch) return;
  
  // Update header
  const titleEl = qs('#currentBatchTitle');
  const currentQuestionEl = qs('#currentQuestion');
  const totalQuestionsEl = qs('#totalQuestions');
  
  if (titleEl) titleEl.textContent = `${batch.emoji} ${batch.title}`;
  if (currentQuestionEl) currentQuestionEl.textContent = '1';
  if (totalQuestionsEl) totalQuestionsEl.textContent = batch.questions.length;
  
  // Render questions
  const container = qs('#questionsContainer');
  if (container) {
    container.innerHTML = renderBatchQuestions(batchId, currentState.answers);
    bindQuestionHandlers(container);
    updateBatchProgress();
  }
}

/**
 * Update batch progress bar
 */
function updateBatchProgress() {
  const batch = getBatch(currentState.currentBatch);
  if (!batch) return;
  
  const answeredCount = batch.questions.filter(q => currentState.answers[q.id]).length;
  const progress = (answeredCount / batch.questions.length) * 100;
  
  const progressBar = qs('#batchProgressBar');
  const currentQuestionEl = qs('#currentQuestion');
  
  if (progressBar) progressBar.style.width = `${progress}%`;
  if (currentQuestionEl) currentQuestionEl.textContent = answeredCount + 1;
}

/**
 * Bind all event handlers
 */
function bindEventHandlers() {
  // Basic info form submission
  const basicForm = qs('#basicInfoForm');
  if (basicForm) {
    basicForm.addEventListener('submit', handleBasicInfoSubmit);
  }
  
  // Batch card clicks
  const batchCards = qsa('.batch-card');
  batchCards.forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('locked')) return;
      const batchId = card.dataset.batch;
      showBatchQuestionsForm(batchId);
    });
  });
  
  // Back to batches button
  const backBtn = qs('#backToBatches');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showBatchSelector();
    });
  }
  
  // Complete batch button
  const batchForm = qs('#batchQuestionsForm');
  if (batchForm) {
    batchForm.addEventListener('submit', handleBatchSubmit);
  }
}

/**
 * Handle basic info form submission
 */
async function handleBasicInfoSubmit(e) {
  e.preventDefault();
  
  const displayName = qs('#display_name').value.trim();
  const whatsappNumberField = qs('#whatsapp_number');
  const whatsappNumber = whatsappNumberField ? whatsappNumberField.value.trim() : '';
  
  if (!displayName) {
    alert('Please enter your display name');
    return;
  }
  
  // Upsert profile (birth city will be added in batch 1)
  const { error } = await supabase
    .from('party_profiles')
    .upsert({
      party_id: currentState.partyId,
      user_id: currentState.userId,
      display_name: displayName,
      whatsapp_number: whatsappNumber || null,
      batch_progress: {},
      extended_answers: {}
    }, {
      onConflict: 'party_id,user_id'
    });
  
  if (error) {
    console.error('[AboutYouExtended] Error saving basic info:', error);
    alert('Failed to save. Please try again.');
    return;
  }
  
  // Reload profile and show batch selector
  await loadProfileData();
  showBatchSelector();
}

/**
 * Handle batch completion submission
 */
async function handleBatchSubmit(e) {
  e.preventDefault();
  
  const container = qs('#questionsContainer');
  const answers = extractAnswers(container);
  
  console.log('[AboutYouExtended] Extracted answers:', answers);
  
  // Validate required questions
  const validation = validateBatch(currentState.currentBatch, answers);
  if (!validation.valid) {
    alert(validation.message);
    return;
  }
  
  // Handle birth_city geocoding if this is batch_1
  if (currentState.currentBatch === 'batch_1' && answers.birth_city) {
    try {
      const geocodeResult = await geocodeCity(answers.birth_city);
      if (geocodeResult) {
        // Update profile with birth city coordinates
        await supabase
          .from('party_profiles')
          .update({
            birth_city: answers.birth_city,
            birth_lat: geocodeResult.lat,
            birth_lng: geocodeResult.lng
          })
          .eq('party_id', currentState.partyId)
          .eq('user_id', currentState.userId);
      }
    } catch (err) {
      console.warn('[AboutYouExtended] Geocoding failed:', err);
    }
  }
  
  // Handle baby photo upload if present - convert to base64
  if (answers.baby_photo_file) {
    const file = answers.baby_photo_file;
    
    // Convert to base64
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    try {
      const base64Data = await base64Promise;
      answers.baby_photo = base64Data; // Store base64 string
      delete answers.baby_photo_file;
    } catch (error) {
      console.error('[AboutYouExtended] Photo conversion error:', error);
      alert('Failed to process photo. Please try again.');
      return;
    }
  }
  
  // Merge with existing answers
  currentState.answers = { ...currentState.answers, ...answers };
  
  console.log('[AboutYouExtended] Merged answers:', currentState.answers);
  
  // Mark batch as complete
  const batchProgress = currentState.profileData?.batch_progress || {};
  batchProgress[currentState.currentBatch] = 'complete';
  
  console.log('[AboutYouExtended] Saving to DB:', {
    extended_answers: currentState.answers,
    batch_progress: batchProgress
  });
  
  // Save to database
  const { error } = await supabase
    .from('party_profiles')
    .update({
      extended_answers: currentState.answers,
      batch_progress: batchProgress
    })
    .eq('party_id', currentState.partyId)
    .eq('user_id', currentState.userId);
  
  if (error) {
    console.error('[AboutYouExtended] Error completing batch:', error);
    alert('Failed to save. Please try again.');
    return;
  }
  
  console.log('[AboutYouExtended] Batch saved successfully');
  
  // Get next batch for guidance
  const currentBatchIndex = QUESTION_BATCHES.findIndex(b => b.id === currentState.currentBatch);
  const nextBatch = QUESTION_BATCHES[currentBatchIndex + 1];
  
  // Check if all batches complete
  const allComplete = QUESTION_BATCHES.every(batch => batchProgress[batch.id] === 'complete');
  
  let completionMessage = '';
  
  if (allComplete) {
    // All batches complete - combined message
    completionMessage = `🎉 Congratulations! You've completed all About You questions.\n\n📸 Let's get your baby photo uploaded next.`;
  } else if (nextBatch) {
    // More batches to go
    completionMessage = `✓ ${getBatch(currentState.currentBatch).title} complete! Now let's do ${nextBatch.title}.`;
  } else {
    // Last batch completed
    completionMessage = `📸 ${getBatch(currentState.currentBatch).title} complete! Let's get your baby photo uploaded next.`;
  }
  
  alert(completionMessage);
  
  // Reload profile and show batch selector (or main screen if all complete)
  await loadProfileData();
  showBatchSelector();
  
  // Scroll to top of the page
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // If all complete, navigate to baby photo game
  if (allComplete) {
    // Dispatch event to refresh progress tracker
    window.dispatchEvent(new Event('submission-updated'));
    
    // Navigate to Baby Photo game after a short delay
    setTimeout(() => {
      const babyPhotoStep = document.querySelector('.progress-step[data-game-id="baby_photos"]');
      if (babyPhotoStep) {
        babyPhotoStep.click();
      }
    }, 800);
  }
}

/**
 * Geocode city helper (imported from main.js logic)
 */
async function geocodeCity(cityName) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`,
      { headers: { 'User-Agent': 'PartyApp/1.0' } }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
  } catch (err) {
    console.error('[geocodeCity] Error:', err);
  }
  return null;
}
