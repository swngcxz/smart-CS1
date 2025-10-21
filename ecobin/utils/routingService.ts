import { LocationPoint } from './locationUtils';
import { MAPS_CONFIG } from '@/config/maps';

export interface RouteResult {
  success: boolean;
  coordinates: LocationPoint[];
  distance: number;
  duration: string;
  error?: string;
}

export interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      steps: Array<{
        polyline: { points: string };
        distance: { value: number; text: string };
        duration: { value: number; text: string };
      }>;
    }>;
    overview_polyline: { points: string };
  }>;
  status: string;
}

class RoutingService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';

  constructor() {
    // Get API key from configuration
    this.apiKey = MAPS_CONFIG.apiKey;
  }

  /**
   * Decode Google's polyline encoding to get coordinate array
   */
  private decodePolyline(encoded: string): LocationPoint[] {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return poly;
  }

  /**
   * Get route from Google Maps Directions API
   */
  async getRoute(
    origin: LocationPoint,
    destination: LocationPoint,
    mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
  ): Promise<RouteResult> {
    try {
      console.log('[RoutingService] Getting route from Google Maps API:', {
        origin,
        destination,
        mode
      });

      // Check if API key is configured
      if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
        console.warn('[RoutingService] Google Maps API key not configured, using fallback');
        return this.getFallbackRoute(origin, destination, mode);
      }

      const url = new URL(this.baseUrl);
      url.searchParams.append('origin', `${origin.latitude},${origin.longitude}`);
      url.searchParams.append('destination', `${destination.latitude},${destination.longitude}`);
      url.searchParams.append('mode', mode);
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('avoid', 'ferries'); // Avoid ferries for better routing

      const response = await fetch(url.toString());
      const data: DirectionsResponse = await response.json();

      if (data.status !== 'OK') {
        console.error('[RoutingService] Google Maps API error:', data.status);
        return this.getFallbackRoute(origin, destination, mode);
      }

      if (!data.routes || data.routes.length === 0) {
        console.error('[RoutingService] No routes found');
        return this.getFallbackRoute(origin, destination, mode);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      // Decode the polyline to get detailed coordinates
      const coordinates = this.decodePolyline(route.overview_polyline.points);

      console.log('[RoutingService] Route calculated successfully:', {
        distance: leg.distance.text,
        duration: leg.duration.text,
        coordinatesCount: coordinates.length
      });

      return {
        success: true,
        coordinates,
        distance: leg.distance.value, // Distance in meters
        duration: leg.duration.text, // Duration as text (e.g., "5 mins")
      };

    } catch (error) {
      console.error('[RoutingService] Error getting route from Google Maps:', error);
      return this.getFallbackRoute(origin, destination, mode);
    }
  }

  /**
   * Fallback route calculation (straight line) when Google Maps API is unavailable
   */
  private getFallbackRoute(
    origin: LocationPoint,
    destination: LocationPoint,
    mode: 'driving' | 'walking' | 'transit' | 'bicycling'
  ): RouteResult {
    console.log('[RoutingService] Using fallback route calculation');

    // Calculate straight-line distance
    const distance = this.calculateDistance(origin, destination);
    
    // Estimate duration based on mode
    const duration = this.estimateDuration(distance, mode);

    return {
      success: true,
      coordinates: [origin, destination], // Straight line
      distance,
      duration,
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Estimate duration based on distance and travel mode
   */
  private estimateDuration(distance: number, mode: string): string {
    let speed: number; // meters per second

    switch (mode) {
      case 'walking':
        speed = 1.4; // ~5 km/h
        break;
      case 'bicycling':
        speed = 4.2; // ~15 km/h
        break;
      case 'driving':
        speed = 13.9; // ~50 km/h (city driving)
        break;
      default:
        speed = 13.9;
    }

    const durationSeconds = distance / speed;
    const minutes = Math.round(durationSeconds / 60);

    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  }

  /**
   * Format distance for display
   */
  formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }
}

// Export singleton instance
export const routingService = new RoutingService();
export default routingService;
