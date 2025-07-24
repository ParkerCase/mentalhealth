const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateArticleImage() {
  try {
    const { data, error } = await supabase
      .from("archives")
      .update({
        thumbnail_url: "/images/divine-masculine-article.webp",
        updated_at: new Date().toISOString(),
      })
      .eq("title", "Divine Masculine: 11 Key Qualities Explained")
      .select();

    if (error) {
      console.error("Error updating article:", error);
      return;
    }

    console.log("Article image updated successfully:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

updateArticleImage();
