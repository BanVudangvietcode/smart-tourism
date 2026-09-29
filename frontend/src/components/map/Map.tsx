'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { MapPOI, NavStep, RouteInfo } from '@/types';
import { D4_CENTER, POI_LIST } from '@/lib/map-data';
import { createPoiIcon, createUserLocationIcon, createDestinationIcon } from '@/lib/map-icons';
import { fetchRoute, getDistance } from '@/lib/routing';

// ─── Các thành phần phụ trợ của Bản đồ (Map Sub-components) ───

/**
 * DragHandler: Lắng nghe các tương tác của người dùng lên bản đồ.
 * Nếu người dùng chủ động vuốt, chạm hoặc click, ta sẽ tắt tính năng "Tự động bám theo GPS".
 */
function DragHandler({ onDrag }: { onDrag: () => void }) {
  useMapEvents({ 
    dragstart: onDrag // Chuẩn cho cả điện thoại (vuốt tay) và máy tính (kéo chuột)
  });
  return null;
}

/**
 * FollowUser: Tự động di chuyển camera bám theo vị trí người dùng.
 * Được kích hoạt khi `active` = true.
 */
function FollowUser({ pos, active }: { pos: [number, number]; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    // Chỉ chạy nếu tính năng bám đuôi đang bật và tọa độ hợp lệ
    if (active && typeof pos[0] === 'number' && typeof pos[1] === 'number' && !isNaN(pos[0]) && !isNaN(pos[1])) {
      const dist = map.getCenter().distanceTo(pos);
      // Thuật toán "Lazy pan": Chỉ kéo camera nếu GPS lệch quá 5 mét so với tâm hiện tại,
      // giúp bản đồ không bị rung giật (jitter) liên tục do sai số GPS.
      if (dist > 5) { 
        map.closePopup();
        map.panTo(pos, { animate: true, duration: 0.5 });
      }
    }
  }, [pos, active, map]);
  return null;
}

/**
 * AutoResize: Giải quyết lỗi kinh điển của Leaflet "bản đồ xám xịt".
 * Khi đổi tab (từ ẩn sang hiện), vùng chứa bản đồ thay đổi kích thước đột ngột từ 0x0 lên full màn hình.
 * Hàm `map.invalidateSize()` ép Leaflet tính toán lại kích thước thật để tải toàn bộ bản đồ.
 */
function AutoResize({ isActive }: { isActive: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (isActive) {
      // Đợi một chút (50ms) để DOM kịp vẽ xong display:block rồi mới đo đạc lại.
      // Gọi thêm lần 2 (300ms) để phòng hờ các animation chuyển trang làm sai kích thước.
      const t = setTimeout(() => map.invalidateSize(), 50);
      const t2 = setTimeout(() => map.invalidateSize(), 300);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [isActive, map]);

  useEffect(() => {
    const h = () => map.invalidateSize();
    window.addEventListener('resize', h); // Bắt sự kiện xoay màn hình điện thoại
    return () => window.removeEventListener('resize', h);
  }, [map]);
  return null;
}

/**
 * FitRoute: Tự động zoom bản đồ sao cho vừa vặn với toàn bộ tuyến đường.
 */
function FitRoute({ coords, once }: { coords: [number, number][]; once: boolean }) {
  const map = useMap();
  useEffect(() => {
    // padding: [60,60] giúp đường đi không bị lẹm sát mép màn hình.
    if (coords.length && once) map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], animate: true });
  }, [coords, once, map]);
  return null;
}

// ─── Maneuver SVG Icon ───────────────────────────────────────────
const ManeuverSVG = ({ type, modifier, size = 36 }: { type: string; modifier?: string; size?: number }) => {
  const c = '#fff';
  if (type === 'arrive') return <svg width={size} height={size} viewBox="0 0 24 24" fill={c}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>;
  if (type === 'depart') return <svg width={size} height={size} viewBox="0 0 24 24" fill={c}><circle cx="12" cy="12" r="6"/></svg>;
  if (modifier?.includes('left')) return <svg width={size} height={size} viewBox="0 0 24 24" fill={c}><path d="M14 6l-6 6 6 6V6z"/></svg>;
  if (modifier?.includes('right')) return <svg width={size} height={size} viewBox="0 0 24 24" fill={c}><path d="M10 6l6 6-6 6V6z"/></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={c}><path d="M12 4l-4 4h3v8h2V8h3l-4-4z"/></svg>;
};

interface MapProps {
  isActive?: boolean;
  onNavChange?: (isNav: boolean) => void;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function Map({ isActive = true, onNavChange }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const hasInitializedGPS = useRef(false);

  // GPS & Compass
  const safeCenter: [number, number] = (Array.isArray(D4_CENTER) && typeof D4_CENTER[0] === 'number') ? D4_CENTER : [10.7613, 106.7056];
  const [userPos, setUserPos] = useState<[number, number]>(safeCenter);
  const [hasRealGPS, setHasRealGPS] = useState(false);
  const [heading, setHeading] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  // Navigation
  const [isNav, setIsNav] = useState(false);
  const [dest, setDest] = useState<MapPOI | null>(null);
  const [mode, setMode] = useState<'driving' | 'walking'>('driving');
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [steps, setSteps] = useState<NavStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(false);

  useEffect(() => {
    onNavChange?.(isNav);
  }, [isNav, onNavChange]);

  // Lắng nghe tín hiệu GPS liên tục từ thiết bị (hoạt động ngầm)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (p) => {
          const newPos: [number, number] = [p.coords.latitude, p.coords.longitude];
          setUserPos(newPos);
          setHasRealGPS(true); // Đánh dấu đã có GPS thật để bắt đầu hiển thị chấm xanh
          
          // Lần đầu tiên bắt được sóng GPS, chỉ kéo bản đồ về vị trí của user (không bật bám đuôi)
          if (!hasInitializedGPS.current) {
            hasInitializedGPS.current = true;
            mapRef.current?.setView(newPos, 16, { animate: true });
          }

          // Lấy la bàn (nếu trình duyệt/thiết bị hỗ trợ trả về qua GPS)
          if (p.coords.heading !== null && !(window as any).DeviceOrientationEvent) setHeading(p.coords.heading);
        },
        (e) => console.warn(`GPS(${e.code}):`, e.message),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }
    const onOri = (e: any) => { setHeading(e.webkitCompassHeading ?? (e.alpha !== null ? 360 - e.alpha : 0)); };
    window.addEventListener('deviceorientationabsolute', onOri);
    window.addEventListener('deviceorientation', onOri);
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientationabsolute', onOri);
      window.removeEventListener('deviceorientation', onOri);
    };
  }, []);

  // Auto-advance step khi GPS gần điểm rẽ
  useEffect(() => {
    if (!isNav || !steps.length) return;
    for (let i = stepIdx; i < steps.length; i++) {
      if (getDistance(userPos, steps[i].location) < 30) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStepIdx(i); break;
      }
    }
  }, [userPos, isNav, steps, stepIdx]);

  // Tính đường
  const calcRoute = useCallback(async (poi: MapPOI, m: 'driving' | 'walking', from?: [number, number]) => {
    setLoading(true);
    try {
      const { coords, info, steps: s } = await fetchRoute(from || userPos, poi, m);
      setRouteCoords(coords);
      setRouteInfo(info);
      setSteps(s);
      setStepIdx(0);
    } catch { /* handled in fetchRoute */ }
    setLoading(false);
  }, [userPos]);

  const startNav = (poi: MapPOI) => {
    try { mapRef.current?.closePopup(); } catch { /* */ }
    setDest(poi); setIsNav(true); setOverview(false); setIsTracking(true);
    calcRoute(poi, mode);
  };

  const changeMode = (m: 'driving' | 'walking') => { setMode(m); if (dest) calcRoute(dest, m); };
  const stopNav = () => { setIsNav(false); setDest(null); setRouteCoords([]); setRouteInfo(null); setSteps([]); setStepIdx(0); setOverview(false); setIsTracking(false); };

  const recenterToUser = (targetZoom = 17) => {
    if (isNav) setIsTracking(true); // Chỉ tự động bám đuôi liên tục nếu đang dẫn đường
    setOverview(false);

    // Lập tức đưa camera về vị trí đã biết nếu hợp lệ
    if (userPos && typeof userPos[0] === 'number' && typeof userPos[1] === 'number' && !isNaN(userPos[0]) && !isNaN(userPos[1])) {
      mapRef.current?.setView(userPos, targetZoom, { animate: true });
    }

    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try { (DeviceOrientationEvent as any).requestPermission(); } catch { /* */ }
    }
  };

  const eta = routeInfo?.eta || '';

  const cur = steps[stepIdx];
  const nxt = steps[stepIdx + 1];
  const lineColor = mode === 'driving' ? '#4285F4' : '#34A853';

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer ref={mapRef} center={userPos} zoom={16} zoomControl={false} className="w-full h-full rounded-2xl border-none absolute inset-0 z-0 bg-[#f4f7f6]">
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia</a> &copy; <a href="http://openstreetmap.org">OSM</a>'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        <DragHandler onDrag={() => setIsTracking(false)} />
        <FollowUser pos={userPos} active={isTracking && !overview} />
        <AutoResize isActive={isActive} />
        {routeCoords.length > 0 && overview && <FitRoute coords={routeCoords} once={overview} />}

        {/* Route line */}
        {routeCoords.length > 0 && (
          <>
            <Polyline positions={routeCoords} pathOptions={{ color: '#000', weight: 10, opacity: 0.08, lineCap: 'round', lineJoin: 'round' }} />
            <Polyline positions={routeCoords} pathOptions={{ color: lineColor, weight: 6, opacity: 0.95, dashArray: mode === 'walking' ? '6, 10' : undefined, lineCap: 'round', lineJoin: 'round' }} />
          </>
        )}

        {/* Destination marker */}
        {isNav && dest && <Marker position={[dest.lat, dest.lng]} icon={createDestinationIcon()} />}

        {/* User marker (chỉ hiện khi có GPS thật) */}
        {hasRealGPS && (
          <Marker position={userPos} icon={createUserLocationIcon(heading)}>
            <Popup><p className="text-blue-600 font-bold text-sm text-center">Vị trí của bạn</p></Popup>
          </Marker>
        )}

        {/* POI markers */}
        {POI_LIST.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={createPoiIcon(p.color, p.emoji)}>
            <Popup className="rounded-xl overflow-hidden shadow-lg p-0">
              <div className="p-3 max-w-[220px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{p.emoji}</span>
                  <h4 className="font-bold text-gray-900 text-sm">{p.name}</h4>
                </div>
                <span className="inline-block text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full mb-2">{p.category}</span>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{p.desc}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startNav(p);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  Chỉ đường tới đây
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── NAVIGATION UI ───────────────────────────────────── */}
      {isNav && (
        <>
          {/* Top bar: current step */}
          <div className={`absolute top-0 left-0 right-0 z-[1000] ${mode === 'driving' ? 'bg-[#4285F4]' : 'bg-[#34A853]'} shadow-xl`}>
            {loading ? (
              <div className="px-5 py-4 flex items-center gap-3 text-white">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="font-bold text-sm">Đang tính tuyến đường...</span>
              </div>
            ) : cur ? (
              <div className="flex items-stretch">
                <div className="w-[72px] flex flex-col items-center justify-center px-2 py-3 border-r border-white/20">
                  <ManeuverSVG type={cur.maneuver.split('-')[0]} modifier={cur.maneuver.split('-').slice(1).join('-')} />
                  <span className="text-white/90 text-[11px] font-bold mt-1">{cur.distance}</span>
                </div>
                <div className="flex-1 px-4 py-3 min-w-0">
                  <p className="text-white font-bold text-[15px] leading-snug truncate">{cur.instruction}</p>
                  {nxt && <p className="text-white/70 text-xs mt-1 truncate">Sau đó: {nxt.instruction}</p>}
                </div>
              </div>
            ) : null}
          </div>

          {/* Bottom bar: route info */}
          <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.15)] rounded-t-3xl pb-safe">
            <div className="flex border-b border-gray-100">
              <button onClick={() => changeMode('driving')} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 ${mode === 'driving' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'}`}>🚗 Xe</button>
              <button onClick={() => changeMode('walking')} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 ${mode === 'walking' ? 'text-emerald-600 border-emerald-600' : 'text-gray-500 border-transparent'}`}>🚶 Đi bộ</button>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className={`text-xl font-extrabold ${mode === 'driving' ? 'text-blue-600' : 'text-emerald-600'}`}>{routeInfo?.duration || '...'}</p>
                  <p className="text-[10px] text-gray-500">{routeInfo?.distance}</p>
                </div>
                <div className="border-l border-gray-200 pl-3">
                  <p className="text-xs font-bold text-gray-900">Đến lúc {eta}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{dest?.name}</p>
                </div>
              </div>
              <button onClick={stopNav} className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-5 rounded-full shadow transition shrink-0">Kết thúc</button>
            </div>
            <div className="border-t border-gray-100 py-2.5 flex justify-center bg-gray-50/50">
              <button onClick={() => { setOverview(!overview); if (overview) setIsTracking(true); }} className="text-xs font-bold text-blue-600 flex items-center gap-1.5 px-4 py-1 rounded-full hover:bg-blue-50 transition active:scale-95">
                {overview ? '📍 Quay lại dẫn đường' : '🗺️ Xem tổng quan'}
              </button>
            </div>
          </div>

          {(overview || !isTracking) && (
            <button
              onClick={() => recenterToUser(17)}
              className="absolute bottom-36 right-4 z-[1000] bg-white text-blue-600 px-3.5 py-2.5 rounded-full shadow-2xl border border-gray-200 active:scale-95 transition-all flex items-center gap-1.5 font-bold text-xs"
              title="Quay lại vị trí của mình"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v2m0 12v2m8-8h-2M6 12H4m12 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Về vị trí</span>
            </button>
          )}
        </>
      )}

      {/* Location button (khi không dẫn đường) */}
      {!isNav && (
        <button
          onClick={() => recenterToUser(16)}
          className={`absolute bottom-24 lg:bottom-6 right-4 z-[1000] p-3.5 rounded-full shadow-xl border transition-all active:scale-95 ${
            isTracking ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/30' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
          title="Quay về vị trí của tôi"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v2m0 12v2m8-8h-2M6 12H4m12 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      )}
    </div>
  );
}

