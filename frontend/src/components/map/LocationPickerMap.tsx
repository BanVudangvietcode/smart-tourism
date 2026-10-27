'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface PoiMarkerInfo {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  categoryName?: string;
}

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number, suggestedAddress?: string) => void;
  existingPois?: PoiMarkerInfo[];
  currentPoiName?: string;
  pinIcon?: string;
  pinColor?: string;
}

// Icon cho ghim kéo chọn vị trí chính (Draggable Pin)
const createDraggablePickerIcon = (emoji = '📍', color = '#e11d48') => {
  const isHex = color && (color.startsWith('#') || color.startsWith('rgb'));
  const bgStyle = isHex ? `style="background-color: ${color};"` : '';
  const bgClass = isHex ? '' : (color || 'bg-rose-600');

  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="flex flex-col items-center cursor-grab active:cursor-grabbing group">
        <div class="px-2.5 py-0.5 bg-slate-900/90 text-white text-[10px] font-black rounded-full shadow-lg whitespace-nowrap mb-0.5 border border-white/80 animate-bounce tracking-tight">
          ${emoji} Kéo hoặc bấm bản đồ
        </div>
        <div class="w-10 h-10 rounded-full ${bgClass} flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.35)] border-2 border-white text-lg relative z-10 hover:scale-110 transition-transform" ${bgStyle}>
          ${emoji}
        </div>
        <div class="w-3.5 h-3.5 ${bgClass} rotate-45 -mt-2 border-r-2 border-b-2 border-white shadow-xs relative z-0" ${bgStyle}></div>
      </div>
    `,
    iconSize: [140, 75],
    iconAnchor: [70, 72],
  });
};

// Icon cho các quán lân cận đã có (Reference Markers)
const createNearbyPoiIcon = (name: string) => {
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="flex items-center gap-1 bg-white/90 backdrop-blur-xs border border-slate-300 px-2 py-0.5 rounded-full shadow-xs text-slate-700 text-[10px] font-bold max-w-[120px] truncate hover:scale-105 transition">
        <span>🍲</span>
        <span class="truncate">${name}</span>
      </div>
    `,
    iconSize: [120, 24],
    iconAnchor: [60, 12],
  });
};

// Component lắng nghe sự kiện click trên bản đồ
function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const map = useMap();
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
      map.panTo(e.latlng, { animate: true });
    },
  });
  return null;
}

// Component tự động pan tới tọa độ mới khi thay đổi từ bên ngoài
function CenterMapOnCoord({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const current = map.getCenter();
      const dist = current.distanceTo([lat, lng]);
      if (dist > 5) {
        map.panTo([lat, lng], { animate: true, duration: 0.5 });
      }
    }
  }, [lat, lng, map]);
  return null;
}

// Fix lỗi Leaflet map render trong modal / tabs
function MapSizeInvalidator() {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  existingPois = [],
  currentPoiName = '',
  pinIcon = '📍',
  pinColor = '#e11d48',
}: LocationPickerMapProps) {
  // Tọa độ mặc định: Trung tâm Quận 4 (10.7613, 106.7056)
  const currentLat = latitude && !isNaN(latitude) ? latitude : 10.7613;
  const currentLng = longitude && !isNaN(longitude) ? longitude : 106.7056;

  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null);
  const [showManualInputs, setShowManualInputs] = useState(false);

  const pickerIcon = useMemo(
    () => createDraggablePickerIcon(pinIcon, pinColor),
    [pinIcon, pinColor]
  );

  // Xử lý khi marker được kéo thả xong (dragend)
  const handleMarkerDragEnd = (e: any) => {
    const marker = e.target;
    if (marker) {
      const pos = marker.getLatLng();
      const roundedLat = parseFloat(pos.lat.toFixed(6));
      const roundedLng = parseFloat(pos.lng.toFixed(6));
      onChange(roundedLat, roundedLng);
    }
  };

  // Xử lý khi bấm vào điểm bất kỳ trên bản đồ
  const handleMapClick = (lat: number, lng: number) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));
    onChange(roundedLat, roundedLng);
  };

  // Lấy vị trí GPS hiện tại từ trình duyệt
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        onChange(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        alert(`Không thể lấy vị trí hiện tại: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Lấy địa chỉ tự động từ tọa độ qua OpenStreetMap Nominatim
  const handleReverseGeocode = async () => {
    setIsReverseGeocoding(true);
    setGeocodedAddress(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLat}&lon=${currentLng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          // Trích xuất địa chỉ ngắn gọn thân thiện
          const addr = data.address || {};
          const parts: string[] = [];
          if (addr.house_number) parts.push(addr.house_number);
          if (addr.road) parts.push(addr.road);
          if (addr.suburb || addr.quarter || addr.neighbourhood) {
            parts.push(addr.suburb || addr.quarter || addr.neighbourhood);
          }
          if (addr.city_district || addr.district) {
            parts.push(addr.city_district || addr.district);
          }
          const suggested = parts.length > 0 ? parts.join(', ') : data.display_name;
          setGeocodedAddress(suggested);
          onChange(currentLat, currentLng, suggested);
        }
      }
    } catch {
      // Bỏ qua lỗi mạng reverse geocode nếu có
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Thanh công cụ và hiển thị tọa độ */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-bold text-slate-800">Tọa độ đã chọn:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-rose-700 font-bold">
            {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-bold text-[11px] shadow-2xs flex items-center gap-1 transition cursor-pointer"
            title="Định vị vị trí hiện tại của bạn"
          >
            <span>🎯</span>
            <span>{isLocating ? 'Đang lấy...' : 'Vị trí của tôi'}</span>
          </button>

          <button
            type="button"
            onClick={handleReverseGeocode}
            disabled={isReverseGeocoding}
            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-200 font-bold text-[11px] shadow-2xs flex items-center gap-1 transition cursor-pointer"
            title="Tự động lấy tên đường/địa chỉ từ điểm ghim"
          >
            <span>{isReverseGeocoding ? '⏳' : '✨'}</span>
            <span>{isReverseGeocoding ? 'Đang tra...' : 'Lấy địa chỉ từ ghim'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualInputs(!showManualInputs)}
            className="px-2 py-1 text-slate-400 hover:text-slate-600 text-[11px] font-medium"
            title="Chỉnh số liệu kinh/vĩ độ thủ công"
          >
            {showManualInputs ? 'Ẩn số' : '⚙️ Nhập số'}
          </button>
        </div>
      </div>

      {/* Hiển thị địa chỉ gợi ý nếu vừa tra cứu */}
      {geocodedAddress && (
        <div className="text-[11px] bg-purple-50/80 border border-purple-200/80 text-purple-900 px-3 py-1.5 rounded-xl flex items-center justify-between">
          <span className="truncate">
            📍 Địa chỉ tìm thấy: <b>{geocodedAddress}</b>
          </span>
          <span className="text-[10px] text-emerald-700 font-bold shrink-0 ml-2">✓ Đã điền</span>
        </div>
      )}

      {/* Khung Bản đồ Leaflet tương tác */}
      <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner bg-slate-100 z-0">
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={16}
          scrollWheelZoom={true}
          zoomControl={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Lắng nghe click để di chuyển ghim */}
          <MapClickHandler onPick={handleMapClick} />

          {/* Căn giữa map khi có thay đổi */}
          <CenterMapOnCoord lat={currentLat} lng={currentLng} />

          {/* Fix invalidateSize sau khi modal mở */}
          <MapSizeInvalidator />

          {/* Ghim chính kéo chọn (Draggable Pin) */}
          <Marker
            position={[currentLat, currentLng]}
            draggable={true}
            icon={pickerIcon}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          >
            <Popup offset={[0, -60]}>
              <div className="text-xs p-1 text-center font-bold text-slate-800">
                <p>{currentPoiName || 'Điểm đã chọn'}</p>
                <p className="font-mono text-[10px] text-rose-600 mt-0.5">
                  {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
                </p>
                <p className="text-[9px] text-slate-400 font-normal mt-0.5">
                  Kéo ghim hoặc bấm bất kỳ đâu trên bản đồ để đổi vị trí
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Các quán lân cận khác để làm mốc đối chiếu */}
          {existingPois
            .filter((p) => p.latitude && p.longitude && (Math.abs(p.latitude - currentLat) > 0.0001 || Math.abs(p.longitude - currentLng) > 0.0001))
            .slice(0, 15)
            .map((p) => (
              <Marker
                key={p.id}
                position={[p.latitude, p.longitude]}
                icon={createNearbyPoiIcon(p.name)}
                eventHandlers={{
                  click: () => {
                    onChange(p.latitude, p.longitude);
                  },
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.categoryName || 'Ẩm thực Quận 4'}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Hướng dẫn góc dưới bản đồ */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-md border border-slate-200 text-[10px] font-semibold text-slate-600 pointer-events-none flex items-center gap-1.5">
          <span>💡</span>
          <span>Bấm hoặc kéo ghim 📍 đến đúng vị trí quán trên bản đồ</span>
        </div>
      </div>

      {/* Nhập thủ công (nếu cần chỉnh số liệu cực kỳ chính xác) */}
      {showManualInputs && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-fadeIn text-xs">
          <div>
            <label className="text-slate-500 font-bold block mb-1">Vĩ độ (Latitude)</label>
            <input
              type="number"
              step="any"
              value={currentLat}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0, currentLng)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono"
            />
          </div>
          <div>
            <label className="text-slate-500 font-bold block mb-1">Kinh độ (Longitude)</label>
            <input
              type="number"
              step="any"
              value={currentLng}
              onChange={(e) => onChange(currentLat, parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}

