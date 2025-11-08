# Family Feud Sound Effects Setup Guide

## Overview

The Family Feud game needs 4 sound files to work properly. Follow these steps to download and add them to your project.

## Required Sound Files

### 1. Intro Music (Family Feud Theme - 20 seconds)

- **Name on MyInstants:** "Family Feud Theme" or "Family Feud Intro"
- **Save as:** `family-intro.mp3`
- **Used for:** 20-second splash screen music (plays continuously even if splash is skipped)
- **Duration:** Should be ~20 seconds long
- **URL:** Search for "Family Feud Theme" on MyInstants or YouTube

### 2. Short Intro Sound (Family Feud 2)

- **Name on MyInstants:** "Family Feud 2"
- **Save as:** `feud-intro.mp3`
- **Used for:** Quick intro sound effect (backup/alternative)
- **URL:** https://www.myinstants.com/en/instant/family-feud-2-25347/

### 3. Correct Answer Sound (Family Feud YES Ding)

- **Name on MyInstants:** "Family Feud YES Ding"
- **Save as:** `feud-ding.mp3`
- **Used for:** When revealing correct answers
- **URL:** https://www.myinstants.com/en/instant/family-feud-yes-ding-21029/

### 4. Strike Sound (Family Feud NO Buzzer)

- **Name on MyInstants:** "Family Feud NO Buzzer"
- **Save as:** `feud-buzzer.mp3`
- **Used for:** When adding strikes (wrong answers)
- **URL:** https://www.myinstants.com/en/instant/family-feud-no-buzzer-69801/

## How to Download from MyInstants

### Method 1: Direct Download (Easiest)

1. Visit each URL above
2. Click the **Download** button (cloud icon) on the right side of the sound button
3. Save the file with the exact name specified above
4. Move all 4 files to: `/Users/vajihkhan/Development/party/assets/sounds/`

### Method 2: Browser Developer Tools (If download button doesn't work)

1. Visit the MyInstants page
2. Right-click on the page → **Inspect** (or press F12)
3. Go to **Network** tab in Developer Tools
4. Click the sound button to play it
5. In Network tab, look for an MP3 file
6. Right-click on the MP3 file → **Open in new tab**
7. Right-click on the audio player → **Save audio as...**
8. Save with the correct filename

### Method 3: Download 20-Second Theme from YouTube

For the `family-intro.mp3` (20-second theme):

1. Search YouTube for "Family Feud Theme Song"
2. Find a clean version ~20 seconds long
3. Use a YouTube to MP3 converter (e.g., ytmp3.cc, y2mate.com)
4. Download and rename to `family-intro.mp3`
5. (Optional) Use audio editing to trim to exactly 20 seconds

### Method 4: Alternative Free Sources

If MyInstants doesn't work, you can find similar sounds at:

- **Freesound.org** - Search "family feud"
- **Zapsplat.com** - Free game show sound effects
- **YouTube** - Download using youtube-dl or online converters

## Installation Steps

1. Make sure the folder exists:

   ```
   /Users/vajihkhan/Development/party/assets/sounds/
   ```

   ✅ This folder has already been created for you!

2. Place these 4 files in that folder:

   - `family-intro.mp3` (20-second theme music)
   - `feud-intro.mp3` (short sound effect)
   - `feud-ding.mp3`
   - `feud-buzzer.mp3`

3. Verify the files are in place:
   ```bash
   ls -la /Users/vajihkhan/Development/party/assets/sounds/
   ```
   You should see all 4 MP3 files listed.

## Testing

Once files are in place:

1. Open `/games/family-feud-restaurants.html` in your browser
2. **Splash screen appears** with 20-second countdown
3. **Music starts playing** (`family-intro.mp3`) and continues for 20 seconds
4. You can click "Skip Intro" to go to game early (music continues)
5. Click an answer to hear the "ding" sound
6. Click "Add Strike" to hear the buzzer sound

## Audio Behavior

- **Splash Screen Music:** Plays for full 20 seconds, even if you skip the splash
- **Ding Sound:** Plays each time you reveal an answer
- **Buzzer Sound:** Plays each time you add a strike
- **Volume:** Music is at 60%, sound effects at 70%

## Troubleshooting

### Sounds not playing?

- Check browser console (F12) for errors
- Verify file names are EXACT (lowercase, no spaces)
- Make sure files are `.mp3` format
- Try refreshing the page (Cmd+Shift+R on Mac)

### File format issues?

If you download `.wav` or other formats:

- Use online converter: https://cloudconvert.com/mp3-converter
- Convert to MP3 format
- Rename to match required names

### Volume too loud/quiet?

Edit the game file and adjust this line:

```javascript
sound.volume = 0.7; // Change to 0.0 (silent) to 1.0 (full volume)
```

## Current Status

✅ Folder created: `/assets/sounds/`
✅ Game code updated with sound effects
⏳ **ACTION NEEDED:** Download and place the 3 MP3 files

Once you've placed the files, the game will automatically play sounds!
