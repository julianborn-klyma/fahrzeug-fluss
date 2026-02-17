import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const monteurIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const appointmentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: 'appointment' | 'monteur';
}

export interface DistanceLine {
  from: [number, number];
  to: [number, number];
  label: string;
  distanceKm: number;
}

interface Props {
  markers: MapMarker[];
  distanceLines?: DistanceLine[];
}

/** Helper: calculate distance in km between two lat/lng points (Haversine) */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* Auto-fit bounds when markers change */
const FitBounds = ({ markers }: { markers: MapMarker[] }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [markers, map]);
  return null;
};

const PlanungMap = ({ markers, distanceLines = [] }: Props) => {
  const center: [number, number] = [51.1657, 10.4515];

  return (
    <div className="w-[450px] shrink-0 border-l relative">
      <MapContainer
        center={center}
        zoom={6}
        className="h-full w-full"
        style={{ minHeight: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />

        {markers.map(m => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={m.type === 'monteur' ? monteurIcon : appointmentIcon}
          >
            <Popup>
              <span className="text-sm font-medium">{m.label}</span>
              <br />
              <span className="text-xs text-muted-foreground">{m.type === 'monteur' ? 'Monteur' : 'Termin'}</span>
            </Popup>
          </Marker>
        ))}

        {distanceLines.map((line, i) => (
          <Polyline
            key={i}
            positions={[line.from, line.to]}
            pathOptions={{ color: 'hsl(var(--primary))', weight: 2, dashArray: '6 4' }}
          >
            <Popup>
              <span className="text-sm font-medium">{line.label}</span>
              <br />
              <span className="text-xs">{line.distanceKm.toFixed(1)} km Luftlinie</span>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>

      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-[1000] pointer-events-none">
          <p className="text-sm text-muted-foreground text-center px-4">
            Keine Standortdaten vorhanden.<br />
            Adressen können in den Benutzer-Einstellungen hinterlegt werden.
          </p>
        </div>
      )}

      {distanceLines.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-card/90 backdrop-blur-sm rounded-md border p-2 space-y-1">
          {distanceLines.map((line, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="font-medium truncate">{line.label}</span>
              <span className="text-muted-foreground ml-2 shrink-0">{line.distanceKm.toFixed(1)} km</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanungMap;
