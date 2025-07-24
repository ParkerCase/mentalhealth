const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addArticle() {
  const articleData = {
    title: "Divine Masculine: 11 Key Qualities Explained",
    content:
      "This article explores the concept of divine masculinity and its key qualities. Click the link below to read the full article.\n\n[Read Full Article](https://subconsciousservant.com/divine-masculine/)",
    category: "Spirituality",
    tags: [
      "divine masculine",
      "spirituality",
      "personal growth",
      "masculinity",
    ],
    published: true,
    featured: false,
    thumbnail_url:
      "https://subconsciousservant.com/wp-content/uploads/2021/07/Thambnail-1-min-1-3.jpg.webp",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("archives")
      .insert(articleData)
      .select();

    if (error) {
      console.error("Error adding article:", error);
      return;
    }

    console.log("Article added successfully:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

addArticle();
