#!/usr/bin/env node

/**
 * Script to set up the required assets for the Globe component
 * This will create simple SVG images for the required assets
 */

const fs = require("fs");
const path = require("path");

// Path where assets will be placed
const assetsDir = path.join(process.cwd(), "public", "assets");

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  console.log(`Creating assets directory at ${assetsDir}`);
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create simple cloud SVG
const cloudSvg = `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <filter id="blur" x="0" y="0">
    <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
  </filter>
  <ellipse cx="50" cy="50" rx="40" ry="30" fill="white" filter="url(#blur)" opacity="0.8"/>
</svg>
`;

// Create simple fog SVG
const fogSvg = `
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <filter id="blur" x="0" y="0">
    <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
  </filter>
  <rect x="10" y="30" width="80" height="40" fill="white" filter="url(#blur)" opacity="0.6"/>
</svg>
`;

// Create simple pin SVGs
const pinBlueSvg = `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(16, 32) scale(1, -1) translate(-16, 0)">
    <path d="M16 32c-5.523 0-10-4.477-10-10 0-8 10-22 10-22s10 14 10 22c0 5.523-4.477 10-10 10z" fill="#3b82f6"/>
    <circle cx="16" cy="22" r="4" fill="white"/>
  </g>
</svg>
`;

const pinRedSvg = `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(16, 32) scale(1, -1) translate(-16, 0)">
    <path d="M16 32c-5.523 0-10-4.477-10-10 0-8 10-22 10-22s10 14 10 22c0 5.523-4.477 10-10 10z" fill="#ef4444"/>
    <circle cx="16" cy="22" r="4" fill="white"/>
  </g>
</svg>
`;

// Write files
const files = [
  { name: "cloud.svg", content: cloudSvg },
  { name: "fog.svg", content: fogSvg },
  { name: "pin-blue.svg", content: pinBlueSvg },
  { name: "pin-red.svg", content: pinRedSvg },
];

files.forEach((file) => {
  const filePath = path.join(assetsDir, file.name);
  fs.writeFileSync(filePath, file.content);
  console.log(`Created ${filePath}`);
});

// Create versions with .png extension by copying the SVG files
// In a real implementation, you'd want to convert SVG to PNG properly
files.forEach((file) => {
  const svgPath = path.join(assetsDir, file.name);
  const pngPath = path.join(assetsDir, file.name.replace(".svg", ".png"));

  // Simple copy for demonstration
  fs.copyFileSync(svgPath, pngPath);
  console.log(`Created ${pngPath} (copied from SVG)`);
});

console.log("\nAssets created successfully!");
console.log(
  "Note: For production, you should replace these with higher quality images."
);
console.log(
  "These simple SVG/PNG files are just placeholders that will work with the Globe component."
);
