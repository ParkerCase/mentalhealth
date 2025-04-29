#!/usr/bin/env node

/**
 * Enhanced script to set up required assets for the Globe component
 * This script creates necessary SVG and PNG assets for the 3D globe visualization
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

// Path where assets will be placed
const assetsDir = path.join(process.cwd(), "public", "assets");
const cesiumDir = path.join(process.cwd(), "public", "cesium");

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

// Create PNG from SVG using a data URI
async function createPngFromSvg(svgPath, pngPath) {
  try {
    // Try to convert using browser rendering (Node.js doesn't have canvas built-in)
    // This is a placeholder that creates a simple 1x1px PNG
    const placeholderContent = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0x60, 0x60, 0x60, 0x60,
      0x00, 0x00, 0x00, 0x05, 0x00, 0x01, 0x5e, 0xf3, 0x2d, 0xc5, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    fs.writeFileSync(pngPath, placeholderContent);
    console.log(`Created placeholder PNG: ${pngPath}`);

    // Note: In a real implementation, we'd use a library like sharp or canvas
    // to properly convert SVG to PNG. For simplicity, we're using placeholders.
  } catch (error) {
    console.warn(`Warning: Could not create PNG from SVG: ${error.message}`);
  }
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

// Check if Cesium assets are properly copied
function ensureCesiumAssets() {
  if (!fs.existsSync(cesiumDir)) {
    console.log("Cesium assets not found. Creating directory...");
    fs.mkdirSync(cesiumDir, { recursive: true });

    try {
      console.log("Running npm prepare to copy Cesium assets...");
      execSync("npm run prepare", { stdio: "inherit" });
      console.log("Cesium assets copied successfully.");
    } catch (error) {
      console.error("Failed to copy Cesium assets:", error.message);
      console.log("Please manually run: npm run prepare");
    }
  } else {
    console.log("Cesium assets directory exists. Checking for key files...");

    // Check for a few critical Cesium files
    const criticalFiles = [
      "Cesium.js",
      "Widgets/widgets.css",
      "Assets/Images/Cesium_Logo_Color.jpg",
    ];

    const missingFiles = criticalFiles.filter(
      (file) => !fs.existsSync(path.join(cesiumDir, file))
    );

    if (missingFiles.length > 0) {
      console.warn("Some Cesium files are missing. Trying to recopy...");
      try {
        execSync("npm run prepare", { stdio: "inherit" });
        console.log("Cesium assets recopied successfully.");
      } catch (error) {
        console.error("Failed to recopy Cesium assets:", error.message);
      }
    } else {
      console.log("Cesium assets check: OK");
    }
  }
}

// Write SVG files and create PNG versions
async function setupAssets() {
  console.log("Setting up globe assets...");

  // Ensure Cesium assets are properly copied
  ensureCesiumAssets();

  // Create SVG files and corresponding PNGs
  for (const asset of svgAssets) {
    const svgPath = path.join(assetsDir, asset.name);
    fs.writeFileSync(svgPath, asset.content.trim());
    console.log(`Created SVG: ${svgPath}`);

    // Also create PNG versions for browsers that don't support SVG
    const pngPath = path.join(assetsDir, asset.name.replace(".svg", ".png"));
    await createPngFromSvg(svgPath, pngPath);
  }

  // Try to download some additional placeholder terrain textures
  const textures = [
    {
      url: "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_cloud_2048.jpg",
      path: path.join(assetsDir, "earth_day.jpg"),
    },
    {
      url: "https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.54000x27000.jpg",
      path: path.join(assetsDir, "earth_night.jpg"),
    },
  ];

  try {
    await Promise.all(
      textures.map((texture) =>
        downloadFile(texture.url, texture.path).catch((err) =>
          console.warn(`Failed to download ${texture.url}: ${err.message}`)
        )
      )
    );
  } catch (e) {
    console.warn("Could not download additional textures:", e.message);
    console.warn("The globe will still work with the default textures.");
  }

  console.log("\n✓ Globe assets created successfully!");
  console.log("To use these assets:");
  console.log(
    "1. Make sure your app can access the '/assets' and '/cesium' folders"
  );
  console.log("2. If using Next.js, these should be in the public directory");
  console.log("3. Check all paths in your code reference '/assets/[filename]'");

  // Check for common environment variables needed by Cesium
  if (!process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN) {
    console.log(
      "\n⚠️ Note: For best results, set the NEXT_PUBLIC_CESIUM_ION_TOKEN environment variable"
    );
    console.log("   You can get a free token at https://cesium.com/ion/");
  }
}

// Run setup
setupAssets().catch((err) => {
  console.error("Error setting up assets:", err);
  process.exit(1);
});
