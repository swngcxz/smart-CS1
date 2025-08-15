import { Marker, Popup, useMap } from "react-leaflet";
import L, { DivIcon } from "leaflet";
import { useEffect } from "react";
import { BinData } from "@/hooks/useRealTimeData";

interface GPSMarkerProps {
  gpsData: BinData | null;
}

const createGPSIcon = (): DivIcon => {
  return L.divIcon({
    html: `
      <div style="
        background: #3b82f6;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
        animation: pulse 2s infinite;
      ">
        📍
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    className: "custom-gps-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Component to center map on GPS coordinates
function MapCentering({ gpsData }: { gpsData: BinData | null }) {
  const map = useMap();

  useEffect(() => {
    if (gpsData && gpsData.gps_valid && gpsData.latitude && gpsData.longitude) {
      map.setView([gpsData.latitude, gpsData.longitude], map.getZoom());
    }
  }, [gpsData, map]);

  return null;
}

export function GPSMarker({ gpsData }: GPSMarkerProps) {
  if (!gpsData || !gpsData.gps_valid || !gpsData.latitude || !gpsData.longitude) {
    return null;
  }

  const gpsIcon = createGPSIcon();

  return (
    <>
      <MapCentering gpsData={gpsData} />
      <Marker position={[gpsData.latitude, gpsData.longitude]} icon={gpsIcon}>
        <Popup>
          <div className="p-2 min-w-[200px]">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              📍 Real-time GPS Location
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📍 GPS:</span>
                <span className="text-sm font-medium">
                  {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📡 GPS Valid:</span>
                <span className={`text-sm font-medium ${gpsData.gps_valid ? 'text-green-600' : 'text-red-600'}`}>
                  {gpsData.gps_valid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>

              {gpsData.satellites && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🛰️ Satellites:</span>
                  <span className="text-sm font-medium">{gpsData.satellites}</span>
                </div>
              )}

              {gpsData.timestamp && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🕒 Last Update:</span>
                  <span className="text-sm font-medium">
                    {new Date(gpsData.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}

              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 This marker shows your real-time GPS location from the monitoring/bin1 feed.
                  The map automatically centers on this location when GPS is valid.
                </p>
              </div>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
