'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// District 4, Ho Chi Minh City coordinates
const D4_CENTER: [number, number] = [10.7613, 106.7056];

export default function Map() {
  // Fix leaflet marker icon issue in Next.js
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={D4_CENTER} 
        zoom={16} 
        zoomControl={false} // Disable default zoom control to use our custom one or keep it cleaner
        className="w-full h-full rounded-2xl border-none absolute inset-0 z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location (Fake 30m radius) */}
        <Circle 
          center={D4_CENTER} 
          radius={50} 
          pathOptions={{ 
            fillColor: '#3b82f6', 
            fillOpacity: 0.2, 
            color: '#2563eb', 
            weight: 2 
          }} 
        />
        
        {/* Map Marker - Location */}
        <Marker position={D4_CENTER}>
          <Popup className="font-bold text-gray-900">
            Vị trí của bạn (Quận 4)
          </Popup>
        </Marker>

        {/* POI Markers */}
        <Marker position={[10.762, 106.704]}>
          <Popup>Bánh mì Huỳnh Hoa</Popup>
        </Marker>
        
        <Marker position={[10.763, 106.707]}>
          <Popup>Chợ 200</Popup>
        </Marker>
        
        <Marker position={[10.759, 106.708]}>
          <Popup>Nhà thờ Xóm Chiếu</Popup>
        </Marker>

        <Marker position={[10.764, 106.702]}>
          <Popup>Bến Vân Đồn</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
