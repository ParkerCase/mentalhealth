// scripts/verify-globe-setup.js
/**
 * This script checks if all the required globe assets and Cesium files are in place
 */

const fs = require("fs");
const path = require("path");

console.log("\n========== GLOBE VISUALIZATION SETUP CHECKER ==========\n");

// Check essential directories
const publicDirPath = path.join(process.cwd(), "public");
const assetsDirPath = path.join(publicDirPath, "assets");
const cesiumDirPath = path.join(publicDirPath, "cesium");

console.log("Checking essential directories...");
console.log(
  `- Public dir exists: ${fs.existsSync(publicDirPath) ? "✅" : "❌"}`
);
console.log(
  `- Assets dir exists: ${fs.existsSync(assetsDirPath) ? "✅" : "❌"}`
);
console.log(
  `- Cesium dir exists: ${fs.existsSync(cesiumDirPath) ? "✅" : "❌"}`
);

// Check for Cesium essential files
console.log("\nChecking Cesium files...");
const cesiumJsPath = path.join(cesiumDirPath, "Cesium.js");
console.log(`- Cesium.js exists: ${fs.existsSync(cesiumJsPath) ? "✅" : "❌"}`);

// Check for required assets
console.log("\nChecking required globe assets...");
const requiredAssets = [
  "earth-map.jpg",
  "earth-night.jpg",
  "earth-clouds.png",
  "cloud.png",
  "cloud.svg",
  "pin-red.png",
  "pin-blue.png",
  "pin-red.svg",
  "pin-blue.svg",
];

requiredAssets.forEach((asset) => {
  const assetPath = path.join(assetsDirPath, asset);
  console.log(`- ${asset} exists: ${fs.existsSync(assetPath) ? "✅" : "❌"}`);
});

// Check for Cesium sourcemap files (a good indicator Cesium was copied correctly)
console.log("\nChecking for Cesium sourcemaps...");
const cesiumWorkerPath = path.join(cesiumDirPath, "Workers");
console.log(
  `- Cesium Workers dir exists: ${
    fs.existsSync(cesiumWorkerPath) ? "✅" : "❌"
  }`
);

// Check if package.json has the prepare script
console.log("\nChecking package.json...");
try {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = require(packageJsonPath);

  const hasPrepareScript =
    packageJson.scripts &&
    packageJson.scripts.prepare &&
    packageJson.scripts.prepare.includes("cesium");

  console.log(
    `- prepare script for Cesium exists: ${hasPrepareScript ? "✅" : "❌"}`
  );

  if (!hasPrepareScript) {
    console.log(
      "\n⚠️ Your package.json is missing the prepare script for Cesium."
    );
    console.log("Add this to your package.json scripts section:");
    console.log(
      '  "prepare": "mkdir -p public/cesium && cp -r node_modules/cesium/Build/Cesium/* public/cesium/"'
    );
  }
} catch (error) {
  console.error("Error checking package.json:", error.message);
}

// Check for environment variables
console.log("\nChecking environment variables...");
try {
  const envPath = path.join(process.cwd(), ".env.local");
  const envExists = fs.existsSync(envPath);
  console.log(`- .env.local file exists: ${envExists ? "✅" : "❌"}`);

  if (envExists) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const hasMapboxToken = envContent.includes("NEXT_PUBLIC_MAPBOX_TOKEN");
    console.log(
      `- NEXT_PUBLIC_MAPBOX_TOKEN defined: ${hasMapboxToken ? "✅" : "❌"}`
    );
  }
} catch (error) {
  console.error("Error checking environment variables:", error.message);
}

// Print next steps
console.log("\n===== NEXT STEPS IF ANY CHECKS FAILED =====");
console.log(
  "1. Run 'node scripts/setup-globe-assets.js' to create placeholder assets"
);
console.log("2. Ensure Cesium is installed: npm install cesium");
console.log("3. Run 'npm run prepare' to copy Cesium assets to public folder");
console.log("4. Create a .env.local file with your Mapbox token:");
console.log("   NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here");
console.log("\nIf you're using the globe without real data, you can also try:");
console.log("- Checking the browser console for more specific errors");
console.log(
  "- Simplify the GlobeWithSearch component to render basic Cesium first"
);
console.log("\n============================================\n");
