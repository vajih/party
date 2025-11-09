# Family Feud Complete Tournament

## 🎯 Overview

A complete 5-round Family Feud tournament game featuring:

- **Round 1:** Houston Restaurants 🍽️
- **Round 2:** Nashta (Breakfast) ☕
- **Round 3:** Dream Travel Destinations ✈️
- **Round 4:** TV Show Obsessions 📺
- **Round 5:** Celebrity Crushes 💖

## 🎮 How to Play

### Starting the Game

1. Open `games/family-feud-complete.html` in a browser
2. Click anywhere to enable sound
3. Watch the 14-second splash screen (or skip it)
4. Game begins on Round 1

### Team Setup

- **Spades & Clubs ♠️♣️** (Team 1)
- **Hearts & Diamonds ♥️♦️** (Team 2)
- Click on a team to make them active (they receive points for revealed answers)

### Gameplay

1. Click on answer slots to reveal them
2. Points are added to the **active team's score** AND the round score
3. Use "Add Strike ✗" button when a team gives a wrong answer
4. Switch teams by clicking on the team score cards
5. After revealing all answers, click "Next Round →" to advance

### Host Controls

#### Round Selector

- Click numbered buttons (1-5) at top-left to jump to any round
- Current round is highlighted in gold

#### Control Buttons

- **Add Strike ✗** - Adds a strike (3 strikes = game over)
- **Reveal All** - Reveals all answers with animation
- **Reset Round** - Clears the board but keeps tournament scores
- **Next Round →** - Advances to next round (appears when all answers revealed)
- **Finish Tournament 🏆** - Shows winner screen (appears on final round)

### Tournament Scoring

- Team scores **persist across all 5 rounds**
- Round score resets each round
- Final scores determine tournament winner

## 📊 Data Sources

The game pulls data from the `party_profiles.extended_answers` field:

| Round           | Data Field             | Example Values                  |
| --------------- | ---------------------- | ------------------------------- |
| Restaurants     | `food_desi_restaurant` | "Aga's", "Bismillah", "Lasbela" |
| Nashta          | `breakfast_nashta`     | "Paratha + Chai", "Halwa Puri"  |
| Travel          | `fav_city_travel`      | "Paris", "Dubai", "Tokyo"       |
| TV Shows        | `tv_obsession`         | "The Bear", "Succession"        |
| Celebrity Crush | `celebrity_crush_teen` | "Shah Rukh Khan", "Zendaya"     |

## 🎵 Sound Effects

The game includes:

- **Intro Music** - 14-second Family Feud theme on splash screen
- **Ding Sound** - When answers are revealed
- **Buzzer Sound** - When strikes are added
- **Intro Sound** - When round is reset

## 🏆 Winner Screen

After completing Round 5:

- Click "Finish Tournament 🏆"
- Winner is determined by total tournament score
- Shows trophy, winning team name, and final scores

## 🎨 Features

### Visual Polish

- ✅ Dilwale brand colors (red, orange, gold gradient)
- ✅ Animated answer reveals
- ✅ Team highlighting when active
- ✅ Round transition screens
- ✅ Professional game show aesthetic

### Scoring System

- ✅ Persistent tournament scores across rounds
- ✅ Per-round scoring
- ✅ Strike tracking (resets each round)
- ✅ Active team indicator

### Round Management

- ✅ Auto-detect all answers revealed
- ✅ Smooth transitions between rounds
- ✅ Manual round selection for hosts
- ✅ Round progress indicator

## 🔧 Configuration

Update the party slug in the script section:

```javascript
const PARTY_SLUG = "friendsgiving2025-1ty7"; // Change to your party slug
```

## 📝 Notes

- Requires `config/env.local.js` with Supabase credentials
- Uses Supabase to fetch survey data
- Top 8 answers per round
- Write-in answers (starting with "X:") are properly handled
- Normalization functions clean and standardize answers

## 🎯 Tips for Hosts

1. **Test before the party** - Make sure data is loading correctly
2. **Volume control** - Adjust sound volume in browser if needed
3. **Team switching** - Remember to click the team card before revealing answers
4. **Round jumping** - Use round selector if you want to skip around
5. **Reset carefully** - Reset Round only clears current round, not tournament scores

## 🐛 Troubleshooting

### No data loading

- Check that `config/env.local.js` exists
- Verify Supabase credentials
- Check party slug matches your party
- Open browser console (F12) for errors

### Sound not playing

- Click anywhere on the page first (browser autoplay policy)
- Check browser volume
- Verify sound files exist in `assets/sounds/`

### Scores not updating

- Make sure you clicked on a team to make them active
- Check browser console for errors

## 📱 Browser Compatibility

Tested on:

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari

## 🎉 Enjoy the Game!

Perfect for Friendsgiving, family reunions, or any party with survey data!
