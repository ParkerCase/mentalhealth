// Test script for PostGIS geometry parsing
function parsePostGISGeometry(hexString) {
  try {
    // PostGIS hex format: SRID=4326;POINT(lng lat)
    // Hex format: 0101000020E6100000 + 16 bytes for lng + 16 bytes for lat
    if (hexString.startsWith("0101000020E6100000")) {
      const coordHex = hexString.substring(18); // Remove SRID and type prefix
      if (coordHex.length >= 32) {
        const lngHex = coordHex.substring(0, 16);
        const latHex = coordHex.substring(16, 32);

        // Convert hex to float (little-endian)
        const lngBytes = new Uint8Array(
          lngHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
        );
        const latBytes = new Uint8Array(
          latHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
        );

        const lngView = new DataView(lngBytes.buffer);
        const latView = new DataView(latBytes.buffer);

        const lng = lngView.getFloat64(0, true); // true for little-endian
        const lat = latView.getFloat64(0, true);

        return { lat, lng };
      }
    }
    return null;
  } catch (error) {
    console.error("Error parsing PostGIS geometry:", error);
    return null;
  }
}

// Test with the sample data from the database
const testGeometries = [
  "0101000020E610000055C1A8A44EE855C00E4FAF9465F04440", // The ManKind Project - Chicago
  "0101000020E61000004182E2C7988F5DC0F46C567DAE064140", // Evryman - Los Angeles
  "0101000020E6100000AED85F764F4A5DC0A4DFBE0E9C5B4040", // Sacred Sons - San Diego
];

console.log("🧪 Testing PostGIS geometry parsing...\n");

testGeometries.forEach((geometry, index) => {
  const coords = parsePostGISGeometry(geometry);
  console.log(`Test ${index + 1}:`);
  console.log(`  Input: ${geometry}`);
  console.log(`  Result:`, coords);
  if (coords) {
    console.log(
      `  Formatted: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
    );
  }
  console.log("");
});

// Expected coordinates (approximate):
// Chicago: ~41.8781, -87.6298
// Los Angeles: ~34.0522, -118.2437
// San Diego: ~32.7157, -117.1611
