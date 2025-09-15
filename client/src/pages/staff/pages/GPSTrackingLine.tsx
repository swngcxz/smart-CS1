import { Polyline } from "react-leaflet";
import { LatLngExpression } from "leaflet";

interface GPSTrackingLineProps {
  gpsHistory: Array<{
    lat: number;
    lng: number;
    timestamp: string;
  }>;
  visible: boolean;
}

export function GPSTrackingLine({ gpsHistory, visible }: GPSTrackingLineProps) {
  if (!visible || gpsHistory.length < 2) {
    return null;
  }

  const pathOptions = {
    color: '#3B82F6',
    weight: 3,
    opacity: 0.8,
    dashArray: '5, 10',
    className: 'gps-tracking-line'
  };

  const positions: LatLngExpression[] = gpsHistory.map(point => [point.lat, point.lng]);

  return (
    <Polyline 
      positions={positions} 
      pathOptions={pathOptions}
    />
  );
}
