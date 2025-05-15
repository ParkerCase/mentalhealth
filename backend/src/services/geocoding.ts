import fetch from 'node-fetch';
import { GeocodingResult } from '../types';

/**
 * Geocode an address to coordinates using Mapbox API
 */
export const geocodeAddress = async (address: string): Promise<GeocodingResult[]> => {
  try {
    const mapboxToken = process.env.MAPBOX_TOKEN;
    
    if (!mapboxToken) {
      throw new Error('MAPBOX_TOKEN environment variable is required');
    }
    
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=5`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json() as any;
    
    return data.features.map((feature: any) => {
      // Get place name and context info
      const placeName = feature.place_name;
      const coordinates = feature.geometry.coordinates; // [longitude, latitude]
      
      // Extract city and state from context
      const context = feature.context || [];
      let city = '';
      let state = '';
      let country = '';
      let postcode = '';
      
      context.forEach((item: any) => {
        if (item.id.startsWith('place')) {
          city = item.text;
        } else if (item.id.startsWith('region')) {
          state = item.text;
        } else if (item.id.startsWith('country')) {
          country = item.text;
        } else if (item.id.startsWith('postcode')) {
          postcode = item.text;
        }
      });
      
      // If city isn't in context but feature is a place, use the feature name
      if (!city && feature.place_type.includes('place')) {
        city = feature.text;
      }
      
      return {
        lng: coordinates[0],
        lat: coordinates[1],
        name: feature.text,
        displayName: placeName,
        address: {
          city,
          state,
          country,
          postcode
        },
        boundingbox: feature.bbox
      };
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to an address
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodingResult | null> => {
  try {
    const mapboxToken = process.env.MAPBOX_TOKEN;
    
    if (!mapboxToken) {
      throw new Error('MAPBOX_TOKEN environment variable is required');
    }
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place,region`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json() as any;
    
    if (!data.features || data.features.length === 0) {
      return null;
    }
    
    const feature = data.features[0];
    
    // Extract city and state from context
    const context = feature.context || [];
    let city = '';
    let state = '';
    let country = '';
    let postcode = '';
    
    context.forEach((item: any) => {
      if (item.id.startsWith('place')) {
        city = item.text;
      } else if (item.id.startsWith('region')) {
        state = item.text;
      } else if (item.id.startsWith('country')) {
        country = item.text;
      } else if (item.id.startsWith('postcode')) {
        postcode = item.text;
      }
    });
    
    // If city isn't in context but feature is a place, use the feature name
    if (!city && feature.place_type.includes('place')) {
      city = feature.text;
    }
    
    return {
      lng,
      lat,
      name: feature.text,
      displayName: feature.place_name,
      address: {
        city,
        state,
        country,
        postcode
      },
      boundingbox: feature.bbox
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};