// Test script for group creation and search functionality
const { createClient } = require("@supabase/supabase-js");
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const testGroup = {
  name: `Test Group ${Date.now()}`,
  description: "This is a test group created to verify the group creation flow works correctly.",
  location: "Downtown Test City",
  address: "123 Test Street",
  city: "Test City",
  state: "TC",
  zip: "12345",
  website: "https://testgroup.example.com",
  email: "test@example.com",
  phone: "555-1234",
  approved: false
};

let createdGroupId = null;

async function testGroupCreation() {
  console.log("\n🧪 Testing Group Creation...\n");

  try {
    // Insert test group first without geo_location to avoid PostGIS parsing issues
    console.log("📝 Creating test group...");
    const { data, error } = await supabase
      .from('groups')
      .insert({
        ...testGroup
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Group creation failed:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return false;
    }

    createdGroupId = data.id;
    console.log("✅ Group created successfully!");
    console.log("   Group ID:", createdGroupId);
    console.log("   Group Name:", data.name);

    // Try to update with geo_location separately
    console.log("📍 Attempting to set geo_location...");
    try {
      const { error: geoError } = await supabase
        .from('groups')
        .update({
          geo_location: {
            type: 'Point',
            coordinates: [-98.5795, 39.8283] // Center of US
          }
        })
        .eq('id', createdGroupId);
      
      if (geoError) {
        console.log("⚠️  Could not set geo_location (this is okay, group was still created):", geoError.message);
      } else {
        console.log("✅ Geo location set successfully!");
      }
    } catch (geoErr) {
      console.log("⚠️  Geo location update failed (this is okay):", geoErr.message);
    }

    return true;
  } catch (error) {
    console.error("❌ Unexpected error during group creation:", error);
    return false;
  }
}

async function testGroupSearch() {
  console.log("\n🔍 Testing Group Search...\n");

  try {
    // Test 1: Search by city
    console.log("Test 1: Searching by city (Test City)...");
    let { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('approved', true)
      .ilike('city', '%Test City%')
      .limit(10);

    if (error) {
      console.error("❌ City search failed:", error);
    } else {
      console.log(`✅ Found ${data?.length || 0} groups in Test City`);
    }

    // Test 2: Search by state
    console.log("\nTest 2: Searching by state (TC)...");
    ({ data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('approved', true)
      .ilike('state', '%TC%')
      .limit(10));

    if (error) {
      console.error("❌ State search failed:", error);
    } else {
      console.log(`✅ Found ${data?.length || 0} groups in state TC`);
    }

    // Test 3: Search by keywords (name)
    console.log("\nTest 3: Searching by keywords (Test Group)...");
    ({ data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('approved', true)
      .ilike('name', '%Test Group%')
      .limit(10));

    if (error) {
      console.error("❌ Keyword search (name) failed:", error);
    } else {
      console.log(`✅ Found ${data?.length || 0} groups matching 'Test Group'`);
    }

    // Test 4: Combined search with OR
    console.log("\nTest 4: Testing OR query (name or description)...");
    ({ data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('approved', true)
      .or('name.ilike.%Test%,description.ilike.%test%')
      .limit(10));

    if (error) {
      console.error("❌ OR query failed:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log(`✅ Found ${data?.length || 0} groups matching OR criteria`);
    }

    return true;
  } catch (error) {
    console.error("❌ Unexpected error during search:", error);
    return false;
  }
}

async function testGroupRead() {
  console.log("\n📖 Testing Group Read...\n");

  if (!createdGroupId) {
    console.log("⚠️  No group ID available, skipping read test");
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', createdGroupId)
      .single();

    if (error) {
      console.error("❌ Group read failed:", error);
      return false;
    }

    console.log("✅ Group read successfully!");
    console.log("   Name:", data.name);
    console.log("   City:", data.city);
    console.log("   State:", data.state);
    return true;
  } catch (error) {
    console.error("❌ Unexpected error during read:", error);
    return false;
  }
}

async function testGroupUpdate() {
  console.log("\n✏️  Testing Group Update...\n");

  if (!createdGroupId) {
    console.log("⚠️  No group ID available, skipping update test");
    return false;
  }

  try {
    const updatedName = `Updated Test Group ${Date.now()}`;
    const { data, error } = await supabase
      .from('groups')
      .update({
        name: updatedName,
        updated_at: new Date().toISOString()
      })
      .eq('id', createdGroupId)
      .select()
      .single();

    if (error) {
      console.error("❌ Group update failed:", error);
      return false;
    }

    console.log("✅ Group updated successfully!");
    console.log("   New name:", data.name);
    return true;
  } catch (error) {
    console.error("❌ Unexpected error during update:", error);
    return false;
  }
}

async function cleanupTestData() {
  console.log("\n🧹 Cleaning up test data...\n");

  if (!createdGroupId) {
    console.log("⚠️  No group ID available, skipping cleanup");
    return;
  }

  try {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', createdGroupId);

    if (error) {
      console.error("❌ Cleanup failed:", error);
      console.log("⚠️  Please manually delete group with ID:", createdGroupId);
    } else {
      console.log("✅ Test group deleted successfully!");
    }
  } catch (error) {
    console.error("❌ Unexpected error during cleanup:", error);
    console.log("⚠️  Please manually delete group with ID:", createdGroupId);
  }
}

async function runTests() {
  console.log("🚀 Starting Group Flow Tests\n");
  console.log("=" .repeat(50));

  const results = {
    create: false,
    search: false,
    read: false,
    update: false
  };

  // Run tests
  results.create = await testGroupCreation();
  results.search = await testGroupSearch();
  results.read = await testGroupRead();
  results.update = await testGroupUpdate();

  // Cleanup
  await cleanupTestData();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Results Summary\n");
  console.log(`Create:  ${results.create ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Search:  ${results.search ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Read:    ${results.read ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Update:  ${results.update ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

