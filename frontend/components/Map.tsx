'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const D4_CENTER: [number, number] = [10.7613, 106.7056];

// ============================================================
// Types
// ============================================================
export interface POILocation {
  id: string;
  name: string;
  desc: string;
  category: string;
  lat: number;
  lng: number;
  color: string;
  emoji: string;
}

interface NavStep {
  instruction: string;
  distance: string;
  distanceMeters: number;
  duration: string;
  maneuver: string;
  location: [number, number]; // [lat, lng] của điểm rẽ
}

// ============================================================
// DATA
// ============================================================
const POI_LIST: POILocation[] = [
  { id: 'huynh-hoa', name: 'Bánh mì Huỳnh Hoa', desc: 'Bánh mì ngon nổi tiếng, nhân thịt pate đặc biệt', category: 'Ẩm thực', lat: 10.762, lng: 106.704, color: 'bg-orange-500', emoji: '🥪' },
  { id: 'cho-200', name: 'Chợ 200', desc: 'Thiên đường ăn vặt ẩm thực đường phố Quận 4', category: 'Chợ - Ẩm thực', lat: 10.763, lng: 106.707, color: 'bg-amber-500', emoji: '🛒' },
  { id: 'xom-chieu', name: 'Nhà thờ Xóm Chiếu', desc: 'Công trình tôn giáo & kiến trúc lịch sử lâu đời', category: 'Di tích - Tôn giáo', lat: 10.759, lng: 106.708, color: 'bg-purple-500', emoji: '⛪' },
  { id: 'ben-van-don', name: 'Bến Vân Đồn', desc: 'Đoạn đường ven sông thoáng mát, thích hợp ngắm cảnh', category: 'Danh thắng', lat: 10.764, lng: 106.702, color: 'bg-emerald-500', emoji: '🌳' },
];

// ============================================================
// Helpers: Maneuver → Icon SVG + Text tiếng Việt
// ============================================================
const ManeuverSVG = ({ type, modifier, size = 40 }: { type: string; modifier?: string; size?: number }) => {
  // Trả về SVG icon mũi tên hướng rẽ giống Google Maps
  const color = '#fff';
  if (type === 'arrive') return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>;
  if (type === 'depart') return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><circle cx="12" cy="12" r="6"/></svg>;
  if (type === 'roundabout' || type === 'rotary') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 7V3m0 0l-2 2m2-2l2 2"/></svg>;
  
  // Mũi tên rẽ
  if (modifier?.includes('left') && (type === 'turn' || type === 'end of road' || type === 'fork')) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M14 6l-6 6 6 6V6z"/></svg>;
  }
  if (modifier?.includes('right') && (type === 'turn' || type === 'end of road' || type === 'fork')) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10 6l6 6-6 6V6z"/></svg>;
  }
  if (modifier?.includes('uturn')) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18 11h-5V5l-7 7 7 7v-6h5a1 1 0 001-1v0a1 1 0 00-1-1z"/></svg>;
  }
  // Đi thẳng (default)
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 4l-4 4h3v8h2V8h3l-4-4z"/></svg>;
};

const getManeuverText = (type: string, modifier?: string, name?: string): string => {
  const street = name && name.length > 0 ? ` vào ${name}` : '';
  if (type === 'arrive') return `Bạn đã đến nơi${street}`;
  if (type === 'depart') return `Xuất phát${street}`;
  if (type === 'turn') {
    if (modifier?.includes('left')) return `Rẽ trái${street}`;
    if (modifier?.includes('right')) return `Rẽ phải${street}`;
    if (modifier?.includes('uturn')) return `Quay đầu${street}`;
    return `Đi thẳng${street}`;
  }
  if (type === 'new name' || type === 'continue') return `Tiếp tục${street}`;
  if (type === 'roundabout' || type === 'rotary') return `Vào vòng xuyến${street}`;
  if (type === 'fork') return modifier?.includes('left') ? `Rẽ nhánh trái${street}` : `Rẽ nhánh phải${street}`;
  if (type === 'end of road') return modifier?.includes('left') ? `Cuối đường rẽ trái${street}` : `Cuối đường rẽ phải${street}`;
  if (type === 'merge') return `Nhập vào${street}`;
  return `Đi tiếp${street}`;
};

// Tính khoảng cách giữa 2 tọa độ (Haversine, mét)
const getDistance = (p1: [number, number], p2: [number, number]): number => {
  const R = 6371e3;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(p2[0] - p1[0]);
  const dLon = toRad(p2[1] - p1[1]);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(p1[0])) * Math.cos(toRad(p2[0])) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ============================================================
// Icon factories
// ============================================================
const createPoiIcon = (colorClass: string, emoji: string) => L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="flex flex-col items-center cursor-pointer"><div class="w-8 h-8 rounded-full ${colorClass} flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.2)] border-2 border-white text-sm z-10 relative hover:scale-110 transition-transform">${emoji}</div><div class="w-2.5 h-2.5 ${colorClass} rotate-45 -mt-1.5 border-r-2 border-b-2 border-white shadow-sm z-0 relative"></div></div>`,
  iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
});

const createUserLocationIcon = (headingDeg: number) => L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="relative flex items-center justify-center w-32 h-32 transition-transform duration-300 ease-out" style="transform:rotate(${headingDeg}deg)"><div class="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-28 h-32 origin-bottom" style="background:radial-gradient(circle at 50% 100%,rgba(59,130,246,0.4) 0%,transparent 65%);clip-path:polygon(15% 0,85% 0,50% 100%)"></div><div class="absolute w-5 h-5 bg-blue-600 border-[3px] border-white rounded-full shadow-[0_0_15px_rgba(37,99,235,0.7)]"></div></div>`,
  iconSize: [128, 128], iconAnchor: [64, 64],
});

// Marker đỏ cho đích đến (khi đang dẫn đường)
const createDestinationIcon = () => L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="flex flex-col items-center"><div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg border-2 border-white text-white text-sm font-bold z-10">🏁</div><div class="w-2.5 h-2.5 bg-red-600 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white shadow-sm z-0"></div></div>`,
  iconSize: [32, 40], iconAnchor: [16, 40],
});

// ============================================================
// Sub-components
// ============================================================
function MapEventsHandler({ onDrag }: { onDrag: () => void }) {
  useMapEvents({ dragstart: onDrag });
  return null;
}

function MapFollowUser({ position, active }: { position: [number, number]; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active && position) {
      map.setView(position, Math.max(map.getZoom(), 17), { animate: true });
    }
  }, [position, active, map]);
  return null;
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    const h = () => map.invalidateSize();
    window.addEventListener('resize', h);
    return () => { clearTimeout(t); window.removeEventListener('resize', h); };
  }, [map]);
  return null;
}

function RouteBoundsHandler({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (coords.length > 0 && !fitted.current) {
      fitted.current = true;
      map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], animate: true });
    }
  }, [coords, map]);
  // Reset khi route thay đổi
  useEffect(() => { fitted.current = false; }, [coords]);
  return null;
}

// ============================================================
// COMPONENT CHÍNH
// ============================================================
export default function Map() {
  const [userPos, setUserPos] = useState<[number, number]>(D4_CENTER);
  const [heading, setHeading] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false);
  const [destination, setDestination] = useState<POILocation | null>(null);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving');
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; distanceM: number; durationS: number } | null>(null);
  const [navSteps, setNavSteps] = useState<NavStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showOverview, setShowOverview] = useState(false); // false = đang dẫn đường, true = xem tổng quan

  // GPS + Compass
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
          if (pos.coords.heading !== null && !(window as any).DeviceOrientationEvent) setHeading(pos.coords.heading);
        },
        (err) => console.warn(`GPS (${err.code}):`, err.message),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }
    const handleOri = (e: any) => {
      let h = 0;
      if (e.webkitCompassHeading) h = e.webkitCompassHeading;
      else if (e.alpha !== null) h = 360 - e.alpha;
      setHeading(h);
    };
    window.addEventListener('deviceorientationabsolute', handleOri);
    window.addEventListener('deviceorientation', handleOri);
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientationabsolute', handleOri);
      window.removeEventListener('deviceorientation', handleOri);
    };
  }, []);

  // Auto-update bước hiện tại dựa trên vị trí GPS thực
  useEffect(() => {
    if (!isNavigating || navSteps.length === 0) return;
    // Tìm bước gần nhất với vị trí user
    let closestIdx = currentStepIdx;
    let minDist = Infinity;
    for (let i = currentStepIdx; i < navSteps.length; i++) {
      const d = getDistance(userPos, navSteps[i].location);
      if (d < minDist) { minDist = d; closestIdx = i; }
    }
    // Chỉ tiến lên bước tiếp theo, không quay ngược
    if (closestIdx > currentStepIdx && minDist < 30) {
      setCurrentStepIdx(closestIdx);
    }
  }, [userPos, isNavigating, navSteps, currentStepIdx]);

  // ============================================================
  // ROUTING API (OSRM)
  // ============================================================
  const calculateRoute = useCallback(async (dest: POILocation, mode: 'driving' | 'walking', fromPos?: [number, number]) => {
    setIsLoadingRoute(true);
    setNavSteps([]);
    setCurrentStepIdx(0);
    const startPoint = fromPos || userPos;
    try {
      const start = `${startPoint[1]},${startPoint[0]}`;
      const end = `${dest.lng},${dest.lat}`;
      const serverProfile = mode === 'driving' ? 'car' : 'foot';
      const urlProfile = mode === 'driving' ? 'driving' : 'walking';
      const url = `https://routing.openstreetmap.de/routed-${serverProfile}/route/v1/${urlProfile}/${start};${end}?overview=full&geometries=geojson&steps=true`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
        if (coords.length > 0) coords[0] = startPoint;
        setRouteCoords(coords);

        const distM = route.distance;
        const durS = route.duration;
        const distStr = distM >= 1000 ? `${(distM / 1000).toFixed(1)} km` : `${Math.round(distM)} m`;
        const durationMins = Math.ceil(durS / 60);
        const durStr = durationMins >= 60 ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}p` : `${durationMins} phút`;
        setRouteInfo({ distance: distStr, duration: durStr, distanceM: distM, durationS: durS });

        // Parse steps
        if (route.legs?.[0]?.steps) {
          const steps: NavStep[] = route.legs[0].steps
            .filter((s: any) => s.maneuver)
            .map((s: any) => {
              const d = s.distance;
              const t = Math.ceil(s.duration / 60);
              return {
                instruction: getManeuverText(s.maneuver.type, s.maneuver.modifier, s.name || undefined),
                distance: d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`,
                distanceMeters: d,
                duration: t >= 60 ? `${Math.floor(t / 60)}h ${t % 60}p` : `${t} phút`,
                maneuver: `${s.maneuver.type}${s.maneuver.modifier ? '-' + s.maneuver.modifier : ''}`,
                location: [s.maneuver.location[1], s.maneuver.location[0]] as [number, number],
              };
            });
          setNavSteps(steps);
        }
      } else {
        setRouteCoords([startPoint, [dest.lat, dest.lng]]);
        setRouteInfo({ distance: 'Không tìm thấy', duration: '--', distanceM: 0, durationS: 0 });
      }
    } catch (err) {
      console.warn("Lỗi tìm đường:", err);
      setRouteCoords([startPoint, [dest.lat, dest.lng]]);
      setRouteInfo({ distance: 'Lỗi kết nối', duration: '--', distanceM: 0, durationS: 0 });
    } finally {
      setIsLoadingRoute(false);
    }
  }, [userPos]);

  // Bắt đầu dẫn đường
  const startNavigation = (poi: POILocation) => {
    setDestination(poi);
    setIsNavigating(true);
    setShowOverview(false);
    setIsTracking(true); // Bật theo dõi vị trí
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const fp: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(fp);
          calculateRoute(poi, travelMode, fp);
        },
        () => calculateRoute(poi, travelMode, userPos),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      calculateRoute(poi, travelMode, userPos);
    }
  };

  const changeTravelMode = (mode: 'driving' | 'walking') => {
    setTravelMode(mode);
    if (destination) calculateRoute(destination, mode, userPos);
  };

  const cancelNavigation = () => {
    setIsNavigating(false);
    setDestination(null);
    setRouteCoords([]);
    setRouteInfo(null);
    setNavSteps([]);
    setCurrentStepIdx(0);
    setShowOverview(false);
    setIsTracking(false);
  };

  const enableLiveTracking = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const p = await (DeviceOrientationEvent as any).requestPermission();
        if (p !== 'granted') alert('Vui lòng cấp quyền cảm biến la bàn.');
      } catch (e) { console.error(e); }
    }
    setIsTracking(true);
  };

  // ETA
  const etaStr = routeInfo ? new Date(Date.now() + routeInfo.durationS * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

  const currentStep = navSteps[currentStepIdx];
  const nextStep = navSteps[currentStepIdx + 1];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={userPos} zoom={16} zoomControl={false} className="w-full h-full rounded-2xl border-none absolute inset-0 z-0 bg-[#f4f7f6]">
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        
        <MapEventsHandler onDrag={() => setIsTracking(false)} />
        <MapFollowUser position={userPos} active={isNavigating && !showOverview} />
        <MapResizeHandler />
        {routeCoords.length > 0 && showOverview && <RouteBoundsHandler coords={routeCoords} />}

        {/* Polyline - Viền + Đường chính */}
        {routeCoords.length > 0 && (
          <>
            <Polyline positions={routeCoords} pathOptions={{ color: '#000', weight: 10, opacity: 0.08, lineCap: 'round', lineJoin: 'round' }} />
            <Polyline positions={routeCoords} pathOptions={{ 
              color: travelMode === 'driving' ? '#4285F4' : '#34A853', 
              weight: 6, opacity: 0.95, 
              dashArray: travelMode === 'walking' ? '6, 10' : undefined,
              lineCap: 'round', lineJoin: 'round' 
            }} />
          </>
        )}

        {/* Marker đích đến (khi dẫn đường) */}
        {isNavigating && destination && (
          <Marker position={[destination.lat, destination.lng]} icon={createDestinationIcon()} />
        )}

        {/* Marker User */}
        <Marker position={userPos} icon={createUserLocationIcon(heading)}>
          <Popup><div className="text-center p-1"><p className="text-blue-600 font-bold text-sm">Vị trí của bạn</p></div></Popup>
        </Marker>

        {/* Marker POI (ẩn khi đang dẫn đường) */}
        {!isNavigating && POI_LIST.map((poi) => (
          <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={createPoiIcon(poi.color, poi.emoji)}>
            <Popup className="rounded-xl overflow-hidden shadow-lg p-0">
              <div className="p-3 max-w-[220px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{poi.emoji}</span>
                  <h4 className="font-bold text-gray-900 text-sm leading-tight">{poi.name}</h4>
                </div>
                <span className="inline-block text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full mb-2">{poi.category}</span>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{poi.desc}</p>
                <button onClick={() => startNavigation(poi)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-lg shadow flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  Chỉ đường tới đây
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ================================================================ */}
      {/* CHẾ ĐỘ DẪN ĐƯỜNG TOÀN MÀN HÌNH (Google Maps Style)             */}
      {/* ================================================================ */}
      {isNavigating && (
        <>
          {/* ---- THANH TRÊN: Bước tiếp theo (Google Maps Green/Blue Bar) ---- */}
          <div className={`absolute top-0 left-0 right-0 z-[1000] ${travelMode === 'driving' ? 'bg-[#4285F4]' : 'bg-[#34A853]'} shadow-xl`}>
            {isLoadingRoute ? (
              <div className="px-5 py-4 flex items-center gap-3 text-white">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-sm">Đang tính toán tuyến đường...</span>
              </div>
            ) : currentStep ? (
              <div className="flex items-stretch">
                {/* Icon hướng rẽ (cột trái) */}
                <div className="w-[72px] flex flex-col items-center justify-center px-2 py-3 border-r border-white/20">
                  <ManeuverSVG type={currentStep.maneuver.split('-')[0]} modifier={currentStep.maneuver.split('-').slice(1).join('-')} size={36} />
                  <span className="text-white/90 text-[11px] font-bold mt-1">{currentStep.distance}</span>
                </div>

                {/* Hướng dẫn chính (cột phải) */}
                <div className="flex-1 px-4 py-3 flex flex-col justify-center min-w-0">
                  <p className="text-white font-bold text-[15px] leading-snug truncate">
                    {currentStep.instruction}
                  </p>
                  {nextStep && (
                    <p className="text-white/70 text-xs mt-1 truncate">
                      Sau đó: {nextStep.instruction}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* ---- THANH DƯỚI: Tổng quan lộ trình (ETA + Distance + Kết thúc) ---- */}
          <div className="absolute bottom-[72px] lg:bottom-0 left-0 right-0 z-[1000] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-2xl lg:rounded-none">
            {/* Chọn phương tiện */}
            <div className="flex items-center border-b border-gray-100">
              <button
                onClick={() => changeTravelMode('driving')}
                className={`flex-1 py-2 lg:py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition border-b-2 ${
                  travelMode === 'driving' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-800'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                Xe
              </button>
              <button
                onClick={() => changeTravelMode('walking')}
                className={`flex-1 py-2 lg:py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition border-b-2 ${
                  travelMode === 'walking' ? 'text-emerald-600 border-emerald-600' : 'text-gray-500 border-transparent hover:text-gray-800'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>
                Đi bộ
              </button>
            </div>

            {/* Thông tin tổng quan */}
            <div className="px-3 lg:px-4 py-2.5 lg:py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 lg:gap-4">
                <div>
                  <p className={`text-xl lg:text-2xl font-extrabold ${travelMode === 'driving' ? 'text-blue-600' : 'text-emerald-600'}`}>
                    {routeInfo?.duration || '...'}
                  </p>
                  <p className="text-[10px] lg:text-[11px] text-gray-500 font-medium">{routeInfo?.distance || '...'}</p>
                </div>
                <div className="border-l border-gray-200 pl-3 lg:pl-4">
                  <p className="text-xs lg:text-sm font-bold text-gray-900">Đến lúc {etaStr}</p>
                  <p className="text-[10px] lg:text-[11px] text-gray-500 truncate max-w-[120px] lg:max-w-none">
                    {destination?.name}
                  </p>
                </div>
              </div>

              <button
                onClick={cancelNavigation}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-4 lg:py-2.5 lg:px-5 rounded-full shadow transition-colors shrink-0"
              >
                Kết thúc
              </button>
            </div>

            {/* Nút xem tổng quan / quay lại dẫn đường */}
            <div className="border-t border-gray-100 px-4 py-1.5 lg:py-2 flex items-center justify-center">
              <button
                onClick={() => { setShowOverview(!showOverview); if (showOverview) setIsTracking(true); }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {showOverview ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                    Quay lại dẫn đường
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                    Xem tổng quan lộ trình
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Nút quay về theo dõi */}
          {showOverview && (
            <button
              onClick={() => { setShowOverview(false); setIsTracking(true); }}
              className="absolute bottom-44 lg:bottom-36 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition"
              title="Quay về vị trí của tôi"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v2m0 12v2m8-8h-2M6 12H4m12 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </button>
          )}
        </>
      )}

      {/* Nút Định Vị (chỉ hiện khi KHÔNG dẫn đường) */}
      {!isNavigating && (
        <button
          onClick={enableLiveTracking}
          className={`absolute bottom-20 lg:bottom-4 left-4 z-[1000] p-3 rounded-xl shadow-lg border transition-all duration-300 ${
            isTracking ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
          title="Trở về vị trí của tôi"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v2m0 12v2m8-8h-2M6 12H4m12 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      )}
    </div>
  );
}
