'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import { MapPOI, NavStep, RouteInfo, PoiSummary } from '@/types';
import { D4_CENTER, POI_LIST } from '@/lib/map-data';
import { createPoiIcon, createUserLocationIcon, createDestinationIcon } from '@/lib/map-icons';
import { fetchRoute, getDistance } from '@/lib/routing';
import { fetchPois, getAudioStreamUrl, trackAudioListen } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import PoiDetailModal from '@/components/poi/PoiDetailModal';

// ─── Các thành phần phụ trợ của Bản đồ (Map Sub-components) ───

function MapEventsHandler({ onDrag, onMapClick }: { onDrag: () => void; onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ 
    dragstart: onDrag,
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function FollowUser({ pos, active }: { pos: [number, number]; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active && typeof pos[0] === 'number' && typeof pos[1] === 'number' && !isNaN(pos[0]) && !isNaN(pos[1])) {
      const dist = map.getCenter().distanceTo(pos);
      if (dist > 5) { 
        map.closePopup();
        map.panTo(pos, { animate: true, duration: 0.5 });
      }
    }
  }, [pos, active, map]);
  return null;
}

function AutoResize({ isActive }: { isActive: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (isActive) {
      const t = setTimeout(() => map.invalidateSize(), 50);
      const t2 = setTimeout(() => map.invalidateSize(), 300);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [isActive, map]);

  useEffect(() => {
    const h = () => map.invalidateSize();
    window.addEventListener('resize', h);
    window.addEventListener('orientationchange', h);
    return () => window.removeEventListener('resize', h);
      window.removeEventListener('orientationchange', h);
  }, [map]);
  return null;
}

function FitRoute({ coords, once }: { coords: [number, number][]; once: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length && once) map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], animate: true });
  }, [coords, once, map]);
  return null;
}

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
  targetPoiId?: number | string | null;
  autoPlayEnabled?: boolean;
  onToggleAutoPlay?: () => void;
}

export default function Map({
  isActive = true,
  onNavChange,
  targetPoiId,
  autoPlayEnabled = true,
  onToggleAutoPlay,
}: MapProps) {
  const { deviceId } = useAuth();
  const mapRef = useRef<L.Map | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitializedGPS = useRef(false);

  // GPS & Compass
  const safeCenter: [number, number] = (Array.isArray(D4_CENTER) && typeof D4_CENTER[0] === 'number') ? D4_CENTER : [10.7613, 106.7056];
  const [userPos, setUserPos] = useState<[number, number]>(safeCenter);
  const [hasRealGPS, setHasRealGPS] = useState(false);
  const [isInsecureOrigin, setIsInsecureOrigin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setIsInsecureOrigin(!window.isSecureContext && !isLocal);
    }
  }, []);
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

  // Live Backend POIs (Khởi tạo ngay từ POI_LIST chuẩn)
  const [mapPois, setMapPois] = useState<MapPOI[]>(POI_LIST);
  const [modalPoiId, setModalPoiId] = useState<number | string | null>(null);
  const [showSimPanel, setShowSimPanel] = useState(false);

  // ─── TỰ ĐỘNG PHÁT & HÀNG ĐỢI ÂM THANH (AUTO-PLAY & QUEUE) ───
  const [currentAudioPoi, setCurrentAudioPoi] = useState<MapPOI | null>(null);
  const [audioQueue, setAudioQueue] = useState<MapPOI[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Lưu lịch sử các POI đã phát trong phiên để tránh lặp vô tận khi đứng yên một chỗ
  const playedPoiIds = useRef<Set<string | number>>(new Set());
  const currentAudioPoiRef = useRef<MapPOI | null>(null);
  const audioQueueRef = useRef<MapPOI[]>([]);

  useEffect(() => {
    currentAudioPoiRef.current = currentAudioPoi;
  }, [currentAudioPoi]);

  useEffect(() => {
    audioQueueRef.current = audioQueue;
  }, [audioQueue]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Hàm phát âm thanh cho 1 POI
  const playPoiAudio = useCallback((poi: MapPOI) => {
    setCurrentAudioPoi(poi);
    setIsPlayingAudio(true);
    setAudioProgress(0);

    const streamUrl = getAudioStreamUrl(poi.id);

    if (audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.currentTime = 0;
      const promise = audioRef.current.play();

      if (promise !== undefined) {
        promise
          .then(() => {
            setAutoplayBlocked(false);
          })
          .catch((e) => {
            console.warn('Autoplay bị trình duyệt hạn chế, cần tương tác người dùng:', e);
            setAutoplayBlocked(true);
          });
      }
    }

    // Telemetry ghi nhận lượt nghe tự động
    trackAudioListen({
      deviceId: deviceId || 'web-guest',
      poiId: Number(poi.id),
      durationSeconds: 0,
      completed: false,
      triggerType: 'AUTO',
    });
  }, [deviceId]);

  // Xử lý khi bài audio hiện tại kết thúc -> Tự động lấy điểm tiếp theo trong hàng đợi
  const handleAudioEnded = useCallback(() => {
    if (audioQueueRef.current.length > 0) {
      const nextPoi = audioQueueRef.current[0];
      const remaining = audioQueueRef.current.slice(1);
      setAudioQueue(remaining);
      playPoiAudio(nextPoi);
      showToast(`🎧 Chuyển sang địa điểm kế tiếp: ${nextPoi.name}`);
    } else {
      setCurrentAudioPoi(null);
      setIsPlayingAudio(false);
      setAudioProgress(0);
      showToast('✓ Đã hoàn tất thuyết minh các điểm lân cận.');
    }
  }, [playPoiAudio]);

  // Nút Bỏ qua / Chuyển bài kế tiếp
  const handleSkipTrack = () => {
    handleAudioEnded();
  };

  // Nút Tạm dừng / Phát tiếp
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setAutoplayBlocked(false);
      }).catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  // Nút Tắt audio
  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentAudioPoi(null);
    setAudioQueue([]);
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setAutoplayBlocked(false);
  };

  // Kiểm tra cự ly và xếp hàng đợi tự động
  const checkProximityAndQueue = useCallback((pos: [number, number]) => {
    if (!autoPlayEnabled || mapPois.length === 0) return;

    // Tìm tất cả các điểm trong bán kính <= 30 mét
    const nearby = mapPois
      .map((poi) => ({ poi, dist: getDistance(pos, [poi.lat, poi.lng]) }))
      .filter((item) => item.dist <= 30)
      .sort((a, b) => a.dist - b.dist)
      .map((item) => item.poi);

    if (nearby.length === 0) return;

    for (const poi of nearby) {
      const isCurrent = currentAudioPoiRef.current?.id === poi.id;
      const isQueued = audioQueueRef.current.some((item) => item.id === poi.id);
      const isAlreadyPlayed = playedPoiIds.current.has(poi.id);

      if (!isCurrent && !isQueued && !isAlreadyPlayed) {
        playedPoiIds.current.add(poi.id);

        if (!currentAudioPoiRef.current) {
          // Chưa có âm thanh nào đang phát -> PHÁT LUÔN NGAY LẬP TỨC!
          playPoiAudio(poi);
          showToast(`🎧 Tự động phát thuyết minh: ${poi.name}`);
        } else {
          // Đang phát bài khác -> XẾP VÀO DANH SÁCH ĐỢI (QUEUE)
          setAudioQueue((prev) => {
            const nextList = [...prev, poi];
            showToast(`📋 Đã thêm vào hàng đợi: ${poi.name} (Vị trí #${nextList.length})`);
            return nextList;
          });
        }
      }
    }
  }, [autoPlayEnabled, mapPois, playPoiAudio]);

  // Giả lập di chuyển GPS cho Testing
  const setSimulatedLocation = (lat: number, lng: number, name?: string) => {
    const newPos: [number, number] = [lat, lng];
    setUserPos(newPos);
    setHasRealGPS(true);
    sessionStorage.setItem('sw_sim_pos', JSON.stringify({ lat, lng, name }));
    mapRef.current?.setView(newPos, 18, { animate: true });

    // Khi người dùng chủ động chọn test điểm này, cho phép phát lại ngay
    if (name) {
      const target = mapPois.find((p) => p.name.includes(name) || name.includes(p.name));
      if (target) {
        playedPoiIds.current.delete(target.id);
      }
    }

    // Kích hoạt logic tự động phát & xếp hàng đợi
    checkProximityAndQueue(newPos);
  };

  const resetSimulatedLocation = () => {
    sessionStorage.removeItem('sw_sim_pos');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        setUserPos([p.coords.latitude, p.coords.longitude]);
      });
    }
  };

  const clearPlayedHistory = () => {
    playedPoiIds.current.clear();
    showToast('🔄 Đã xóa lịch sử nghe. Bạn có thể test phát lại bất cứ điểm nào.');
  };

  // Fetch POIs từ Backend PostGIS (Cập nhật realtime)
  useEffect(() => {
    const loadBackendPois = async () => {
      try {
        const livePois: PoiSummary[] = await fetchPois();
        if (livePois && livePois.length > 0) {
          let customPins: Record<number, { emoji?: string; color?: string }> = {};
          try {
            if (typeof window !== 'undefined') {
              customPins = JSON.parse(localStorage.getItem('smart_tourism_poi_pins') || '{}');
            }
          } catch {}

          const mapped: MapPOI[] = livePois.map((p) => {
            let color = '#2563eb';
            let emoji = '📍';

            // 1. Kiểm tra cấu hình ghim tùy chỉnh từ localStorage
            if (customPins[p.id]) {
              if (customPins[p.id].emoji) emoji = customPins[p.id].emoji!;
              if (customPins[p.id].color) color = customPins[p.id].color!;
            } else {
              // 2. Kiểm tra nhãn pin nhúng trong description nếu có
              const rawDesc = (p as any).description || '';
              const pinMatch = rawDesc.match(/<!--pin:({.*?})-->/);
              if (pinMatch) {
                try {
                  const parsed = JSON.parse(pinMatch[1]);
                  if (parsed.emoji) emoji = parsed.emoji;
                  if (parsed.color) color = parsed.color;
                } catch {}
              } else {
                // 3. Quy chuẩn tự động theo Danh mục & POI Type
                const catName = p.categoryName || '';
                if (p.poiType === 'HISTORICAL' || catName.includes('Di tích')) {
                  color = '#e11d48';
                  emoji = '🏛️';
                } else if (catName.includes('Ăn vặt')) {
                  color = '#f59e0b';
                  emoji = '🍢';
                } else if (catName.includes('Món nước') || catName.includes('Phở') || catName.includes('tiếu')) {
                  color = '#ef4444';
                  emoji = '🍜';
                } else if (catName.includes('Cà phê') || catName.includes('phê')) {
                  color = '#78350f';
                  emoji = '☕';
                } else if (p.poiType === 'FOOD' || catName.includes('Ốc') || catName.includes('Phá lấu')) {
                  color = '#ea580c';
                  emoji = '🍲';
                } else if (p.poiType === 'RELIGIOUS' || catName.includes('Chùa') || catName.includes('thờ')) {
                  color = '#8b5cf6';
                  emoji = '⛩️';
                } else if (p.poiType === 'LANDMARK' || catName.includes('Cầu') || catName.includes('Cảnh quan')) {
                  color = '#0ea5e9';
                  emoji = '🌉';
                }
              }
            }

            return {
              id: p.id,
              name: p.name,
              desc: p.address,
              category: p.categoryName || 'Địa điểm',
              lat: p.latitude,
              lng: p.longitude,
              color,
              emoji,
              thumbnailUrl: p.thumbnailUrl,
              rating: p.avgRating,
              poiType: p.poiType,
              rawPoi: p,
            };
          });
          setMapPois(mapped);
        }
      } catch (err) {
        console.warn('Dùng POI mặc định:', err);
      }
    };
    loadBackendPois();
  }, []);

  useEffect(() => {
    onNavChange?.(isNav);
  }, [isNav, onNavChange]);

  // Lắng nghe tín hiệu GPS liên tục từ thiết bị
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let watchId: number;
    if (navigator.geolocation) {
      const isInsecure = !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      if (isInsecure) {
        console.warn('GPS thực bị trình duyệt chặn do kết nối HTTP trên mạng LAN. Hãy dùng panel [Test GPS] hoặc chạy server với HTTPS.');
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (p) => {
          const newPos: [number, number] = [p.coords.latitude, p.coords.longitude];
          setUserPos(newPos);
          setHasRealGPS(true);

          if (!hasInitializedGPS.current) {
            hasInitializedGPS.current = true;
            mapRef.current?.setView(newPos, 16, { animate: true });
          }

          if (p.coords.heading !== null && !(window as any).DeviceOrientationEvent) setHeading(p.coords.heading);

          // Kiểm tra tự động phát & hàng đợi khi GPS thực thay đổi
          checkProximityAndQueue(newPos);
        },
        (e) => {
          if (e.code === 1) {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            console.warn('GPS bị chặn quyền hoặc cần HTTPS:', e.message);
          } else {
            console.warn(`GPS(${e.code}):`, e.message);
          }
        },
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
  }, [checkProximityAndQueue]);

  // Auto-advance step khi GPS gần điểm rẽ
  useEffect(() => {
    if (!isNav || !steps.length) return;
    for (let i = stepIdx; i < steps.length; i++) {
      if (getDistance(userPos, steps[i].location) < 30) {
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
    } catch { /* handled */ }
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
    if (!hasRealGPS) {
      if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
        showToast('⚠️ Trình duyệt chặn GPS qua HTTP (192.168.1.15). Đang mở panel [Test GPS] để bạn thử nghiệm!');
        setShowSimPanel(true);
      }
    }
    if (isNav) setIsTracking(true);
    setOverview(false);

    if (userPos && typeof userPos[0] === 'number' && typeof userPos[1] === 'number' && !isNaN(userPos[0]) && !isNaN(userPos[1])) {
      mapRef.current?.setView(userPos, targetZoom, { animate: true });
      // Kích hoạt quét cự ly ngay khi bấm nút vị trí
      checkProximityAndQueue(userPos);
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
      {/* ── THẺ AUDIO TỰ ĐỘNG PHÁT NGẦM ────────────────────── */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime);
            setAudioDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={handleAudioEnded}
      />

      {/* ── TOAST THÔNG BÁO TỰ ĐỘNG PHÁT & HÀNG ĐỢI ─────────── */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1500] bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-white/20 backdrop-blur-md flex items-center gap-2 animate-bounce">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── BANNER TRÌNH DUYỆT CHẶN AUTOPLAY (NẾU CÓ) ───────── */}
      {autoplayBlocked && currentAudioPoi && (
        <div className="absolute top-28 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-[2000] flex justify-center animate-bounce">
          <button
            onClick={() => {
              audioRef.current?.play().then(() => {
                setAutoplayBlocked(false);
              }).catch(() => {});
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base">🔊</span>
            <span>Bấm vào đây để Nghe Âm Thanh Thuyết Minh {currentAudioPoi.name}</span>
          </button>
        </div>
      )}

      {/* ── BẢN ĐỒ MAP CONTAINER ────────────────────────────── */}
      <MapContainer ref={mapRef} center={userPos} zoom={16} zoomControl={false} className="w-full h-full border-none absolute inset-0 z-0 bg-[#f4f7f6]">
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia</a> &copy; <a href="http://openstreetmap.org">OSM</a>'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        <MapEventsHandler
          onDrag={() => setIsTracking(false)}
          onMapClick={(lat, lng) => {
            // Khi bấm vào bất kỳ đâu trên bản đồ (trong chế độ thử nghiệm): di chuyển chấm GPS đến đó!
            setSimulatedLocation(lat, lng);
          }}
        />
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
        {mapPois.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={createPoiIcon(p.color, p.emoji)}>
            <Popup className="rounded-2xl overflow-hidden shadow-2xl p-0">
              <div className="p-3.5 max-w-[240px]">
                {p.thumbnailUrl && (
                  <div className="h-24 w-full rounded-xl overflow-hidden mb-2 bg-slate-100">
                    <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{p.emoji}</span>
                  <h4 className="font-extrabold text-gray-900 text-xs leading-snug truncate">{p.name}</h4>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">{p.category}</span>
                  {p.rating && p.rating > 0 ? (
                    <span className="text-[10px] text-amber-500 font-bold">★ {p.rating.toFixed(1)}</span>
                  ) : null}
                </div>
                <p className="text-[11px] text-gray-500 mb-3 line-clamp-1">{p.desc}</p>

                <div className="space-y-1.5">
                  {/* Nút phát ngay lập tức từ Marker */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playedPoiIds.current.delete(p.id);
                      playPoiAudio(p);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>▶️ Phát thuyết minh ngay</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startNav(p);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    <span>Chỉ đường tới đây</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalPoiId(p.id);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🎧 Chi tiết & Check-in 30m</span>
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── THANH MINI-PLAYER PHÁT THUYẾT MINH & HÀNG ĐỢI (QUEUE) ── */}
      {currentAudioPoi && (
        <div className="absolute bottom-20 lg:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-[1200] bg-slate-900/95 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700 backdrop-blur-md animate-fadeIn">
          {/* Header Track */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-lg shrink-0 shadow-md">
                {isPlayingAudio ? '🎧' : '⏸️'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Đang tự động phát</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h4 className="text-xs font-black truncate">{currentAudioPoi.name}</h4>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={togglePlayPause}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
                title={isPlayingAudio ? 'Tạm dừng' : 'Phát tiếp'}
              >
                {isPlayingAudio ? '⏸️' : '▶️'}
              </button>

              <button
                onClick={handleSkipTrack}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
                title="Bỏ qua / Kế tiếp"
              >
                ⏭️
              </button>

              <button
                onClick={handleStopAudio}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500/30 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Dừng phát"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 space-y-1">
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${audioDuration > 0 ? (audioProgress / audioDuration) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>{Math.floor(audioProgress)}s</span>
              <span>{Math.floor(audioDuration)}s</span>
            </div>
          </div>

          {/* Danh sách đợi (Queue Preview) */}
          {audioQueue.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-amber-300 truncate">
                <span>📋 <b>Hàng đợi ({audioQueue.length}):</b></span>
                <span className="truncate">{audioQueue.map((p) => p.name).join(' → ')}</span>
              </div>
              <span className="text-[9px] text-slate-400 shrink-0 ml-2">Tự phát tiếp</span>
            </div>
          )}
        </div>
      )}

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
              <button onClick={stopNav} className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-5 rounded-full shadow transition shrink-0 cursor-pointer">Kết thúc</button>
            </div>
            <div className="border-t border-gray-100 py-2.5 flex justify-center bg-gray-50/50">
              <button onClick={() => { setOverview(!overview); if (overview) setIsTracking(true); }} className="text-xs font-bold text-blue-600 flex items-center gap-1.5 px-4 py-1 rounded-full hover:bg-blue-50 transition active:scale-95 cursor-pointer">
                {overview ? '📍 Quay lại dẫn đường' : '🗺️ Xem tổng quan'}
              </button>
            </div>
          </div>

          {(overview || !isTracking) && (
            <button
              onClick={() => recenterToUser(17)}
              className="absolute bottom-36 right-4 z-[1000] bg-white text-blue-600 px-3.5 py-2.5 rounded-full shadow-2xl border border-gray-200 active:scale-95 transition-all flex items-center gap-1.5 font-bold text-xs cursor-pointer"
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

      {/* ── FLOATING CONTROLS (GPS RECENTER & SIMULATOR) ──── */}
      {!isNav && (
        <>
          {/* Nút bật Panel Giả Lập Vị Trí GPS (Testing Tool) */}
          <div className="absolute top-[68px] sm:top-20 left-3 sm:left-4 z-[1000]">
            <button
              onClick={() => setShowSimPanel(!showSimPanel)}
              className="bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 font-extrabold text-xs px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <span>🧪</span>
              <span className="hidden sm:inline">Thử Nghiệm Tự Phát & Hàng Đợi</span>
              <span className="sm:hidden text-[10px] font-bold">Test GPS</span>
            </button>
            {isInsecureOrigin && !hasRealGPS && (
              <button
                onClick={() => setShowSimPanel(true)}
                className="mt-1 bg-amber-500/90 hover:bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-md cursor-pointer flex items-center gap-1 animate-fadeIn border border-amber-300/40"
              >
                <span>⚠️ HTTP: Bấm để Test GPS</span>
              </button>
            )}

            {showSimPanel && (
              <div className="mt-2 w-80 bg-white/98 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-200 space-y-2.5 animate-fadeIn text-left">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400">Giả lập GPS & Test Hàng Đợi</span>
                  <button onClick={() => setShowSimPanel(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">✕</button>
                </div>

                <p className="text-[11px] text-slate-600 leading-tight">
                  Bấm vào địa điểm để "dịch chuyển" vị trí của bạn:
                </p>

                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      playedPoiIds.current.delete(1);
                      setSimulatedLocation(10.76121, 106.70251, 'Quán Ốc Oanh');
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 transition cursor-pointer flex items-center justify-between"
                  >
                    <span>🍲 Đến Quán Ốc Oanh (1.5m)</span>
                    <span className="text-[9px] bg-orange-200 px-1.5 py-0.5 rounded">Tự phát</span>
                  </button>

                  <button
                    onClick={() => {
                      playedPoiIds.current.delete(3);
                      setSimulatedLocation(10.76821, 106.70681, 'Bến Nhà Rồng');
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition cursor-pointer flex items-center justify-between"
                  >
                    <span>🏛️ Đến Bến Nhà Rồng (2m)</span>
                    <span className="text-[9px] bg-rose-200 px-1.5 py-0.5 rounded">Tự phát</span>
                  </button>

                  <button
                    onClick={() => {
                      playedPoiIds.current.delete(2);
                      setSimulatedLocation(10.75881, 106.70421, 'Phá Lấu Cô Thảo');
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition cursor-pointer flex items-center justify-between"
                  >
                    <span>🍲 Đến Phá Lấu Cô Thảo (2m)</span>
                    <span className="text-[9px] bg-amber-200 px-1.5 py-0.5 rounded">Tự phát</span>
                  </button>

                  {/* Kịch bản test 2 điểm liên tiếp vào hàng đợi */}
                  <button
                    onClick={() => {
                      playedPoiIds.current.clear();
                      // Điểm 1 phát ngay
                      setSimulatedLocation(10.76121, 106.70251, 'Quán Ốc Oanh');
                      // Sau 500ms đưa thêm Phá Lấu Cô Thảo vào hàng đợi
                      setTimeout(() => {
                        const phaLau = mapPois.find((p) => p.id === 2 || p.name.includes('Phá Lấu'));
                        if (phaLau) {
                          setAudioQueue((prev) => [...prev, phaLau]);
                          showToast(`📋 Đã thêm vào hàng đợi: ${phaLau.name} (Vị trí #1)`);
                        }
                      }, 500);
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer border border-indigo-200 flex items-center justify-between"
                  >
                    <span>⚡ Test 2 điểm (Ốc Oanh + Phá Lấu)</span>
                    <span className="text-[9px] bg-indigo-200 px-1.5 py-0.5 rounded">Tự phát + Đợi</span>
                  </button>

                  <button
                    onClick={() => setSimulatedLocation(10.7769, 106.7009, 'Quận 1')}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between"
                  >
                    <span>❌ Đến Quận 1 (1.8km)</span>
                    <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded">&gt;30m</span>
                  </button>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={clearPlayedHistory}
                      className="text-[10px] text-amber-600 font-bold hover:underline cursor-pointer"
                    >
                      🔄 Reset lịch sử nghe
                    </button>
                    <button
                      onClick={resetSimulatedLocation}
                      className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Về GPS thật
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => recenterToUser(16)}
            className={`absolute bottom-24 lg:bottom-6 right-4 z-[1000] p-3.5 rounded-full shadow-xl border transition-all active:scale-95 cursor-pointer ${
              isTracking ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/30' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title="Quay về vị trí của tôi"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v2m0 12v2m8-8h-2M6 12H4m12 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </>
      )}

      {/* ── POI DETAIL MODAL ─────────────────────────────────── */}
      {modalPoiId && (
        <PoiDetailModal
          poiId={modalPoiId}
          onClose={() => setModalPoiId(null)}
          onNavigate={(target) => {
            const found = mapPois.find((p) => p.id === modalPoiId);
            if (found) startNav(found);
            setModalPoiId(null);
          }}
        />
      )}
    </div>
  );
}
