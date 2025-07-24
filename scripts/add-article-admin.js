const axios = require("axios");
require("dotenv").config({ path: ".env.local" });

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
  };

  try {
    const response = await axios.post(
      "http://localhost:5000/api/admin/articles",
      articleData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            process.env.ADMIN_TOKEN || "your-admin-token-here"
          }`,
        },
      }
    );

    console.log("Article added successfully:", response.data);
  } catch (error) {
    console.error(
      "Error adding article:",
      error.response?.data || error.message
    );
  }
}

addArticle();
