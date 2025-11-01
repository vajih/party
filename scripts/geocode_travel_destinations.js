/**
 * Geocode Existing Travel Destinations
 * 
 * This script geocodes favorite travel cities for existing party profiles
 * that don't have lat/lng coordinates yet.
 * 
 * Usage:
 * 1. Make sure you have a .env file with SUPABASE_URL and SUPABASE_ANON_KEY
 * 2. Run: node scripts/geocode_travel_destinations.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Geocode a city name using Nominatim (OpenStreetMap)
 */
async function geocodeCity(cityName) {
  if (!cityName || !cityName.trim()) return null;
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
      q: cityName,
      format: 'json',
      limit: '1'
    });
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PartyApp/1.0'
      }
    });
    
    if (!response.ok) {
      console.error('[geocodeCity] HTTP error:', response.status);
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('[geocodeCity] Error:', error);
    return null;
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to geocode all travel destinations
 */
async function geocodeTravelDestinations() {
  console.log('🌍 Starting travel destination geocoding...\n');
  
  // Fetch all profiles that need geocoding
  const { data: profiles, error } = await supabase
    .from('party_profiles')
    .select('user_id, party_id, display_name, extended_answers')
    .is('fav_dest_lat', null);
  
  if (error) {
    console.error('❌ Error fetching profiles:', error);
    return;
  }
  
  console.log(`📊 Found ${profiles.length} profiles to process\n`);
  
  let processed = 0;
  let geocoded = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const profile of profiles) {
    const travelCity = profile.extended_answers?.fav_city_travel;
    
    if (!travelCity || !travelCity.trim()) {
      console.log(`⏭️  Skipping ${profile.display_name} - no travel city`);
      skipped++;
      processed++;
      continue;
    }
    
    console.log(`🔍 Geocoding "${travelCity}" for ${profile.display_name}...`);
    
    // Geocode the city
    const geoResult = await geocodeCity(travelCity);
    
    if (geoResult) {
      // Update the profile
      const { error: updateError } = await supabase
        .from('party_profiles')
        .update({
          fav_dest_city: travelCity,
          fav_dest_lat: geoResult.lat,
          fav_dest_lng: geoResult.lng
        })
        .eq('user_id', profile.user_id)
        .eq('party_id', profile.party_id);
      
      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`);
        failed++;
      } else {
        console.log(`   ✅ Geocoded: ${geoResult.display_name}`);
        console.log(`   📍 Coordinates: ${geoResult.lat}, ${geoResult.lng}`);
        geocoded++;
      }
    } else {
      console.log(`   ⚠️  Could not geocode "${travelCity}"`);
      failed++;
    }
    
    processed++;
    
    // Respect Nominatim rate limit (1 request per second)
    if (processed < profiles.length) {
      console.log('   ⏳ Waiting 1 second (rate limit)...\n');
      await sleep(1000);
    }
  }
  
  console.log('\n✨ Geocoding complete!');
  console.log(`📊 Summary:`);
  console.log(`   Total profiles: ${profiles.length}`);
  console.log(`   Successfully geocoded: ${geocoded}`);
  console.log(`   Skipped (no city): ${skipped}`);
  console.log(`   Failed: ${failed}`);
}

// Run the script
geocodeTravelDestinations().catch(console.error);
