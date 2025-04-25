// src/lib/utils/helpers.ts
import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format a date with a specific format
 */
export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  return format(new Date(date), formatStr);
}

/**
 * Format a date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format a number with commas (e.g., 1,000)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Generate a random color based on a string
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Check if we're running on the client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Parse URL parameters
 */
export function getQueryParams(): Record<string, string> {
  if (!isClient()) return {};
  
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Get a user's city and state from coordinates
 */
export async function getLocationFromCoordinates(lat: number, lng: number): Promise<{city: string, state: string} | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,region`
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    
    let city = '';
    let state = '';
    
    // Extract place (city) and region (state) from the response
    data.features.forEach((feature: any) => {
      if (feature.place_type.includes('place')) {
        city = feature.text;
      }
      if (feature.place_type.includes('region')) {
        state = feature.text;
      }
    });
    
    return { city, state };
  } catch (error) {
    console.error('Error getting location from coordinates:', error);
    return null;
  }
}

/**
 * Get coordinates from address
 */
export async function getCoordinatesFromAddress(address: string): Promise<[number, number] | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].center as [number, number]; // [longitude, latitude]
    }
    
    return null;
  } catch (error) {
    console.error('Error getting coordinates from address:', error);
    return null;
  }
}