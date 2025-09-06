import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Navigation, MapPin, Wifi, Satellite } from "lucide-react";

interface GPSMarkerProps {
  gpsData?: {
    latitude?: number;
    longitude?: number;
    gps_valid?: boolean;
    satellites?: number;
    timestamp?: string;
  };
}

const getGPSIcon = (gpsValid: boolean) => {
  const iconSize = 25;
  const iconAnchor = [iconSize / 2, iconSize] as [number, number];
  
  const color = gpsValid ? "#3B82F6" : "#6B7280"; // blue if valid, gray if invalid
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: ${iconSize}px;
        height: ${iconSize}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
        animation: ${gpsValid ? 'pulse 2s infinite' : 'none'};
      ">
        <span style="color: white;">📍</span>
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          width: 8px;
          height: 8px;
          background: ${gpsValid ? '#10B981' : '#EF4444'};
          border-radius: 50%;
          border: 2px solid white;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    className: "custom-gps-marker",
    iconSize: [iconSize, iconSize],
    iconAnchor: iconAnchor,
    popupAnchor: [0, -iconSize],
  });
};

export function GPSMarker({ gpsData }: GPSMarkerProps) {
  if (!gpsData || !gpsData.latitude || !gpsData.longitude) {
    return null;
  }

  const icon = getGPSIcon(gpsData.gps_valid || false);

  return (
    <Marker position={[gpsData.latitude, gpsData.longitude]} icon={icon}>
      <Popup className="custom-popup">
        <div className="p-2 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Live GPS Location</h3>
            <div className={`w-2 h-2 rounded-full ${gpsData.gps_valid ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Coordinates:</span>
              <span className="text-sm font-mono text-gray-900">
                {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">GPS Status:</span>
              <div className="flex items-center gap-1">
                <Wifi className={`w-4 h-4 ${gpsData.gps_valid ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm font-medium ${
                  gpsData.gps_valid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {gpsData.gps_valid ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>
            
            {gpsData.satellites && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Satellites:</span>
                <div className="flex items-center gap-1">
                  <Satellite className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">{gpsData.satellites}</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Update:</span>
              <span className="text-sm text-gray-700">
                {gpsData.timestamp ? new Date(gpsData.timestamp).toLocaleTimeString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
