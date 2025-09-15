import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapPin, AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

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
  };
}

const createDynamicIcon = (status: string, level: number, isLive: boolean, gpsValid: boolean) => {
  const iconSize = 40;
  const iconAnchor = [iconSize / 2, iconSize] as [number, number];
  
  let color = "#10B981"; // green for normal
  let pulseColor = "#34D399"; // lighter green for pulse
  let icon = "🗑️";
  
  if (status === "critical") {
    color = "#EF4444"; // red
    pulseColor = "#F87171"; // lighter red
    icon = "🚨";
  } else if (status === "warning") {
    color = "#F59E0B"; // yellow
    pulseColor = "#FBBF24"; // lighter yellow
    icon = "⚠️";
  }

  // Create pulsing animation CSS
  const pulseAnimation = isLive ? `
    @keyframes pulse-ring {
      0% {
        transform: scale(0.8);
        opacity: 1;
      }
      100% {
        transform: scale(2.4);
        opacity: 0;
      }
    }
    @keyframes pulse-dot {
      0% {
        transform: scale(0.8);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(0.8);
      }
    }
    .pulse-ring {
      animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
    .pulse-dot {
      animation: pulse-dot 2s ease-in-out infinite;
    }
  ` : '';

  return L.divIcon({
    html: `
      <style>${pulseAnimation}</style>
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${isLive ? `
          <div class="pulse-ring" style="
            position: absolute;
            width: ${iconSize}px;
            height: ${iconSize}px;
            border: 3px solid ${pulseColor};
            border-radius: 50%;
            opacity: 0.6;
          "></div>
        ` : ''}
        
        <div class="${isLive ? 'pulse-dot' : ''}" style="
          background: ${color};
          width: ${iconSize}px;
          height: ${iconSize}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          position: relative;
          z-index: 2;
        ">
          <span>${icon}</span>
        </div>
        
        <div style="
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          color: ${color};
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: 1px solid ${color};
          z-index: 3;
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

export function DynamicBinMarker({ bin }: DynamicBinMarkerProps) {
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Check if bin has live data
  useEffect(() => {
    if (bin.binData && bin.timestamp) {
      const now = Date.now();
      const timeDiff = now - bin.timestamp;
      // Consider data live if it's less than 10 seconds old
      setIsLive(timeDiff < 10000);
      setLastUpdate(new Date(bin.timestamp));
    }
  }, [bin.binData, bin.timestamp]);

  const icon = createDynamicIcon(
    bin.status, 
    bin.level, 
    isLive, 
    bin.gps_valid || false
  );

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

  return (
    <Marker position={bin.position} icon={icon}>
      <Popup className="custom-popup" maxWidth={300}>
        <div className="p-3 min-w-[250px]">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">{bin.name}</h3>
            {isLive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">LIVE</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
                </span>
              </div>
            </div>
            
            {/* Fill Level */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fill Level:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      bin.status === "critical" ? "bg-red-500" :
                      bin.status === "warning" ? "bg-yellow-500" :
                      "bg-green-500"
                    }`}
                    style={{ width: `${bin.level}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{bin.level}%</span>
              </div>
            </div>
            
            {/* Route */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Route:</span>
              <span className="text-sm text-gray-700">{bin.route}</span>
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
                  <span className={`text-sm font-medium ${
                    bin.gps_valid ? "text-green-600" : "text-red-600"
                  }`}>
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
                    <span>Distance:</span>
                    <span className="font-medium">{bin.distance_cm || 0}cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coordinates:</span>
                    <span className="font-medium text-xs">
                      {bin.position[0].toFixed(4)}, {bin.position[1].toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span className="font-medium">
                      {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
