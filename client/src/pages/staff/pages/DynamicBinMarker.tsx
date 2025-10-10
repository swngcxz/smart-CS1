import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapPin, AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { getActiveTimeAgo, getTimeAgo } from "../../../utils/timeUtils";

interface DynamicBinMarkerProps {
  bin: {
    id: string;
    name: string;
    position: [number, number];
    level: number;
    status: "critical" | "warning" | "normal";
    lastCollection: string;
    route: string;
    gps_valid?: boolean;
    satellites?: number;
    timestamp?: number;
    weight_kg?: number;
    distance_cm?: number;
    binData?: any;
    coordinates_source?: string;
    last_active?: string;
    gps_timestamp?: string;
  };
  onBinClick?: (binId: string) => void;
}

// Use the new timeUtils for consistent formatting

const createDynamicIcon = (
  status: string,
  level: number,
  isLive: boolean,
  gpsValid: boolean,
  coordinatesSource?: string
) => {
  const iconSize = 40;
  const iconAnchor = [iconSize / 2, iconSize] as [number, number];

  // Determine main color based on status
  let color = "#10B981"; // green for normal
  if (status === "critical") color = "#EF4444"; // red
  else if (status === "warning") color = "#F59E0B"; // yellow

  // Apply grey/decayed appearance for GPS fallback coordinates
  const isUsingFallback = coordinatesSource === "gps_fallback" || (!gpsValid && coordinatesSource !== "gps_live");
  if (isUsingFallback) color = "#6B7280"; // grey for fallback

  // Create pulsing animation CSS (only for live GPS, not fallback)
  const pulseAnimation =
    isLive && !isUsingFallback
      ? `
    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    @keyframes pulse-dot {
      0% { transform: scale(0.8); }
      50% { transform: scale(1.2); }
      100% { transform: scale(0.8); }
    }
    .pulse-ring { animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
    .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
  `
      : "";

  return L.divIcon({
    html: `
      <style>${pulseAnimation}</style>
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${
          isLive && !isUsingFallback
            ? `
          <div class="pulse-ring" style="
            position: absolute;
            width: ${iconSize}px;
            height: ${iconSize}px;
            border: 3px solid ${color};
            border-radius: 50%;
            opacity: 0.6;
          "></div>
        `
            : ""
        }

        <div class="${isLive && !isUsingFallback ? "pulse-dot" : ""}" style="
          background: ${color};
          width: ${iconSize}px;
          height: ${iconSize}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: white;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          position: relative;
          z-index: 2;
        ">
          ${level}%
        </div>
      </div>
    `,
    className: "dynamic-bin-marker",
    iconSize: [iconSize, iconSize],
    iconAnchor: iconAnchor,
    popupAnchor: [0, -iconSize],
  });
};

export function DynamicBinMarker({ bin, onBinClick }: DynamicBinMarkerProps) {
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Check if bin has live data
  useEffect(() => {
    if (bin.binData && bin.timestamp) {
      const now = Date.now();
      const timeDiff = now - bin.timestamp;
      // Consider data live if it's less than 10 seconds old
      setIsLive(timeDiff < 10000);
      const date = new Date(bin.timestamp);
      setLastUpdate(isNaN(date.getTime()) ? new Date() : date);
    }
  }, [bin.binData, bin.timestamp]);

  const icon = createDynamicIcon(bin.status, bin.level, isLive, bin.gps_valid || false, bin.coordinates_source);

  const getStatusIcon = () => {
    switch (bin.status) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusColor = () => {
    switch (bin.status) {
      case "critical":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-green-600";
    }
  };

  const handleMarkerClick = () => {
    if (onBinClick) onBinClick(bin.id);
  };

  return (
    <Marker position={bin.position} icon={icon}>
      <Popup className="custom-popup" maxWidth={300}>
        <div className="p-3 min-w-[250px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{bin.name}</h3>

              {isLive && bin.coordinates_source !== "gps_fallback" && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">LIVE</span>
                </div>
              )}
              {bin.coordinates_source === "gps_fallback" && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">GPS OFFLINE</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onBinClick && onBinClick(bin.id)}
              className="text-green-600 hover:text-green-700 text-xs font-regular p-0 m-0 bg-transparent"
            >
              Edit
            </button>
          </div>

          <div className="space-y-3">
            {/* Fill Level */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fill Level:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${bin.level}%`,
                      backgroundColor:
                        bin.status === "critical" ? "#EF4444" : bin.status === "warning" ? "#F59E0B" : "#059162ff",
                    }}
                  ></div>
                </div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: bin.status === "critical" ? "#EF4444" : bin.status === "warning" ? "#F59E0B" : "#059162ff",
                  }}
                >
                  {bin.level}%
                </span>
              </div>
            </div>

            {/* Last Collection */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Collection:</span>
              <span className="text-sm text-gray-700">{bin.lastCollection}</span>
            </div>

            {/* GPS Status */}
            {bin.gps_valid !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">GPS:</span>
                <div className="flex items-center gap-1">
                  {bin.gps_valid ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${bin.gps_valid ? "text-green-600" : "text-red-600"}`}>
                    {bin.gps_valid ? `Valid (${bin.satellites || 0} satellites)` : "Invalid"}
                  </span>
                </div>
              </div>
            )}

            {/* Live Sensor Data */}
            {bin.binData && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2 font-medium">Live Sensor Data:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Weight:</span>
                    <span className="font-medium">{bin.weight_kg || 0}kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coordinates:</span>
                    <span className="font-medium text-xs">
                      {bin.position[0].toFixed(4)}, {bin.position[1].toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span className="font-medium">{lastUpdate ? lastUpdate.toLocaleTimeString() : "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monitoring:</span>
                    <span className="font-medium text-green-600 text-xs">
                      {bin.coordinates_source === "gps_fallback" ? "Active (GPS Offline)" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Time Logs */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2 font-medium">Time Logs:</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Last Update:</span>
                  <span className="font-medium text-gray-700">
                    {bin.timestamp ? getTimeAgo(bin.timestamp).text : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GPS Status:</span>
                  <span
                    className={`font-medium ${
                      bin.coordinates_source === "gps_live"
                        ? "text-green-600"
                        : bin.coordinates_source === "gps_cached"
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}
                  >
                    {bin.coordinates_source === "gps_live"
                      ? "Live GPS"
                      : bin.coordinates_source === "gps_cached"
                      ? "Cached GPS"
                      : "No GPS"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bin Active:</span>
                  <span
                    className={`font-medium ${
                      bin.coordinates_source === "gps_live"
                        ? "text-green-600"
                        : bin.coordinates_source === "gps_cached"
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}
                  >
                    {bin.last_active || (bin.timestamp ? getTimeAgo(bin.timestamp).text : "Unknown")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
