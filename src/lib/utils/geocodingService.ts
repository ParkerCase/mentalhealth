// src/lib/utils/geocodingService.ts

/**
 * Geocoding service using OpenStreetMap's Nominatim API
 * This is a free service with usage limits (1 request per second)
 * https://operations.osmfoundation.org/policies/nominatim/
 */

export interface GeocodingResult {
    lat: number;
    lng: number;
    name: string;
    displayName: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
      postcode?: string;
    };
    boundingbox?: number[];
  }
  
  /**
   * Search for a location by name/address
   * @param query The location to search for
   * @returns Promise with geocoding results
   */
  export async function geocodeAddress(query: string): Promise<GeocodingResult[]> {
    try {
      // Add a slight delay to ensure we don't exceed rate limits
      // Use this in production to avoid being rate-limited
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Encode the query properly
      const encodedQuery = encodeURIComponent(query);
      
      // Call the Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1`,
        {
          headers: {
            // Adding a user agent is required by Nominatim usage policy
            'User-Agent': 'SocialConnection-App',
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`);
      }
  
      const data = await response.json();
  
      // Transform the response to our standard format
      return data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        name: item.name || query,
        displayName: item.display_name,
        address: {
          city: item.address?.city || item.address?.town || item.address?.village,
          state: item.address?.state,
          country: item.address?.country,
          postcode: item.address?.postcode,
        },
        boundingbox: item.boundingbox?.map(parseFloat),
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }
  
  /**
   * Reverse geocode a lat/lng coordinate to an address
   * @param lat Latitude
   * @param lng Longitude
   * @returns Promise with reverse geocoding result
   */
  export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      // Add a slight delay to ensure we don't exceed rate limits
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SocialConnection-App',
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status: ${response.status}`);
      }
  
      const item = await response.json();
      
      if (!item || !item.lat || !item.lon) {
        return null;
      }
  
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        name: item.name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: item.display_name,
        address: {
          city: item.address?.city || item.address?.town || item.address?.village,
          state: item.address?.state,
          country: item.address?.country,
          postcode: item.address?.postcode,
        },
        boundingbox: item.boundingbox?.map(parseFloat),
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }