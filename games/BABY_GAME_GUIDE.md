# Baby Guess Game - Enhancement Guide

## 🎮 What's New

The baby guess game has been upgraded from static photos to a **dynamic, database-driven experience**!

### ✨ Key Features

1. **Dynamic Data Loading**

   - Automatically fetches all baby photos from Supabase
   - Matches photos with About You profile data
   - No manual configuration needed

2. **Smart Hint Generation**

   - **Always shows**: Birth City + Zodiac Sign
   - **Plus**: One random interesting fact from About You answers
   - Examples: favorite movie, hidden talent, childhood dream, etc.

3. **Unseen Photo Tracking**

   - Game tracks which photos you've seen
   - Shows unseen photos first
   - Cycles through all photos before repeating
   - Toast notification when all photos viewed

4. **Enhanced UX**
   - Loading spinner while fetching from database
   - Error handling with friendly messages
   - Photo count display
   - Smooth transitions

## 🎯 How It Works

### Hint Strategy

Each photo shows **3 hints** (when available):

- 📍 Birth City (e.g., "Born in Karachi")
- ♈ Zodiac Sign (e.g., "♌ Leo")
- 🎬 Random Fact (e.g., "Loves: The Godfather")

### Photo Order

- **First**: All unseen photos (shuffled)
- **Then**: Previously seen photos (shuffled)
- **After full cycle**: Reset and start again

### Game Controls

- **SPACE**: Toggle reveal name
- **← →**: Previous/Next photo
- **A**: Toggle auto-reveal
- **S**: Shuffle (prioritizes unseen)
- **R**: Restart (resets all seen flags)
- **T/Y**: Decrease/Increase timer seconds

## 🔧 Technical Details

### Data Sources

- **Photos**: `submissions` table (game_type: 'baby_photo')
- **Profiles**: `party_profiles` table (extended_answers JSONB)
- **Matching**: By user_id

### Interesting Facts Used

The game randomly picks from:

- favorite_movie, favorite_book, favorite_food
- hidden_talent, bucket_list, childhood_dream
- favorite_vacation, guilty_pleasure, first_concert
- favorite_song, pet_peeve, morning_ritual

### Fallbacks

- If no birth city: skips that hint
- If no zodiac: skips that hint
- If no interesting facts: shows "Mystery guest"
- Hints truncated at 40 characters for readability

## 🚀 Usage

Simply open the game:

```
/games/baby-guess-game.html
```

The game will:

1. Show loading spinner
2. Fetch all approved baby photos
3. Match with profile data
4. Generate smart hints
5. Start auto-playing

No configuration needed - it's all automatic!

## 📊 Requirements

- Supabase connection (via `config/env.local.js`)
- Baby photos submitted to database
- Party profiles with extended_answers
- Approved submissions (moderation_status = 'approved')

## 🎨 Future Enhancements (Optional)

- [ ] Multiple choice mode (show 4 name options)
- [ ] Score tracking
- [ ] Leaderboard
- [ ] Progressive hints (start vague, get specific)
- [ ] Difficulty levels (easy/hard hints)
- [ ] Guess timer for competitive mode

---

**Party Slug**: `friendsgiving2025-1ty7`  
**Last Updated**: November 5, 2025
