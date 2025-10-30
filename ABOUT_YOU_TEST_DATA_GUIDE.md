# About You Test Data & Report Guide

## Test Data Overview

The `sql/seed_about_you_test_data.sql` file creates 8 diverse test profiles with different completion levels to help you understand the About You reports.

### Test Profiles Created

1. **Sarah Ahmed** (Karachi) - ✅ All 3 batches complete

   - Prefers: Biryani, Nihari, Chaunsa mangos, Daal Chawal
   - Fun fact: Likes both Chai AND Coffee

2. **Ali Khan** (Lahore) - ✅ All 3 batches complete

   - Prefers: Biryani, Haleem, Anwar Ratol mangos, Coffee
   - Fun fact: Coffee person, Arranged marriage preference

3. **Zainab Malik** (Houston) - ✅ All 3 batches complete

   - Prefers: Both Pulao AND Biryani, Nihari, Sindhri mangos
   - Fun fact: Loves "Both" options - can't choose just one!

4. **Hassan Raza** (Islamabad) - ⚠️ 2 batches complete (missing batch 3)

   - Prefers: Biryani, loves both Nihari AND Haleem, Langra mangos
   - Status: Incomplete - good for testing partial completion

5. **Fatima Siddiqui** (Faisalabad) - ⚠️ Only 1 batch complete

   - Prefers: Pulao, Haleem, "Whatever's ripe" mangos
   - Status: Just started - testing early dropout

6. **Usman Tariq** (Chicago) - ✅ All 3 batches complete

   - Prefers: Biryani, Nihari, Chaunsa mangos, Coffee
   - Fun fact: Born in Chicago, Love marriage preference

7. **Ayesha Patel** (New York) - ⚠️ Only 1 batch complete

   - Prefers: Biryani, Haleem, Alphonso mangos (the only one!)
   - Fun fact: Only person who chose McDonald's as comfort food

8. **Bilal Sheikh** (Multan) - ✅ All 3 batches complete
   - Prefers: Pulao, Nihari, Sindhri mangos, Chai
   - Fun fact: Arranged marriage preference

### Completion Stats

- **5 profiles** completed all 3 batches (62.5%)
- **1 profile** completed 2 batches (12.5%)
- **2 profiles** completed only 1 batch (25%)
- **Average completion**: ~75%

## How to Load Test Data

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `sql/seed_about_you_test_data.sql`
3. Paste and run the script
4. You should see success messages confirming 8 profiles were created
5. Refresh your host dashboard

## Understanding the Reports

### 1. Summary View

**What it shows:** List of all guests with progress badges

**Key features:**

- Guest names with batch completion badges (1, 2, 3)
- Progress bar showing overall completion percentage
- Green badges = complete, orange = in progress, gray = not started
- "View Answers" button for guests who have submitted responses

**Use case:** Quick overview of who has completed what

**What to look for:**

- Sarah, Ali, Zainab, Usman, Bilal have all green badges (100% complete)
- Hassan has 2 green badges (66% complete)
- Fatima and Ayesha have 1 green badge (33% complete)

### 2. Detailed View

**What it shows:** All answers from all guests, organized by person

**Key features:**

- Each guest's full name as a heading
- All their submitted answers listed below
- Question prompts shown with answers
- Either/Or answers resolved to readable labels (e.g., "Biryani" not "B")
- Modifier tags shown (e.g., "Both", "Neither")

**Use case:** Reading complete individual responses, understanding each guest's full profile

**What to look for:**

- Zainab's answers show "Both" modifiers - she couldn't choose between Pulao/Biryani
- Ayesha is the only person who chose Alphonso mangos
- Ali and Bilal have opposite marriage preferences

### 3. Aggregate View

**What it shows:** Statistics across all guests, grouped by question

**Key features:**

- Questions organized by batch (Fun Favorites, Know Yourself, Deeper Reflections)
- Bar charts showing percentage breakdowns
- Vote counts for each option
- Color-coded bars with percentages

**Use case:** Understanding group trends, finding popular answers, identifying outliers

**What to look for:**

- **Pulao vs Biryani:** 62.5% prefer Biryani (5/8), 25% prefer Pulao (2/8), 12.5% like both
- **Mango supremacy:** Chaunsa leads with 37.5% (3/8), Sindhri 25% (2/8)
- **Comfort food:** Daal Chawal is most popular with 25% (2/8)
- **Chai vs Coffee:** 50/50 split! 4 people each, showing Houston diversity
- **Marriage preference:** Love marriage slightly ahead (4) vs Arranged (3), plus 1 "both"

### 4. Filter Options

**All Guests:** Shows everyone, regardless of completion
**Completed Only:** Shows only the 5 guests who finished all 3 batches
**Incomplete Only:** Shows only Hassan, Fatima, and Ayesha (partial completion)

**Pro tip:** Use "Completed Only" filter in Aggregate view to see stats from only those who gave full responses.

## Testing Different Report Scenarios

### Test Completion Tracking

1. Select party in dropdown
2. Look at stats: "Total: 8, Completed: 5, In Progress: 3, Avg: 75%"
3. Switch filters to see how views change

### Test Summary View

1. Select "Summary" view mode
2. Notice progress bars and badges
3. Click "View Answers" on Sarah Ahmed
4. Modal should show all her responses with readable labels

### Test Detailed View

1. Select "Detailed" view mode
2. Scroll through each guest's full answers
3. Notice how "Either/Or" answers show actual food names (Biryani, Nihari) not just A/B
4. Look for Zainab's "Both" tags

### Test Aggregate View

1. Select "Aggregate" view mode
2. Check the Pulao vs Biryani bar chart
3. Look at Mango supremacy breakdown
4. See how comfort food preferences are distributed
5. Notice the 50/50 Chai vs Coffee split

### Test CSV Export

1. Click "Export to CSV" button
2. Open the downloaded file
3. You should see:
   - Column headers with all question prompts
   - 8 rows of guest data
   - Batch progress columns
   - All answers resolved to readable text

## Interesting Patterns in Test Data

### Cultural Diversity

- Birth cities span Pakistan (Karachi, Lahore, Islamabad, Faisalabad, Multan) and US (Houston, Chicago, New York)
- Shows both desi and American influences (McDonald's as comfort food!)

### Food Preferences

- **Biryani dominance:** 62.5% prefer it over Pulao
- **Nihari slightly ahead** of Haleem
- **Chaunsa mangos** are the clear winner
- **Daal Chawal** ties with Nihari Paratha for comfort food

### Personality Traits

- Mix of zodiac signs (Leo, Scorpio, Gemini, Aries, Sagittarius, Virgo)
- Different remedies: Haldi Doodh (2), Vicks (1), Ajwain (1), Adrak Honey (1), Johar (1)
- Auntie analysis split: Outfits (2), Weight (1), Jewelry (1), Who brought what (1), Home decor (1)

### Houston Food Scene

- Himalaya: 2 votes
- Agas: 2 votes
- Bismillah: 2 votes
- Lasbela: 1 vote
- Tempura: 1 vote

## Troubleshooting

### If reports don't show data:

1. Check that you selected the correct party in dropdown
2. Verify SQL script ran successfully (check Supabase logs)
3. Hard refresh browser (Cmd+Shift+R)
4. Check browser console for errors

### If "View Answers" modal is empty:

1. Make sure you're clicking on a completed profile (green badges)
2. Check that extended_answers has data in database
3. Try viewing Sarah or Ali who have full data

### If aggregate view shows wrong percentages:

1. This is normal - it calculates from all responses, not just completed
2. Use "Completed Only" filter for accurate stats from full responses

## Next Steps

After loading test data:

1. **Explore all 3 view modes** to understand each perspective
2. **Try all filters** (All, Completed, Incomplete)
3. **Export CSV** to see the raw data format
4. **Click through modals** to test interactivity
5. **Compare answers** between similar profiles

This test data gives you a realistic sample to understand how the About You reports work and what insights you can gain from guest responses!
