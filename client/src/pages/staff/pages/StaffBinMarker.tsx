import { Marker, Popup } from "react-leaflet";
import L, { LatLngTuple, DivIcon } from "leaflet";
import { Badge } from "@/components/ui/badge";

interface BinData {
  id: number;
  name: string;
  position: LatLngTuple;
  level: number;
  status: "normal" | "warning" | "critical";
  lastCollection: string;
  route: string;
}

interface BinMarkerProps {
  bin: BinData;
}

const createCustomIcon = (level: number, status: string): DivIcon => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  const color = getStatusColor(status);

  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 10px;
      ">
        ${level}%
      </div>
    `,
    className: "custom-bin-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

export function BinMarker({ bin }: BinMarkerProps) {
  const customIcon = createCustomIcon(bin.level, bin.status);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Marker position={bin.position} icon={customIcon}>
      <Popup>
        <div className="p-2 min-w-[200px]">
          <h3 className="font-semibold text-gray-900 mb-2">{bin.name}</h3>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fill Level:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      bin.status === "critical"
                        ? "bg-red-500"
                        : bin.status === "warning"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${bin.level}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{bin.level}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge
                variant={getStatusBadgeVariant(bin.status)}
                className={bin.status === "warning" ? "bg-yellow-100 text-yellow-800" : ""}
              >
                {bin.status}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Route:</span>
              <span className="text-sm font-medium">{bin.route}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Collection:</span>
              <span className="text-sm font-medium">{bin.lastCollection}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Coordinates:</span>
              <span className="text-xs text-gray-500">
                {bin.position[0].toFixed(4)}, {bin.position[1].toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
