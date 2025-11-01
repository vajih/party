# Admin Tools

This directory contains administrative tools for managing your party app.

## 🧹 Cleanup Orphaned Data

**File:** `cleanup-orphaned-data.html`

**Purpose:** Finds and removes data from users who have been deleted from Supabase Auth but still have data in your database.

**When to use:**

- After deleting beta test users from Supabase Auth dashboard
- During database maintenance
- Before production launch to clean up test data

**How to use:**

1. Open `cleanup-orphaned-data.html` in your browser
2. Click "🔍 Scan for Orphaned Data"
3. Review the statistics showing orphaned records
4. Click "🗑️ Delete Orphaned Data" to permanently remove them

**What it cleans:**

- Orphaned votes
- Orphaned submissions
- Orphaned party profiles
- Orphaned party host entries

---

## 🌍 Geocode Travel Destinations

**File:** `geocode-travel-destinations.html`

**Purpose:** Geocodes favorite travel cities for existing party profiles that don't have coordinates yet.

**When to use:**

- After adding the travel destination map feature
- When existing users have answered the travel question but don't have lat/lng coordinates

**How to use:**

1. Open `geocode-travel-destinations.html` in your browser
2. Click "Start Geocoding"
3. Wait while it processes (respects 1 request/second rate limit)
4. Review the summary

**Note:** This only needs to be run once. New submissions automatically geocode travel destinations.

---

## SQL Scripts

Alternatively, you can use the SQL scripts in the `/sql` directory:

- **`cleanup_orphaned_data.sql`** - SQL version of the orphaned data cleanup
- **`geocode_travel_destinations.sql`** - SQL queries for travel destination geocoding
- **`delete_beta_tester.sql`** - Delete a specific user and their data
- **`cleanup_beta_data.sql`** - Delete ALL beta test data

## Requirements

- Must be authenticated in your browser with Supabase
- Admin/host permissions in the app
- Internet connection (for geocoding tool)

## Safety

All tools:

- Show what will be deleted BEFORE deleting
- Require confirmation for destructive actions
- Provide detailed logging
- Are reversible only through database backups

**⚠️ Important:** Always review what will be deleted before confirming!
