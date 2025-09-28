import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapPin, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface BinMarkerProps {
  bin: {
    id: number;
    name: string;
    position: [number, number];
    level: number;
    status: "critical" | "warning" | "normal";
    lastCollection: string;
    route: string;
    binData?: any;
  };
}

const getStatusIcon = (status: string, level: number) => {
  const iconSize = 30;
  const iconAnchor = [iconSize / 2, iconSize] as [number, number];
  
  let color = "#10B981"; // green for normal
  let icon = "🗑️";
  
  if (status === "critical") {
    color = "#EF4444"; // red
    icon = "🚨";
  } else if (status === "warning") {
    color = "#F59E0B"; // yellow
    icon = "⚠️";
  }

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
        font-size: 16px;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
      ">
        <span>${icon}</span>
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          color: ${color};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        ">
          ${level}%
        </div>
      </div>
    `,
    className: "custom-bin-marker",
    iconSize: [iconSize, iconSize],
    iconAnchor: iconAnchor,
    popupAnchor: [0, -iconSize],
  });
};

export function BinMarker({ bin }: BinMarkerProps) {
  const icon = getStatusIcon(bin.status, bin.level);

  return (
    <Marker position={bin.position} icon={icon}>
      <Popup className="custom-popup">
        <div className="p-2 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">{bin.name}</h3>
            {bin.binData && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">Live</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <div className="flex items-center gap-1">
                {bin.status === "critical" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                {bin.status === "warning" && <Clock className="w-4 h-4 text-yellow-500" />}
                {bin.status === "normal" && <CheckCircle className="w-4 h-4 text-green-500" />}
                <span className={`text-sm font-medium ${
                  bin.status === "critical" ? "text-red-600" :
                  bin.status === "warning" ? "text-yellow-600" :
                  "text-green-600"
                }`}>
                  {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Level:</span>
              <span className="text-sm font-medium text-gray-900">{bin.level}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Route:</span>
              <span className="text-sm text-gray-700">{bin.route}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Collection:</span>
              <span className="text-sm text-gray-700">{bin.lastCollection}</span>
            </div>

            {bin.binData && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Live Sensor Data:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Weight: {bin.binData.weight_percent || 0}%</div>
                  <div>Distance: {bin.binData.height_percent || 0}%</div>
                  <div>GPS: {bin.binData.gps_valid ? "Valid" : "Invalid"}</div>
                  <div>Updated: {(() => {
                      const date = new Date(bin.binData.timestamp || Date.now());
                      return isNaN(date.getTime()) ? 'Invalid timestamp' : date.toLocaleTimeString();
                    })()}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
