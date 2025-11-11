# Dilwale Scavenger Hunt Game Guide

## Overview

Interactive scavenger hunt game with PDF display, timer, and host controls for managing the game experience.

## File Location

`games/scavenger-hunt.html`

## Features

### 1. **PDF Viewer**

- **Embedded Display:** Shows scavenger hunt sheet directly in browser
- **Fallback Support:** Downloads available if embedding not supported
- **Fullscreen Mode:** Click fullscreen button for large display
- **Print Friendly:** One-click print functionality

### 2. **Game Timer**

- **Customizable Duration:** 10, 15, 20, or 30 minutes
- **Live Countdown:** Real-time display in MM:SS format
- **Status Indicators:**
  - 🔴 Stopped (red)
  - ⏸ Paused (yellow)
  - ▶ Running (green)
- **Visual Alerts:** Timer turns red in final minute
- **Audio Alert:** Beep sound when time expires

### 3. **Host Controls**

#### Timer Management

- **Start:** Begin countdown
- **Pause:** Temporarily stop timer
- **Reset:** Return to initial duration
- **Set Duration:** Quick buttons for common times

#### Quick Actions

- **Download PDF:** Save scavenger hunt sheet
- **Print:** Direct print command
- **Fullscreen:** Maximize PDF view

### 4. **Host Instructions Panel**

Step-by-step guide for running the game:

1. Display PDF on main screen
2. Distribute to teams
3. Set timer duration
4. Start hunt
5. Monitor progress
6. Declare winners

### 5. **Tips Section**

Best practices for game management:

- Team formation (3-5 people)
- Set clear boundaries
- Award creativity bonuses
- Have prizes ready

## How to Use

### Setup

1. Open `games/scavenger-hunt.html`
2. PDF automatically loads in viewer
3. Share PDF with teams (download/print)

### During Game

1. Set timer duration (10-30 minutes)
2. Click "Start" to begin countdown
3. Monitor timer display
4. Teams search for items
5. Timer alerts when time's up

### Controls

- **← Menu** (top-left): Return to games menu
- **Timer buttons**: Start/Pause/Reset
- **Duration buttons**: Quick time presets
- **Download**: Save PDF locally
- **Print**: Print copies for teams
- **Fullscreen**: Large screen display

## Technical Details

### PDF Integration

```html
<iframe src="../../Downloads/Friendsgiving scavenger.pdf"></iframe>
```

**Optimizations:**

- Relative path from games/ folder
- Error handling with fallback display
- Cross-browser PDF support
- Mobile responsive iframe

### Timer System

- **Pure JavaScript** (no dependencies)
- **Interval-based countdown** (1 second updates)
- **State management:** stopped/running/paused
- **Visual feedback:** Color changes and status badges
- **Audio alert:** Web Audio API beep

### Features

✅ Embedded PDF viewer  
✅ Countdown timer  
✅ Host control panel  
✅ Download/print options  
✅ Fullscreen mode  
✅ Responsive design  
✅ Back to menu navigation  
✅ Keyboard shortcuts

## Keyboard Shortcuts

**From Host Menu:**

- `1` → Launch Scavenger Hunt
- `2` → Launch Baby Game
- `3` → Launch Family Feud

**From Waiting Screen:**

- `1` → Launch Scavenger Hunt

## File Structure

```
party/
├── games/
│   └── scavenger-hunt.html       ← Game page
└── Downloads/
    └── Friendsgiving scavenger.pdf ← PDF source
```

## Customization

### Change PDF Source

Update iframe src attribute:

```html
<iframe src="YOUR_PDF_PATH_HERE.pdf"></iframe>
```

### Adjust Timer Defaults

Modify JavaScript constants:

```javascript
let timerDuration = 15 * 60; // Change 15 to your default minutes
```

### Add More Duration Options

Add buttons in HTML:

```html
<button onclick="setTimerMinutes(45)">45</button>
```

## Best Practices

### For Hosts

1. **Test PDF display** before party
2. **Print backup copies** in case of tech issues
3. **Set clear rules** about search boundaries
4. **Prepare prizes** for winning team
5. **Have camera ready** for photo items

### For Teams

1. **3-5 people per team** works best
2. **Assign roles:** photographer, searcher, organizer
3. **Stay within boundaries**
4. **Be creative** with interpretations
5. **Have fun!**

## Troubleshooting

**PDF not displaying:**

- Check file path in iframe src
- Verify PDF exists in Downloads folder
- Try download button as fallback
- Some browsers block PDF embedding (use download)

**Timer not working:**

- Check JavaScript console for errors
- Refresh page and try again
- Ensure no browser extensions blocking scripts

**Fullscreen not working:**

- Some browsers require user gesture first
- Try clicking PDF viewer before fullscreen
- Use browser's native fullscreen (F11)

## Future Enhancements

- [ ] Team scoring system
- [ ] Item checklist integration
- [ ] Photo upload for items found
- [ ] Live leaderboard
- [ ] Multiple PDF support
- [ ] Custom timer sounds
- [ ] Game history tracking

## Integration

### Linked From

- **Host Menu** (`games-host-menu.html`) - Main game card
- **Waiting Screen** (`waiting-screen.html`) - Keyboard shortcut `1`

### Links To

- **Back to Menu** - Returns to host menu

## Design System

Consistent with Dilwale brand:

- **Colors:** Red (#dc2626), Orange (#f97316), Gold (#fbbf24)
- **Layout:** Two-column (PDF + Controls)
- **Responsive:** Stacks on mobile
- **Typography:** System fonts, tabular timer

## Contact

Dilwale Friendsgiving 2025
