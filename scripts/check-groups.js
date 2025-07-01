// Simple script to check groups in the database
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGroups() {
  console.log("🔍 Checking groups in database...\n");

  try {
    // Check total groups
    const { count: totalGroups, error: countError } = await supabase
      .from("groups")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ Error counting groups:", countError);
      return;
    }

    console.log(`📊 Total groups in database: ${totalGroups}`);

    // Check approved groups
    const { count: approvedGroups, error: approvedError } = await supabase
      .from("groups")
      .select("*", { count: "exact", head: true })
      .eq("approved", true);

    if (approvedError) {
      console.error("❌ Error counting approved groups:", approvedError);
      return;
    }

    console.log(`✅ Approved groups: ${approvedGroups}`);

    // Get sample groups
    const { data: sampleGroups, error: sampleError } = await supabase
      .from("groups")
      .select("*")
      .limit(3);

    if (sampleError) {
      console.error("❌ Error fetching sample groups:", sampleError);
      return;
    }

    console.log("\n📋 Sample groups:");
    sampleGroups.forEach((group, index) => {
      console.log(`\n${index + 1}. ${group.name}`);
      console.log(`   Location: ${group.city}, ${group.state}`);
      console.log(`   Approved: ${group.approved}`);
      console.log(`   Geo location type: ${typeof group.geo_location}`);
      if (group.geo_location) {
        console.log(
          `   Geo location: ${JSON.stringify(group.geo_location).substring(
            0,
            100
          )}...`
        );
      }
    });

    // Check if RPC function exists
    console.log("\n🔧 Testing RPC function...");
    const { data: rpcData, error: rpcError } = await supabase
      .rpc("get_groups_with_coordinates")
      .eq("approved", true);

    if (rpcError) {
      console.log("❌ RPC function not available:", rpcError.message);
    } else {
      console.log(
        "✅ RPC function works! Found",
        rpcData.length,
        "groups with coordinates"
      );
      if (rpcData.length > 0) {
        console.log("Sample RPC result:", rpcData[0]);
      }
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkGroups();
