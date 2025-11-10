# Dilwale Games Host Menu

## Overview

Central hub for the host to navigate between all party games. Clean, professional interface with subtle controls.

## File Locations

- **Host Menu:** `games-host-menu.html` (root directory)
- **Waiting Screen:** `waiting-screen.html` (root directory)

## Features

### 1. **Waiting Screen** 🆕

Full-screen Dilwale logo display for pre-party seating:

- **File:** `waiting-screen.html`
- **Purpose:** Display while guests are being seated
- **Features:**
  - Full-screen centered logo
  - Animated glow effect
  - Subtle sparkle animations
  - Radial gradient background
  - Keyboard shortcuts:
    - `M` → Go to Games Menu
    - `SPACE` or `ENTER` → Start (go to menu)
    - `2` → Quick launch Baby Game
    - `3` → Quick launch Family Feud
- **Link:** Accessible from footer of Host Menu

### 2. **Hero Dilwale Logo**

- Large centered logo with drop shadow
- Subtle hover animation
- Sets the party brand tone

### 2. **Game Cards**

Three game cards displayed in responsive grid:

#### a) **Scavenger Hunt** 🚧

- **Status:** Coming Soon (disabled)
- **Logo:** `dilwale_scavenger_logo.png`
- **Click:** Shows "under development" alert
- **Visual:** Grayed out, non-clickable

#### b) **Baby Photo Game** ✅

- **Status:** Live
- **Logo:** `dilwale_baby_game_logo.png`
- **Link:** `games/baby-guess-game.html`
- **Green status badge**

#### c) **Family Feud Tournament** ✅

- **Status:** Live
- **Logo:** `dilwale-family-feud.png`
- **Link:** `games/family-feud-complete.html`
- **Green status badge**

### 3. **Navigation**

- **From games back to menu:** Click "← Menu" button (top-left)
- **Keyboard shortcut:** Press `H` from any game to return (coming soon)

### 4. **Responsive Design**

- Desktop: 3-column grid
- Tablet: 2-column grid
- Mobile: Single column

## Design System

### Colors (Dilwale Brand)

```css
--brand-red: #dc2626
--brand-orange: #f97316
--brand-gold: #fbbf24
```

### Visual Hierarchy

1. **Primary:** Hero logo (largest)
2. **Secondary:** Game cards with logos
3. **Tertiary:** Status badges and menu title
4. **Footer:** Subtle host control panel text

### Animations

- **Page load:** Fade-in with scale
- **Hover:** Card lift + glow effect
- **Logo hover:** Scale + enhanced shadow

## Usage

### For Hosts:

1. Open `games-host-menu.html` on display screen
2. Click any **Live** game to launch
3. Use "← Menu" button to return
4. Coming Soon games show development alert

### Adding New Games:

1. Add game logo to `assets/img/`
2. Create game HTML in `games/` folder
3. Add new game card in `games-host-menu.html`:

```html
<a href="./games/your-game.html" class="game-card">
  <img
    src="./assets/img/your_game_logo.png"
    alt="Your Game"
    class="game-logo"
  />
  <h3 class="game-title">Your Game Title</h3>
  <span class="game-status live">● Live</span>
</a>
```

4. Add "Back to Menu" button to your game (see Family Feud example)

## Best Practices

### Host Control

- Menu is subtle and non-intrusive
- Designed to run on separate display from guest view
- Quick navigation between games

### Guest Experience

- Guests never see the menu
- Games run full-screen
- Host switches games seamlessly

## File Structure

```
party/
├── games-host-menu.html          ← Host homepage
├── assets/
│   └── img/
│       ├── dilwale_logo.png
│       ├── dilwale_scavenger_logo.png
│       ├── dilwale_baby_game_logo.png
│       └── dilwale-family-feud.png
└── games/
    ├── baby-guess-game.html      ← Baby photo game
    ├── family-feud-complete.html ← Family Feud
    └── (scavenger-hunt.html)     ← Coming soon
```

## Technical Notes

### Performance

- All images preloaded
- Minimal JavaScript (< 20 lines)
- Fast load time
- No external dependencies

### Browser Support

- Chrome/Edge (recommended)
- Safari
- Firefox
- Mobile browsers

### Accessibility

- High contrast text
- Large touch targets
- Keyboard navigation ready
- Screen reader friendly

## Future Enhancements

- [ ] Keyboard shortcut (H) to return home
- [ ] Game timer/duration tracking
- [ ] Live player count display
- [ ] Quick settings panel
- [ ] Game state persistence
- [ ] Admin authentication

## Quick Reference

### Host Workflow
1. **Pre-Party:** Open `waiting-screen.html` → Display while guests arrive
2. **Ready to Start:** Press `M` or `SPACE` → Go to games menu
3. **Select Game:** Click game card → Launch game
4. **During Game:** Use in-game controls
5. **Switch Games:** Click "← Menu" button → Return to menu
6. **End of Night:** Close browser

### Keyboard Shortcuts
**Waiting Screen:**
- `M` → Games menu
- `SPACE` or `ENTER` → Games menu
- `2` → Launch Baby Game
- `3` → Launch Family Feud

**From Any Game:**
- Click "← Menu" (top-left)

### URLs
- Waiting: `http://127.0.0.1:5502/waiting-screen.html`
- Menu: `http://127.0.0.1:5502/games-host-menu.html`
- Baby Game: `http://127.0.0.1:5502/games/baby-guess-game.html`
- Family Feud: `http://127.0.0.1:5502/games/family-feud-complete.html`

## Troubleshooting

**Games don't load:**

- Check file paths in href attributes
- Verify Supabase config loaded

**Logo not showing:**

- Verify image paths in `assets/img/`
- Check console for 404 errors

**Back button not working:**

- Verify relative path: `../games-host-menu.html`
- Check from games/ subdirectory

## Contact

Dilwale Friendsgiving 2025
