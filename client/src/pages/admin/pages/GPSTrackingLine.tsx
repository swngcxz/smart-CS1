import { Polyline, Popup } from "react-leaflet";
import { LatLngTuple } from "leaflet";

interface GPSTrackingLineProps {
  gpsHistory: Array<{lat: number, lng: number, timestamp: number}>;
  visible: boolean;
}

export function GPSTrackingLine({ gpsHistory, visible }: GPSTrackingLineProps) {
  if (!visible || gpsHistory.length < 2) {
    return null;
  }

  // Convert GPS history to LatLngTuple array for the polyline
  const path: LatLngTuple[] = gpsHistory.map(point => [point.lat, point.lng]);

  // Calculate total distance
  const totalDistance = calculateTotalDistance(path);
  
  // Calculate time span
  const timeSpan = gpsHistory.length > 1 
    ? Math.round((gpsHistory[gpsHistory.length - 1].timestamp - gpsHistory[0].timestamp) / 1000 / 60) // minutes
    : 0;

  return (
    <Polyline
      positions={path}
      color="#3b82f6"
      weight={3}
      opacity={0.8}
      dashArray="10, 5"
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            🗺️ GPS Tracking Path
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">📍 Points:</span>
              <span className="text-sm font-medium">{gpsHistory.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">📏 Distance:</span>
              <span className="text-sm font-medium">{totalDistance.toFixed(2)} km</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">⏱️ Time Span:</span>
              <span className="text-sm font-medium">{timeSpan} min</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">🕒 Start:</span>
              <span className="text-sm font-medium">
                {new Date(gpsHistory[0]?.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">🕒 End:</span>
              <span className="text-sm font-medium">
                {new Date(gpsHistory[gpsHistory.length - 1]?.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 This line shows the GPS movement path over time. 
                The dashed blue line represents the historical route taken.
              </p>
            </div>
          </div>
        </div>
      </Popup>
    </Polyline>
  );
}

// Helper function to calculate total distance in kilometers
function calculateTotalDistance(path: LatLngTuple[]): number {
  if (path.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    totalDistance += calculateDistance(path[i-1], path[i]);
  }
  
  return totalDistance;
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(point1: LatLngTuple, point2: LatLngTuple): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2[0] - point1[0]) * Math.PI / 180;
  const dLon = (point2[1] - point1[1]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
