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
        id: 'food_mango_supremacy',
        order: 3,
        kind: 'single_choice',
        prompt: 'Mango supremacy (top variety)',
        options: [
          { id: 'chaunsa', label: 'Chaunsa' },
          { id: 'anwar_ratol', label: 'Anwar Ratol' },
          { id: 'sindhri', label: 'Sindhri' },
          { id: 'langra', label: 'Langra' },
          { id: 'alphonso', label: 'Alphonso' },
          { id: 'whatever_ripe', label: '"Whatever\'s ripe!"' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'Which mango variety were you thinking?',
        category: 'food'
      },
      {
        id: 'food_comfort',
        order: 4,
        kind: 'single_choice',
        prompt: 'Comfort food (your first pick)',
        options: [
          { id: 'daal_chawal', label: 'Daal Chawal' },
          { id: 'aloo_gosht', label: 'Aloo Gosht + Naan' },
          { id: 'aloo_paratha', label: 'Aloo Paratha + Raita' },
          { id: 'nihari_paratha', label: 'Nihari + Paratha' },
          { id: 'biryani', label: 'Biryani (any style)' },
          { id: 'mcdonalds', label: "McDonald's burger & fries" },
          { id: 'halwa_puri', label: 'Halwa Puri' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What comfort food did you have in mind?',
        category: 'food'
      },
      {
        id: 'food_houston_halal',
        order: 5,
        kind: 'single_choice',
        prompt: 'Houston-area bonus: best late-night halal fix',
        options: [
          { id: 'agas', label: "Aga's" },
          { id: 'bismillah', label: 'Bismillah' },
          { id: 'lasbela', label: 'Lasbela' },
          { id: 'tempura', label: 'Tempura' },
          { id: 'himalaya', label: 'Himalaya' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'Which spot were you thinking?',
        category: 'food'
      },
      {
        id: 'food_midnight_snack',
        order: 6,
        kind: 'single_choice',
        prompt: 'Midnight "guilty-pleasure" desi snack',
        options: [
          { id: 'bun_kebab', label: 'Bun Kebab' },
          { id: 'fry_unda_paratha', label: 'Fry unda - Paratha Roll' },
          { id: 'chai_biscuits', label: 'Chai & Biscuits' },
          { id: 'pakora', label: 'Pakora' },
          { id: 'leftover_biryani', label: 'Leftover Biryani' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What midnight snack were you thinking?',
        category: 'food'
      },
      {
        id: 'drink_chai_coffee',
        order: 7,
        kind: 'either_or',
        prompt: 'Morning: Chai or Coffee',
        options: [
          { id: 'A', label: 'Chai' },
          { id: 'B', label: 'Coffee' }
        ],
        required: true,
        flags: { allow_both: true, allow_neither: true },
        category: 'drink'
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
        id: 'zodiac_sign',
        order: 8,
        kind: 'dropdown',
        prompt: "What's your zodiac?",
        options: [
          { id: 'aries', label: 'Aries' },
          { id: 'taurus', label: 'Taurus' },
          { id: 'gemini', label: 'Gemini' },
          { id: 'cancer', label: 'Cancer' },
          { id: 'leo', label: 'Leo' },
          { id: 'virgo', label: 'Virgo' },
          { id: 'libra', label: 'Libra' },
          { id: 'scorpio', label: 'Scorpio' },
          { id: 'sagittarius', label: 'Sagittarius' },
          { id: 'capricorn', label: 'Capricorn' },
          { id: 'aquarius', label: 'Aquarius' },
          { id: 'pisces', label: 'Pisces' }
        ],
        required: true,
        category: 'personality'
      },
      {
        id: 'remedy_desi_mom',
        order: 13,
        kind: 'single_choice',
        prompt: 'A classic desi mom cure-all',
        options: [
          { id: 'haldi_doodh', label: 'Haldi Doodh' },
          { id: 'ajwain', label: 'Ajwain' },
          { id: 'adrak_honey', label: 'Adrak and Honey' },
          { id: 'johar_joshanda', label: 'Johar Joshanda' },
          { id: 'vicks_steam', label: 'Vicks & Steam Inhalation' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What remedy were you thinking?',
        category: 'nostalgia'
      },
      {
        id: 'smuggled_pakistan',
        order: 14,
        kind: 'single_choice',
        prompt: 'What gets "smuggled" from Pakistan in suitcases',
        options: [
          { id: 'achar', label: 'Achar' },
          { id: 'desi_joray', label: 'Desi Joray' },
          { id: 'nimko_snacks', label: 'Nimko/Snacks' },
          { id: 'seeds', label: 'Seeds' },
          { id: 'mithai', label: 'Mithai' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What do you bring back?',
        category: 'nostalgia'
      },
      {
        id: 'auntie_analyze',
        order: 15,
        kind: 'single_choice',
        prompt: 'What aunties most love to analyze',
        options: [
          { id: 'outfits', label: 'Outfits' },
          { id: 'weight', label: 'Weight' },
          { id: 'who_brought_what', label: 'Who Brought What Dish' },
          { id: 'jewelry', label: 'Jewelry/Diamonds' },
          { id: 'home_decor', label: 'Home Décor' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What else do aunties analyze?',
        category: 'nostalgia'
      },
      {
        id: 'desi_dad_line',
        order: 16,
        kind: 'single_choice',
        prompt: 'A line every desi dad has said',
        options: [
          { id: 'money_trees', label: '"Money Doesn\'t Grow on Trees"' },
          { id: 'lights_off', label: '"Lights Off Karo"' },
          { id: 'back_in_my_day', label: '"Back in My Day…"' },
          { id: 'petrol', label: '"Petrol Kahan Se Aata Hai?"' },
          { id: 'ask_mother', label: '"Ask Your Mother"' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What other classic dad line?',
        category: 'nostalgia'
      },
      {
        id: 'relative_weight_comment',
        order: 17,
        kind: 'single_choice',
        prompt: 'Relative\'s go-to comment after you gain 5 lbs',
        options: [
          { id: 'healthy_lag_rahe', label: '"Healthy Lag Rahe Ho"' },
          { id: 'diet_karo', label: '"Diet Kar Lo"' },
          { id: 'mashallah', label: '"Mashallah!"' },
          { id: 'gym_kab', label: '"Gym Kab Jaoge?"' },
          { id: 'kaam_mat_karo', label: '"Itna Kaam Mat Karo"' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What else do they say?',
        category: 'nostalgia'
      },
      {
        id: 'mehndi_drama',
        order: 18,
        kind: 'single_choice',
        prompt: 'Typical mehndi drama topic',
        options: [
          { id: 'who_performs_first', label: 'Who Performs First' },
          { id: 'matching_outfits', label: 'Matching Outfits Clash' },
          { id: 'dj_volume', label: 'DJ Volume' },
          { id: 'stage_lineup', label: 'Stage lineup' },
          { id: 'stage_photos', label: 'Stage Photos' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What other mehndi drama?',
        category: 'nostalgia'
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
        id: 'tsa_luggage',
        order: 10,
        kind: 'single_choice',
        prompt: 'What TSA side-eyes in your luggage',
        options: [
          { id: 'tea_bags', label: 'Everyday & Tapal Tea Bags' },
          { id: 'spice_packets', label: 'Spice Packets Galore' },
          { id: 'supari', label: 'Shahi Supari Roll' },
          { id: 'henna', label: 'Henna Cones' },
          { id: 'achar', label: 'Achar Jar' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What else raises TSA eyebrows?',
        category: 'travel'
      },
      {
        id: 'reunion_brag',
        order: 18,
        kind: 'single_choice',
        prompt: "Auntie's RSVP minutes before the event",
        options: [
          { id: 'five_mins', label: '"Five Minutes Away"' },
          { id: 'on_road', label: '"On the Road"' },
          { id: 'leaving_now', label: '"Leaving Now"' },
          { id: 'send_address', label: '"Send Address Again?"' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What else does auntie say?',
        category: 'nostalgia'
      },
      {
        id: 'couple_photo_prep',
        order: 19,
        kind: 'single_choice',
        prompt: 'What people do before posting couple photos',
        options: [
          { id: 'crop_someone', label: 'Crop someone out' },
          { id: 'check_partner', label: 'Check with partner' },
          { id: 'filter_smooth', label: 'Filter + smooth' },
          { id: 'caption_consult', label: 'Caption consult with friend' },
          { id: 'hide_ring', label: 'Hide ring hand' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What else do they do?',
        category: 'values'
      },
      {
        id: 'culture_marriage_love_arranged',
        order: 20,
        kind: 'either_or',
        prompt: 'Love or arranged marriage?',
        options: [
          { id: 'A', label: 'Love marriage' },
          { id: 'B', label: 'Arranged marriage' }
        ],
        required: false,
        flags: { allow_both: true, allow_neither: true },
        aggregate_only: true,
        category: 'culture'
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
