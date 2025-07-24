const https = require("https");
const fs = require("fs");
const path = require("path");

const imageUrl =
  "https://subconsciousservant.com/wp-content/uploads/2021/07/Thambnail-1-min-1-3.jpg.webp";
const outputPath = path.join(
  __dirname,
  "../public/images/divine-masculine-article.webp"
);

// Ensure the images directory exists
const imagesDir = path.dirname(outputPath);
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

console.log("Downloading image...");

https
  .get(imageUrl, (response) => {
    if (response.statusCode === 200) {
      const file = fs.createWriteStream(outputPath);
      response.pipe(file);

      file.on("finish", () => {
        file.close();
        console.log("Image downloaded successfully to:", outputPath);
        console.log("You can now use: /images/divine-masculine-article.webp");
      });
    } else {
      console.error("Failed to download image. Status:", response.statusCode);
    }
  })
  .on("error", (err) => {
    console.error("Error downloading image:", err.message);
  });
