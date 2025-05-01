// scripts/setup-globe-assets.js

const fs = require("fs");
const path = require("path");

// Create necessary directories
const assetsDir = path.join(process.cwd(), "public", "assets");
const cesiumDir = path.join(process.cwd(), "public", "cesium");

// Check if directories exist, create if they don't
if (!fs.existsSync(assetsDir)) {
  console.log(`Creating assets directory at ${assetsDir}`);
  fs.mkdirSync(assetsDir, { recursive: true });
}

if (!fs.existsSync(cesiumDir)) {
  console.log(`Creating Cesium directory at ${cesiumDir}`);
  fs.mkdirSync(cesiumDir, { recursive: true });
  console.log(
    `Reminder: Run 'npm run prepare' to copy Cesium assets to public folder`
  );
}

// Create necessary placeholder files for the Globe component
const createPlaceholderFiles = () => {
  // Pin markers
  const pinRedSvg = `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(16, 32) scale(1, -1) translate(-16, 0)">
    <path d="M16 32c-5.523 0-10-4.477-10-10 0-8 10-22 10-22s10 14 10 22c0 5.523-4.477 10-10 10z" fill="#ef4444"/>
    <circle cx="16" cy="22" r="4" fill="white"/>
  </g>
</svg>
`;

  const pinBlueSvg = `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(16, 32) scale(1, -1) translate(-16, 0)">
    <path d="M16 32c-5.523 0-10-4.477-10-10 0-8 10-22 10-22s10 14 10 22c0 5.523-4.477 10-10 10z" fill="#3b82f6"/>
    <circle cx="16" cy="22" r="4" fill="white"/>
  </g>
</svg>
`;

  const cloudSvg = `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <filter id="blur" x="0" y="0">
    <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
  </filter>
  <ellipse cx="50" cy="50" rx="40" ry="30" fill="white" filter="url(#blur)" opacity="0.8"/>
</svg>
`;

  // Write the files
  fs.writeFileSync(path.join(assetsDir, "pin-red.svg"), pinRedSvg.trim());
  fs.writeFileSync(path.join(assetsDir, "pin-blue.svg"), pinBlueSvg.trim());
  fs.writeFileSync(path.join(assetsDir, "cloud.svg"), cloudSvg.trim());

  // Create a simple 1x1 PNG for cloud placeholder
  const simplePngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0x60, 0x00, 0x02, 0x00,
    0x00, 0x05, 0x00, 0x01, 0x5b, 0xf0, 0x66, 0xe0, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  fs.writeFileSync(path.join(assetsDir, "cloud.png"), simplePngBuffer);
  fs.writeFileSync(path.join(assetsDir, "pin-red.png"), simplePngBuffer);
  fs.writeFileSync(path.join(assetsDir, "pin-blue.png"), simplePngBuffer);

  console.log("Created placeholder files in assets directory");
};

createPlaceholderFiles();

// Update package.json to add prepare script for Cesium
try {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = require(packageJsonPath);

  if (
    !packageJson.scripts ||
    !packageJson.scripts.prepare ||
    !packageJson.scripts.prepare.includes("cesium")
  ) {
    console.log("Adding Cesium prepare script to package.json");

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    packageJson.scripts.prepare =
      "mkdir -p public/cesium && cp -r node_modules/cesium/Build/Cesium/* public/cesium/";

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log("Updated package.json with Cesium prepare script");
    console.log('Run "npm run prepare" to copy Cesium assets to public folder');
  } else {
    console.log("Cesium prepare script already exists in package.json");
  }
} catch (error) {
  console.error("Error updating package.json:", error);
}

console.log("\nSetup complete! Make sure to:");
console.log('1. Run "npm run prepare" to copy Cesium assets');
console.log(
  "2. Check that the public/assets and public/cesium directories exist and contain the necessary files"
);
console.log(
  "3. If using Cesium Ion, set up your access token in the environment variables"
);
