/**
 * About You Questions Configuration
 * 20 questions organized into 3 batches for progressive completion
 */

export const QUESTION_BATCHES = [
  {
    id: 'batch_1',
    title: 'Fun Favorites',
    description: 'Quick questions about Pakistani food, music, and culture',
    emoji: '🎉',
    estimatedTime: '2 min',
    questions: [
      {
        id: 'food_pulao_biryani',
        order: 1,
        kind: 'either_or',
        prompt: 'Pulao vs Biryani',
        options: [
          { id: 'A', label: 'Pulao' },
          { id: 'B', label: 'Biryani' }
        ],
        required: true,
        flags: { allow_both: true, allow_neither: true },
        category: 'food'
      },
      {
        id: 'food_nihari_haleem',
        order: 2,
        kind: 'either_or',
        prompt: 'Nihari vs Haleem',
        options: [
          { id: 'A', label: 'Nihari' },
          { id: 'B', label: 'Haleem' }
        ],
        required: true,
        flags: { allow_both: true, allow_neither: true },
        category: 'food'
      },
      {
        id: 'food_mango_chaunsa_anwar',
        order: 3,
        kind: 'either_or',
        prompt: 'Mango: Chaunsa vs Anwar Ratol',
        options: [
          { id: 'A', label: 'Chaunsa' },
          { id: 'B', label: 'Anwar Ratol' }
        ],
        required: true,
        flags: { allow_both: true, allow_neither: true },
        category: 'food'
      },
      {
        id: 'drink_roohafza_jameshirin',
        order: 4,
        kind: 'either_or',
        prompt: 'Rooh Afza vs Jam-e-Shirin',
        options: [
          { id: 'A', label: 'Rooh Afza' },
          { id: 'B', label: 'Jam-e-Shirin' }
        ],
        required: true,
        flags: { allow_both: true, allow_neither: true },
        category: 'drink'
      },
      {
        id: 'games_carrom_ludo',
        order: 5,
        kind: 'either_or',
        prompt: 'Carrom vs Ludo',
        options: [
          { id: 'A', label: 'Carrom' },
          { id: 'B', label: 'Ludo' }
        ],
        required: true,
        flags: { allow_both: true, allow_neither: true },
        category: 'nostalgia'
      },
      {
        id: 'music_vitalsigns_junoon',
        order: 6,
        kind: 'either_or',
        prompt: 'Vital Signs vs Junoon',
        options: [
          { id: 'A', label: 'Vital Signs' },
          { id: 'B', label: 'Junoon' }
        ],
        required: true,
        flags: { allow_both: true, allow_neither: true },
        category: 'music'
      },
      {
        id: 'qawwali_nusrat_sabri',
        order: 7,
        kind: 'either_or',
        prompt: 'Nusrat Fateh Ali Khan vs Sabri Brothers',
        options: [
          { id: 'A', label: 'Nusrat Fateh Ali Khan' },
          { id: 'B', label: 'Sabri Brothers' }
        ],
        required: true,
        flags: { allow_both: true, allow_neither: true },
        category: 'music'
      }
    ]
  },
  {
    id: 'batch_2',
    title: 'Know Yourself',
    description: 'Personality traits and preferences',
    emoji: '🧠',
    estimatedTime: '2 min',
    questions: [
      {
        id: 'tv_4way_classics',
        order: 8,
        kind: 'single_choice',
        prompt: 'Pick your favorite Pakistani TV classic',
        options: [
          { id: 'A', label: 'Alpha Bravo Charlie' },
          { id: 'B', label: 'Sunehray Din' },
          { id: 'C', label: 'Dhoop Kinare' },
          { id: 'D', label: 'Tanhaiyaan' }
        ],
        required: true,
        category: 'nostalgia'
      },
      {
        id: 'mbti_travel_plan_wander',
        order: 13,
        kind: 'either_or',
        prompt: 'When traveling, do you prefer...',
        options: [
          { id: 'A', label: 'Planned itinerary' },
          { id: 'B', label: 'Wander and discover' }
        ],
        required: false,
        flags: { allow_both: false, allow_neither: true },
        category: 'personality',
        dimension: 'J/P'
      },
      {
        id: 'mbti_day_plan_options',
        order: 14,
        kind: 'either_or',
        prompt: 'For your day, you prefer...',
        options: [
          { id: 'A', label: 'A clear plan & checklist' },
          { id: 'B', label: 'Keeping options open' }
        ],
        required: false,
        flags: { allow_both: false, allow_neither: true },
        category: 'personality',
        dimension: 'J/P'
      },
      {
        id: 'mbti_problem_old_new',
        order: 15,
        kind: 'either_or',
        prompt: 'When solving a problem, you lean toward...',
        options: [
          { id: 'A', label: "What's worked before" },
          { id: 'B', label: 'Try a new approach' }
        ],
        required: false,
        flags: { allow_both: false, allow_neither: true },
        category: 'personality',
        dimension: 'S/N'
      },
      {
        id: 'mbti_decisions_head_heart',
        order: 16,
        kind: 'either_or',
        prompt: 'In decisions, you value...',
        options: [
          { id: 'A', label: 'Head/logic first' },
          { id: 'B', label: 'Heart/people first' }
        ],
        required: false,
        flags: { allow_both: false, allow_neither: true },
        category: 'personality',
        dimension: 'T/F'
      },
      {
        id: 'mbti_party_social',
        order: 17,
        kind: 'either_or',
        prompt: 'At a party, you usually...',
        options: [
          { id: 'A', label: 'Meet many new people' },
          { id: 'B', label: 'Stick with a small circle' }
        ],
        required: false,
        flags: { allow_both: false, allow_neither: true },
        category: 'personality',
        dimension: 'E/I'
      },
      {
        id: 'fav_english_band',
        order: 9,
        kind: 'short_text',
        prompt: 'Favorite English band or artist',
        placeholder: 'e.g., U2, Coldplay, The Beatles',
        required: false,
        category: 'music'
      }
    ]
  },
  {
    id: 'batch_3',
    title: 'Deeper Reflections',
    description: 'Values, travel, and personal preferences',
    emoji: '💭',
    estimatedTime: '2 min',
    questions: [
      {
        id: 'fav_city_travel',
        order: 12,
        kind: 'short_text',
        prompt: 'Favorite city for travel',
        placeholder: 'e.g., Istanbul, Paris, Tokyo',
        required: false,
        category: 'travel'
      },
      {
        id: 'fav_actor_90s',
        order: 10,
        kind: 'single_choice',
        prompt: "'90s crush (actor)",
        options: [
          { id: 'A', label: 'Amitabh' },
          { id: 'B', label: 'Shah Rukh' },
          { id: 'C', label: 'Salman' },
          { id: 'D', label: 'Aamir' },
          { id: 'E', label: 'Hrithik' },
          { id: 'X', label: 'Other', write_in: true }
        ],
        required: false,
        aggregate_only: true,
        category: 'film'
      },
      {
        id: 'fav_actress_90s',
        order: 11,
        kind: 'single_choice',
        prompt: "'90s crush (actress)",
        options: [
          { id: 'A', label: 'Raveena' },
          { id: 'B', label: 'Karisma' },
          { id: 'C', label: 'Kajol' },
          { id: 'D', label: 'Kareena' },
          { id: 'E', label: 'Preity' },
          { id: 'X', label: 'Other', write_in: true }
        ],
        required: false,
        aggregate_only: true,
        category: 'film'
      },
      {
        id: 'gift_love_notes_surprise',
        order: 18,
        kind: 'either_or',
        prompt: 'Prefer giving...',
        options: [
          { id: 'A', label: 'Love notes' },
          { id: 'B', label: 'Surprise gifts' }
        ],
        required: false,
        flags: { allow_both: true, allow_neither: true },
        category: 'values'
      },
      {
        id: 'civic_charity_vs_volunteer',
        order: 19,
        kind: 'either_or',
        prompt: 'Prefer to...',
        options: [
          { id: 'A', label: 'Give Charity' },
          { id: 'B', label: 'Volunteer Time' }
        ],
        required: false,
        flags: { allow_both: true, allow_neither: true },
        category: 'values'
      },
      {
        id: 'culture_marriage_love_arranged',
        order: 20,
        kind: 'either_or',
        prompt: 'Your view on marriage...',
        options: [
          { id: 'A', label: 'Love marriage' },
          { id: 'B', label: 'Arranged marriage' }
        ],
        required: false,
        flags: { allow_both: true, allow_neither: true },
        sensitive: true,
        aggregate_only: true,
        category: 'culture',
        helpText: '🔒 Your answer is completely private'
      }
    ]
  }
];

/**
 * Get batch by ID
 */
export function getBatch(batchId) {
  return QUESTION_BATCHES.find(b => b.id === batchId);
}

/**
 * Get all questions flattened
 */
export function getAllQuestions() {
  return QUESTION_BATCHES.flatMap(batch => batch.questions);
}

/**
 * Calculate overall completion percentage
 */
export function calculateProgress(batchProgress = {}) {
  const totalBatches = QUESTION_BATCHES.length;
  const completedBatches = Object.values(batchProgress).filter(status => status === 'complete').length;
  return Math.round((completedBatches / totalBatches) * 100);
}

/**
 * Get next incomplete batch
 */
export function getNextBatch(batchProgress = {}) {
  return QUESTION_BATCHES.find(batch => batchProgress[batch.id] !== 'complete');
}

/**
 * Check if batch is locked (previous batch not complete)
 */
export function isBatchLocked(batchId, batchProgress = {}) {
  const batchIndex = QUESTION_BATCHES.findIndex(b => b.id === batchId);
  if (batchIndex === 0) return false; // First batch always unlocked
  
  // Check if all previous batches are complete
  for (let i = 0; i < batchIndex; i++) {
    if (batchProgress[QUESTION_BATCHES[i].id] !== 'complete') {
      return true;
    }
  }
  return false;
}
