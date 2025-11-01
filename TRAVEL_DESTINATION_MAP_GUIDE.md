# Travel Destination Map Implementation Guide

## What Was Done

The travel destination map feature has been fully implemented with the following changes:

### 1. Frontend Changes (`src/main.js`)

**Added travel destination geocoding on form submission:**

- Extracts `fav_city_travel` from the About You form
- Geocodes the city using Nominatim (OpenStreetMap) API
- Saves the geocoded data (`fav_dest_city`, `fav_dest_lat`, `fav_dest_lng`) to `party_profiles` table

### 2. Dashboard Visualization (`src/features/host/dashboard.js`)

**Added `initTravelDestMap()` function:**

- Similar to birth city map but uses cyan colored circles (#06b6d4)
- Groups guests by their favorite travel destination
- Displays proportionally-sized circles (8-30px radius based on guest count)
- Shows popups with destination name, guest count, and guest list

**Updated database query:**

- Added `fav_dest_city`, `fav_dest_lat`, `fav_dest_lng` to the SELECT statement

**Updated aggregate view rendering:**

- Added special handling for `fav_city_travel` question
- Creates map container and initializes map with setTimeout

### 3. Color Scheme Differentiation

- **Birth City Map**: Purple circles (#8b5cf6) with 🏙️ emoji
- **Travel Destination Map**: Cyan circles (#06b6d4) with ✈️ emoji

## Current Issue

Users who submitted their responses **before** this update don't have their travel destinations geocoded in the database. This is why the map shows "No destination cities with coordinates found".

## Solution: Geocode Existing Data

### Option 1: Use the Admin Tool (Recommended)

A browser-based admin tool has been created to geocode all existing travel destinations:

**Location:** `/admin/geocode-travel-destinations.html`

**How to use:**

1. Open the file in your browser (must be on the same domain as your app)
2. Click "Start Geocoding" button
3. The tool will:
   - Fetch all profiles missing travel destination coordinates
   - Geocode each city using OpenStreetMap
   - Update the database with lat/lng coordinates
   - Show progress in real-time
   - Respect Nominatim's rate limit (1 request per second)

**Note:** You must have proper Supabase authentication in your browser session for this to work.

### Option 2: Manual SQL Query

If you prefer SQL, use the provided query file:

**Location:** `/sql/geocode_travel_destinations.sql`

This file contains:

1. A SELECT query to see which profiles need geocoding
2. Template UPDATE queries for manual geocoding

### Option 3: Ask Users to Re-submit

If you have few users, you could:

1. Clear their `extended_answers` for the travel question
2. Ask them to answer the question again
3. The new submission will automatically geocode the city

## Testing

After running the geocoding tool:

1. Refresh the Host Dashboard
2. Navigate to "About You" → "Report" → "Aggregate Results"
3. Scroll to "Deeper Reflections" section
4. Look for "Favorite city for travel" question
5. You should see cyan circles on the map showing where guests want to travel

## Future Submissions

All **new** submissions will automatically geocode travel destinations, so no manual intervention will be needed going forward.

## Database Schema

The `party_profiles` table should have these columns:

- `fav_dest_city` (text) - City name
- `fav_dest_lat` (double precision) - Latitude
- `fav_dest_lng` (double precision) - Longitude

If these columns don't exist, you'll need to add them:

```sql
ALTER TABLE party_profiles
ADD COLUMN IF NOT EXISTS fav_dest_city text,
ADD COLUMN IF NOT EXISTS fav_dest_lat double precision,
ADD COLUMN IF NOT EXISTS fav_dest_lng double precision;
```

## Troubleshooting

**Map shows no circles:**

- Check browser console for errors
- Verify that profiles have `fav_dest_lat` and `fav_dest_lng` values in the database
- Run the geocoding admin tool

**Geocoding fails:**

- Check that you have internet connectivity
- Nominatim has rate limits (1 request/second) - the tool respects this
- Some city names might not be found - try more specific names (e.g., "Paris, France" instead of just "Paris")

**Permission errors:**

- Ensure your Supabase Row Level Security (RLS) policies allow updates to `party_profiles`
- Check that you're authenticated as a host/admin

## Files Modified/Created

### Modified:

- `/src/main.js` - Added travel destination geocoding on form submission
- `/src/features/host/dashboard.js` - Added travel map visualization

### Created:

- `/admin/geocode-travel-destinations.html` - Browser-based geocoding tool
- `/sql/geocode_travel_destinations.sql` - SQL helper queries
- `/scripts/geocode_travel_destinations.js` - Node.js script (if needed later)
- `/TRAVEL_DESTINATION_MAP_GUIDE.md` - This file
