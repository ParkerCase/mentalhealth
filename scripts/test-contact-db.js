const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testContactDatabase() {
  try {
    console.log("Testing database connection...");

    // Test 1: Check if we can connect
    const { data: testData, error: testError } = await supabase
      .from("contact_submissions")
      .select("count")
      .limit(1);

    if (testError) {
      console.error("Connection test failed:", testError);
      return;
    }

    console.log("✅ Database connection successful");

    // Test 2: Try to insert a test record
    const testSubmission = {
      name: "Test User",
      email: "test@example.com",
      subject: "Test Submission",
      message: "This is a test message to verify database access.",
      user_id: null,
    };

    console.log("Attempting to insert test record...");

    const { data, error } = await supabase
      .from("contact_submissions")
      .insert(testSubmission)
      .select();

    if (error) {
      console.error("❌ Insert test failed:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {
      console.log("✅ Insert test successful:", data);

      // Clean up - delete the test record
      if (data && data[0]) {
        await supabase
          .from("contact_submissions")
          .delete()
          .eq("id", data[0].id);
        console.log("✅ Test record cleaned up");
      }
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testContactDatabase();
