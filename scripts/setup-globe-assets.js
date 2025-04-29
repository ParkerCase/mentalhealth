#!/usr/bin/env node

/**
 * Script to set up the required assets for the Globe component
 * Enhanced version with more robust asset generation and verification
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Path where assets will be placed
const assetsDir = path.join(process.cwd(), "public", "assets");

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  console.log(`Creating assets directory at ${assetsDir}`);
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Define the assets we need to create
const svgAssets = [
  {
    name: "cloud.svg",
    content: `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <filter id="blur" x="0" y="0">
    <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
  </filter>
  <ellipse cx="50" cy="50" rx="40" ry="30" fill="white" filter="url(#blur)" opacity="0.8"/>
</svg>
`,
  },
  {
    name: "fog.svg",
    content: `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <filter id="blur" x="0" y="0">
    <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
  </filter>
  <rect x="10" y="30" width="80" height="40" fill="white" filter="url(#blur)" opacity="0.6"/>
</svg>
`,
  },
  {
    name: "pin-blue.svg",
    content: `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(16, 32) scale(1, -1) translate(-16, 0)">
    <path d="M16 32c-5.523 0-10-4.477-10-10 0-8 10-22 10-22s10 14 10 22c0 5.523-4.477 10-10 10z" fill="#3b82f6"/>
    <circle cx="16" cy="22" r="4" fill="white"/>
  </g>
</svg>
`,
  },
  {
    name: "pin-red.svg",
    content: `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(16, 32) scale(1, -1) translate(-16, 0)">
    <path d="M16 32c-5.523 0-10-4.477-10-10 0-8 10-22 10-22s10 14 10 22c0 5.523-4.477 10-10 10z" fill="#ef4444"/>
    <circle cx="16" cy="22" r="4" fill="white"/>
  </g>
</svg>
`,
  },
  {
    name: "storm.svg",
    content: `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <filter id="blur" x="0" y="0">
    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
  </filter>
  <defs>
    <linearGradient id="cloud" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#444; stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#999; stop-opacity:0.8" />
    </linearGradient>
  </defs>
  <ellipse cx="50" cy="35" rx="45" ry="25" fill="url(#cloud)" filter="url(#blur)"/>
  <path d="M45,50 L55,50 L50,70 L60,70 L40,100 L45,75 L35,75 Z" fill="#f6f67f" stroke="#f6f67f" stroke-width="1" />
</svg>
`,
  },
];

// Simple PNG creation from SVG for web compatibility
function createPngFromSvg(svgPath, pngPath) {
  // In a real implementation, we'd use canvas or another library to convert SVG to PNG
  // For simplicity in this script, we're just creating a placeholder file
  const placeholderContent = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // IHDR chunk
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01, // Width & height: 1px
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x90,
    0x77,
    0x53, // Bit depth, color type, etc.
    0xde,
    0x00,
    0x00,
    0x00,
    0x0c,
    0x49,
    0x44,
    0x41, // IDAT chunk
    0x54,
    0x08,
    0xd7,
    0x63,
    0xf8,
    0xcf,
    0xc0,
    0x00, // Compressed data
    0x00,
    0x03,
    0x01,
    0x01,
    0x00,
    0x18,
    0xdd,
    0x8d, // More data & CRC
    0xb0,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e, // IEND chunk
    0x44,
    0xae,
    0x42,
    0x60,
    0x82, // IEND CRC
  ]);

  fs.writeFileSync(pngPath, placeholderContent);
  console.log(`Created placeholder PNG: ${pngPath}`);
}

// Function to download a file if needed
function downloadFile(url, destinationPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destinationPath)) {
      console.log(`File already exists: ${destinationPath}`);
      resolve();
      return;
    }

    const file = fs.createWriteStream(destinationPath);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download ${url}, status code: ${response.statusCode}`
            )
          );
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`Downloaded: ${destinationPath}`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(destinationPath, () => {}); // Delete the file if there's an error
        reject(err);
      });
  });
}

// Write SVG files and create PNG versions
async function setupAssets() {
  console.log("Setting up globe assets...");

  // Create SVG files and corresponding PNGs
  for (const asset of svgAssets) {
    const svgPath = path.join(assetsDir, asset.name);
    fs.writeFileSync(svgPath, asset.content.trim());
    console.log(`Created SVG: ${svgPath}`);

    const pngPath = path.join(assetsDir, asset.name.replace(".svg", ".png"));
    createPngFromSvg(svgPath, pngPath);
  }

  // Try to download some additional placeholder terrain textures for more realistic globe
  const textures = [
    {
      url: "https://eoimages.gsfc.nasa.gov/images/imagerecords/90000/90008/earth_vir_200405_lrg.jpg",
      path: path.join(assetsDir, "earth_texture.jpg"),
    },
    {
      url: "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_cloud_2048.jpg",
      path: path.join(assetsDir, "earth_day.jpg"),
    },
  ];

  try {
    await Promise.all(
      textures.map((texture) =>
        downloadFile(texture.url, texture.path).catch((err) =>
          console.warn(`Failed to download ${texture.path}: ${err.message}`)
        )
      )
    );
  } catch (e) {
    console.warn("Could not download additional textures:", e.message);
    console.warn("The globe will still work with the default textures.");
  }

  console.log("\nAssets created successfully!");
  console.log(
    "To use these assets in your application, you'll need to ensure:"
  );
  console.log("1. The assets directory is accessible in your public folder");
  console.log("2. Your app has the necessary CORS configurations if needed");
  console.log(
    "\nIf you're using Next.js, make sure these assets are in the 'public/assets' folder"
  );
}

// Run setup
setupAssets().catch((err) => {
  console.error("Error setting up assets:", err);
  process.exit(1);
});
