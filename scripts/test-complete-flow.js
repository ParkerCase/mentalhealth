// Comprehensive test script for group creation and search
const { createClient } = require("@supabase/supabase-js");
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const testGroup = {
  name: `Test Group ${Date.now()}`,
  description: "This is a test group created to verify the complete flow works correctly.",
  location: "Downtown Test City",
  address: "123 Test Street",
  city: "New York",
  state: "NY",
  zip: "10001",
  website: "https://testgroup.example.com",
  email: "test@example.com",
  phone: "555-1234",
  approved: false
};

let createdGroupId = null;
let testUserId = null;

async function testGroupCreation() {
  console.log("\n🧪 TEST 1: Group Creation\n");
  console.log("=" .repeat(50));

  try {
    // Note: This will fail if RLS policies aren't set up, but that's expected
    // In production, user would be authenticated
    console.log("📝 Creating test group (without geo_location first)...");
    const { data, error } = await supabase
      .from('groups')
      .insert({
        ...testGroup
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42501') {
        console.log("⚠️  RLS policy error - this is expected if not authenticated");
        console.log("   Error:", error.message);
        console.log("   ✅ RLS is working (blocking unauthenticated inserts)");
        return { success: false, rlsBlocked: true };
      }
      throw error;
    }

    createdGroupId = data.id;
    console.log("✅ Group created successfully!");
    console.log("   Group ID:", createdGroupId);
    console.log("   Group Name:", data.name);

    // Try to update with geo_location
    console.log("\n📍 Attempting to set geo_location...");
    const { error: geoError } = await supabase
      .from('groups')
      .update({
        geo_location: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128] // NYC coordinates
        }
      })
      .eq('id', createdGroupId);
    
    if (geoError) {
      console.log("⚠️  Could not set geo_location:", geoError.message);
      console.log("   This might be expected depending on PostGIS setup");
    } else {
      console.log("✅ Geo location set successfully!");
    }

    return { success: true, groupId: createdGroupId };
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    return { success: false, error: error.message };
  }
}

async function testGroupSearch() {
  console.log("\n🔍 TEST 2: Group Search (Locator Style)\n");
  console.log("=" .repeat(50));

  try {
    // Test the RPC function for nearby groups
    console.log("Testing get_groups_nearby RPC function...");
    console.log("Searching for groups near New York (40.7128, -74.0060)...");
    
    const { data, error } = await supabase
      .rpc('get_groups_nearby', {
        search_lat: 40.7128,
        search_lng: -74.0060,
        radius_miles: 50
      });

    if (error) {
      if (error.code === '42883' || error.message.includes('does not exist')) {
        console.log("❌ RPC function 'get_groups_nearby' does not exist");
        console.log("   ⚠️  You need to run: scripts/create-groups-nearby-rpc.sql");
        return { success: false, needsRPC: true };
      }
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} groups within 50 miles of NYC`);
    if (data && data.length > 0) {
      console.log("\n   Sample results:");
      data.slice(0, 3).forEach((group, i) => {
        console.log(`   ${i + 1}. ${group.name} - ${group.distance_miles?.toFixed(1)} miles away`);
      });
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error("❌ Search error:", error.message);
    return { success: false, error: error.message };
  }
}

async function testGroupSearchByCity() {
  console.log("\n🔍 TEST 3: Group Search by City/State/Keywords\n");
  console.log("=" .repeat(50));

  try {
    // Test city search
    console.log("Test 3a: Searching by city (New York)...");
    let { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('approved', true)
      .ilike('city', '%New York%')
      .limit(10);

    if (error) throw error;
    console.log(`✅ Found ${data?.length || 0} groups in New York`);

    // Test state search
    console.log("\nTest 3b: Searching by state (NY)...");
    ({ data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('approved', true)
      .ilike('state', '%NY%')
      .limit(10));

    if (error) throw error;
    console.log(`✅ Found ${data?.length || 0} groups in NY`);

    // Test keyword search
    console.log("\nTest 3c: Searching by keywords (Test)...");
    ({ data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('approved', true)
      .ilike('name', '%Test%')
      .limit(10));

    if (error) throw error;
    console.log(`✅ Found ${data?.length || 0} groups matching 'Test'`);

    // Test OR query
    console.log("\nTest 3d: Testing OR query (name or description)...");
    ({ data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('approved', true)
      .or('name.ilike.%Test%,description.ilike.%test%')
      .limit(10));

    if (error) {
      console.log("⚠️  OR query error:", error.message);
    } else {
      console.log(`✅ Found ${data?.length || 0} groups matching OR criteria`);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Search error:", error.message);
    return { success: false, error: error.message };
  }
}

async function testGroupRead() {
  console.log("\n📖 TEST 4: Group Read\n");
  console.log("=" .repeat(50));

  if (!createdGroupId) {
    console.log("⚠️  No group ID available (creation may have been blocked by RLS)");
    console.log("   Testing read with existing groups...");
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('approved', true)
      .limit(1)
      .single();

    if (error) {
      console.log("❌ Could not read groups:", error.message);
      return { success: false };
    }

    console.log("✅ Successfully read group:", data.name);
    return { success: true };
  }

  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', createdGroupId)
      .single();

    if (error) throw error;

    console.log("✅ Group read successfully!");
    console.log("   Name:", data.name);
    console.log("   City:", data.city);
    console.log("   State:", data.state);
    return { success: true };
  } catch (error) {
    console.error("❌ Read error:", error.message);
    return { success: false };
  }
}

async function cleanupTestData() {
  console.log("\n🧹 TEST 5: Cleanup\n");
  console.log("=" .repeat(50));

  if (!createdGroupId) {
    console.log("⚠️  No test group to clean up");
    return;
  }

  try {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', createdGroupId);

    if (error) {
      if (error.code === '42501') {
        console.log("⚠️  RLS blocking delete (expected if not authenticated)");
        console.log("   Test group ID:", createdGroupId);
        console.log("   Please delete manually if needed");
        return;
      }
      throw error;
    }

    console.log("✅ Test group deleted successfully!");
  } catch (error) {
    console.error("❌ Cleanup error:", error.message);
    console.log("⚠️  Test group ID:", createdGroupId);
  }
}

async function runAllTests() {
  console.log("🚀 COMPREHENSIVE GROUP FLOW TESTS");
  console.log("=" .repeat(50));
  console.log("\nTesting:");
  console.log("1. Group Creation (with RLS check)");
  console.log("2. Locator Search (RPC function)");
  console.log("3. Text-based Search (city/state/keywords)");
  console.log("4. Group Read");
  console.log("5. Cleanup");

  const results = {
    creation: { success: false },
    locatorSearch: { success: false },
    textSearch: { success: false },
    read: { success: false }
  };

  // Run tests
  results.creation = await testGroupCreation();
  results.locatorSearch = await testGroupSearch();
  results.textSearch = await testGroupSearchByCity();
  results.read = await testGroupRead();
  
  // Cleanup
  await cleanupTestData();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST RESULTS SUMMARY\n");
  console.log(`1. Group Creation:  ${results.creation.success ? '✅ PASS' : results.creation.rlsBlocked ? '⚠️  RLS BLOCKED (expected)' : '❌ FAIL'}`);
  console.log(`2. Locator Search:  ${results.locatorSearch.success ? '✅ PASS' : results.locatorSearch.needsRPC ? '⚠️  NEEDS RPC' : '❌ FAIL'}`);
  console.log(`3. Text Search:     ${results.textSearch.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`4. Group Read:      ${results.read.success ? '✅ PASS' : '❌ FAIL'}`);

  const criticalPassed = results.locatorSearch.success && results.textSearch.success && results.read.success;
  console.log(`\n${criticalPassed ? '✅ Critical tests passed!' : '⚠️  Some tests need attention'}`);

  if (results.locatorSearch.needsRPC) {
    console.log("\n⚠️  ACTION REQUIRED:");
    console.log("   Run: scripts/create-groups-nearby-rpc.sql in Supabase SQL editor");
  }

  process.exit(criticalPassed ? 0 : 1);
}

runAllTests().catch(error => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

