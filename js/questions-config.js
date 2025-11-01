/**
 * About You Questions Configuration
 * 21 questions organized into 3 batches for progressive completion
 */

export const QUESTION_BATCHES = [
  {
    id: 'batch_1',
    title: 'Fun Favorites',
    description: 'Pakistani food, music & culture',
    emoji: '🎉',
    estimatedTime: '2 min',
    questions: [
      {
        id: 'birth_city',
        order: 0,
        kind: 'short_text',
        prompt: 'City where you were born',
        placeholder: 'e.g., Karachi, Lahore, Houston',
        required: true,
        category: 'personal'
      },
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
        flags: { allow_both: true, allow_neither: true, allow_dont_know: true },
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
        write_in_placeholder: 'What were you thinking?',
        category: 'food'
      },
      {
        id: 'food_desi_restaurant',
        order: 5,
        kind: 'single_choice',
        prompt: "When you're craving desi food, where do you go?",
        options: [
          { id: 'agas', label: "Aga's" },
          { id: 'bismillah', label: 'Bismillah' },
          { id: 'lasbela', label: 'Lasbela' },
          { id: 'tempura', label: 'Tempura' },
          { id: 'himalaya', label: 'Himalaya' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'Where were you thinking?',
        category: 'food'
      },
      {
        id: 'breakfast_nashta',
        order: 5,
        kind: 'single_choice',
        prompt: 'My most desired nashta is...',
        options: [
          { id: 'paratha_chai', label: 'Paratha + Chai' },
          { id: 'halwa_puri', label: 'Halwa Puri' },
          { id: 'nihari_naan', label: 'Nihari + Naan' },
          { id: 'omelette', label: 'Omelette' },
          { id: 'anda_paratha', label: 'Anda Paratha' },
          { id: 'cereal', label: 'Cereal (boring!)' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What nashta did you have in mind?',
        category: 'food'
      }
    ]
  },
  {
    id: 'batch_2',
    title: 'Know Yourself',
    description: 'Personality & preferences',
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
          { id: 'pisces', label: 'Pisces' },
          { id: 'idk', label: "I don't know" }
        ],
        required: true,
        category: 'personality'
      },
      {
        id: 'free_saturday',
        order: 11,
        kind: 'single_choice',
        prompt: 'You have a free Saturday (araam ka din). What sounds perfect?',
        options: [
          { id: 'solo_time', label: 'Solo time at home (ghar pe chill)' },
          { id: 'chai_friends', label: 'Chai with 1-2 close friends' },
          { id: 'group_hangout', label: 'Group hangout with the whole jamaat' },
          { id: 'big_party', label: 'Big party or shaadi-style event' },
          { id: 'spouse_mood', label: "Depends on my spouse's mizaaj (mood)" },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What were you thinking?',
        category: 'personality'
      },
      {
        id: 'araam_mode',
        order: 12,
        kind: 'single_choice',
        prompt: 'Ultimate araam mode?',
        options: [
          { id: 'pajamas_netflix', label: 'Pajamas + Netflix' },
          { id: 'daytime_nap', label: 'Daytime nap' },
          { id: 'chai_dawn', label: 'Chai and Dawn' },
          { id: 'no_plans', label: 'No plans weekend' },
          { id: 'phone_silent', label: 'Phone on silent' },
          { id: 'reading_book', label: 'Reading a book' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What araam mode were you thinking?',
        category: 'lifestyle'
      },
      {
        id: 'decision_style',
        order: 13,
        kind: 'single_choice',
        prompt: 'When making big decisions, you trust your...',
        options: [
          { id: 'dil', label: 'Dil (heart/gut feeling)' },
          { id: 'dimagh', label: 'Dimagh (logic and planning)' },
          { id: 'parents', label: 'What ammi/abbu said' },
          { id: 'mix', label: 'Mix of dil and dimagh' },
          { id: 'overthink', label: "I overthink until everyone's tired 😅" },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'How do you make decisions?',
        category: 'personality'
      },
      {
        id: 'communication_style',
        order: 14,
        kind: 'single_choice',
        prompt: 'When something bothers you, you usually...',
        options: [
          { id: 'direct', label: 'Seedha baat karte hain (say it directly)' },
          { id: 'hints', label: 'Drop hints aur intezaar (wait for them to notice)' },
          { id: 'vent_others', label: 'Doosron se vent (complain to others first)' },
          { id: 'avoid', label: 'Avoid - chup rehte hain' },
          { id: 'whatsapp_paragraph', label: 'Write a full paragraph WhatsApp message' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'How do you communicate?',
        category: 'personality'
      },
      {
        id: 'left_on_read',
        order: 15,
        kind: 'single_choice',
        prompt: 'When a close friend leaves you on read, you...',
        options: [
          { id: 'dont_notice', label: "Don't even notice (too busy living life)" },
          { id: 'dont_care', label: "Notice but don't care (they're probably busy)" },
          { id: 'follow_up', label: 'Send a follow-up "Hello?? 👀"' },
          { id: 'overthink', label: 'Overthink everything (kya galti ho gayi?)' },
          { id: 'double_text', label: 'Double/triple text until they respond' },
          { id: 'mental_notes', label: 'Take mental notes for later' },
          { id: 'wait', label: 'Wait for them to reach out first' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'How do you react?',
        category: 'personality'
      }
    ]
  },
  {
    id: 'batch_3',
    title: 'Deeper Reflections',
    description: 'Values, travel & more',
    emoji: '💭',
    estimatedTime: '3 min',
    questions: [
      {
        id: 'fav_city_travel',
        order: 12,
        kind: 'short_text',
        prompt: 'Favorite city for travel',
        placeholder: 'e.g., Istanbul, Paris, Tokyo',
        required: true,
        category: 'travel'
      },
      {
        id: 'travel_vibe',
        order: 13,
        kind: 'single_choice',
        prompt: "What's your travel vibe?",
        options: [
          { id: 'luxury_resort', label: 'Luxury resort' },
          { id: 'budget_backpacker', label: 'Budget backpacker' },
          { id: 'cultural_explorer', label: 'Cultural explorer' },
          { id: 'beach_bum', label: 'Beach bum' },
          { id: 'city_hopper', label: 'City hopper' },
          { id: 'road_tripper', label: 'Road tripper' },
          { id: 'staycation', label: 'Staycation lover' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What travel vibe were you thinking?',
        category: 'travel'
      },
      {
        id: 'smuggled_pakistan',
        order: 15,
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
        id: 'desi_party_personality',
        order: 20,
        kind: 'single_choice',
        prompt: 'Your desi party personality?',
        options: [
          { id: 'first_last', label: 'First to arrive, last to leave' },
          { id: 'fashionably_late', label: 'Fashionably late (always)' },
          { id: 'khana_only', label: 'Shows up for khana only' },
          { id: 'photographer', label: 'The photographer/Insta story maker' },
          { id: 'corner_hiding', label: 'Corner mein hiding with one friend' },
          { id: 'dance_floor', label: 'Dance floor pe jab koi nahi dekh raha' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What party personality were you thinking?',
        category: 'social'
      },
      {
        id: 'celebrity_crush_teen',
        order: 19,
        kind: 'short_text',
        prompt: 'When I was a teenager my celebrity crush was?',
        placeholder: 'e.g., Shah Rukh Khan, Zendaya',
        required: true,
        category: 'entertainment'
      },
      {
        id: 'tv_obsession',
        order: 21,
        kind: 'short_text',
        prompt: 'Current TV obsession?',
        placeholder: 'e.g., The Bear, Succession',
        required: true,
        category: 'entertainment'
      },
      {
        id: 'reading_vibe',
        order: 22,
        kind: 'single_choice',
        prompt: 'Current reading vibe?',
        options: [
          { id: 'book_title', label: 'Book title: ___ (write-in)', write_in: true },
          { id: 'audiobooks', label: 'Audiobooks are my thing' },
          { id: 'social_media', label: 'Social media is my library' },
          { id: 'tiktok', label: "I don't read, I just TikTok" },
          { id: 'netflix_subtitles', label: 'Subtitles on Netflix' },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What are you reading?',
        category: 'entertainment'
      },
      {
        id: 'music_vibe',
        order: 22,
        kind: 'single_choice',
        prompt: 'Your music vibe?',
        options: [
          { id: 'desi_bangers', label: 'Desi bangers' },
          { id: 'nineties_nostalgia', label: '90s nostalgia' },
          { id: 'pop_hits', label: 'Pop hits' },
          { id: 'rnb_hiphop', label: 'R&B/Hip-Hop' },
          { id: 'rock_alternative', label: 'Rock/Alternative' },
          { id: 'classical_ghazals', label: 'Classical/Ghazals' },
          { id: 'trending', label: "Whatever's trending" },
          { id: 'other', label: 'Other', write_in: true }
        ],
        required: true,
        write_in_placeholder: 'What music vibe were you thinking?',
        category: 'entertainment'
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
        required: true,
        flags: { allow_both: true, allow_neither: true },
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
