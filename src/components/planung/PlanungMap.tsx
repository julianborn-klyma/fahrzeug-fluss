import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: 'appointment' | 'team';
}

interface Props {
  markers: MapMarker[];
}

const PlanungMap = ({ markers }: Props) => {
  // Center on Germany by default
  const center: [number, number] = [51.1657, 10.4515];
  const zoom = markers.length > 0 ? 8 : 6;

  // Calculate bounds if we have markers
  const bounds = markers.length > 0
    ? L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number]))
    : undefined;

  return (
    <div className="w-[450px] shrink-0 border-l relative">
      <MapContainer
        center={bounds ? undefined : center}
        bounds={bounds}
        zoom={zoom}
        className="h-full w-full"
        style={{ minHeight: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map(m => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <span className="text-sm font-medium">{m.label}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-[1000] pointer-events-none">
          <p className="text-sm text-muted-foreground text-center px-4">
            Keine Standortdaten vorhanden.<br />
            Koordinaten können in den Objekt-Einstellungen hinterlegt werden.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanungMap;
