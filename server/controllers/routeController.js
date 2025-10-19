const axios = require('axios');

// Route calculation controller
const routeController = {
  // Calculate route between two points
  calculateRoute: async (req, res) => {
    try {
      const { startLat, startLng, endLat, endLng, mode = 'driving' } = req.body;

      // Validate input
      if (!startLat || !startLng || !endLat || !endLng) {
        return res.status(400).json({
          success: false,
          message: 'Missing required coordinates'
        });
      }

      // Validate coordinate ranges
      if (startLat < -90 || startLat > 90 || endLat < -90 || endLat > 90 ||
          startLng < -180 || startLng > 180 || endLng < -180 || endLng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates'
        });
      }

      // Calculate distance and duration using Haversine formula
      const distance = this.calculateDistance(startLat, startLng, endLat, endLng);
      const duration = this.estimateDuration(distance, mode);

      // Create a simple straight-line route (in production, use a routing service)
      const route = {
        coordinates: [
          { latitude: startLat, longitude: startLng },
          { latitude: endLat, longitude: endLng }
        ],
        distance: distance,
        duration: duration,
        mode: mode
      };

      res.json({
        success: true,
        data: route
      });

    } catch (error) {
      console.error('Route calculation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate route',
        error: error.message
      });
    }
  },

  // Get directions using external API (Google Maps, OpenRouteService, etc.)
  getDirections: async (req, res) => {
    try {
      const { startLat, startLng, endLat, endLng, mode = 'driving' } = req.body;

      // Validate input
      if (!startLat || !startLng || !endLat || !endLng) {
        return res.status(400).json({
          success: false,
          message: 'Missing required coordinates'
        });
      }

      // For now, return a simple route calculation
      // In production, integrate with Google Directions API or OpenRouteService
      const distance = this.calculateDistance(startLat, startLng, endLat, endLng);
      const duration = this.estimateDuration(distance, mode);

      const directions = {
        routes: [{
          legs: [{
            distance: { value: distance, text: this.formatDistance(distance) },
            duration: { value: duration * 60, text: this.formatDuration(duration) },
            start_location: { lat: startLat, lng: startLng },
            end_location: { lat: endLat, lng: endLng }
          }],
          overview_polyline: {
            points: this.encodePolyline([
              { lat: startLat, lng: startLng },
              { lat: endLat, lng: endLng }
            ])
          }
        }],
        status: 'OK'
      };

      res.json({
        success: true,
        data: directions
      });

    } catch (error) {
      console.error('Directions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get directions',
        error: error.message
      });
    }
  },

  // Calculate distance between two points using Haversine formula
  calculateDistance: function(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  },

  // Estimate duration based on distance and mode
  estimateDuration: function(distanceInMeters, mode) {
    let speed; // meters per second
    
    switch (mode) {
      case 'walking':
        speed = 1.4; // ~5 km/h
        break;
      case 'cycling':
        speed = 4.2; // ~15 km/h
        break;
      case 'driving':
        speed = 13.9; // ~50 km/h (city driving)
        break;
      default:
        speed = 1.4;
    }

    return distanceInMeters / speed; // Duration in seconds
  },

  // Format distance for display
  formatDistance: function(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  },

  // Format duration for display
  formatDuration: function(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  },

  // Simple polyline encoding (for basic straight-line routes)
  encodePolyline: function(points) {
    // This is a simplified implementation
    // In production, use a proper polyline encoding library
    return points.map(point => `${point.lat},${point.lng}`).join('|');
  },

  // Get nearby bins for route planning
  getNearbyBins: async (req, res) => {
    try {
      const { lat, lng, radius = 1000 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Missing coordinates'
        });
      }

      // This would typically query your database for nearby bins
      // For now, return mock data
      const nearbyBins = [
        {
          id: 'BIN001',
          latitude: parseFloat(lat) + 0.001,
          longitude: parseFloat(lng) + 0.001,
          fillLevel: 75,
          location: 'Nearby Location 1'
        },
        {
          id: 'BIN002',
          latitude: parseFloat(lat) - 0.001,
          longitude: parseFloat(lng) + 0.001,
          fillLevel: 45,
          location: 'Nearby Location 2'
        }
      ];

      res.json({
        success: true,
        data: nearbyBins
      });

    } catch (error) {
      console.error('Nearby bins error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get nearby bins',
        error: error.message
      });
    }
  }
};

module.exports = routeController;
