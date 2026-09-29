import { MapPOI, NavStep, RouteInfo } from '@/types';

// Chuyển maneuver OSRM → text tiếng Việt
export const getManeuverText = (type: string, modifier?: string, name?: string): string => {
  const street = name?.length ? ` vào ${name}` : '';
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
export const getDistance = (p1: [number, number], p2: [number, number]): number => {
  const R = 6371e3;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(p2[0] - p1[0]);
  const dLon = toRad(p2[1] - p1[1]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p1[0])) * Math.cos(toRad(p2[0])) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDist = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
const formatDur = (mins: number) => mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}p` : `${mins} phút`;

// Gọi OSRM API tìm đường
export async function fetchRoute(
  from: [number, number],
  to: MapPOI,
  mode: 'driving' | 'walking'
): Promise<{ coords: [number, number][]; info: RouteInfo; steps: NavStep[] }> {
  const start = `${from[1]},${from[0]}`;
  const end = `${to.lng},${to.lat}`;
  const server = mode === 'driving' ? 'car' : 'foot';
  const routingProfile = mode === 'driving' ? 'driving' : 'walking';

  const res = await fetch(
    `https://routing.openstreetmap.de/routed-${server}/route/v1/${routingProfile}/${start};${end}?overview=full&geometries=geojson&steps=true`
  );
  const data = await res.json();

  if (!data.routes?.length) {
    return {
      coords: [from, [to.lat, to.lng]],
      info: { distance: 'Không tìm thấy', duration: '--', distanceM: 0, durationS: 0, eta: '--:--' },
      steps: [],
    };
  }

  const route = data.routes[0];
  const coords: [number, number][] = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
  if (coords.length > 0) coords[0] = from;

  const etaStr = new Date(Date.now() + route.duration * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const info: RouteInfo = {
    distance: formatDist(route.distance),
    duration: formatDur(Math.ceil(route.duration / 60)),
    distanceM: route.distance,
    durationS: route.duration,
    eta: etaStr,
  };

  const steps: NavStep[] = (route.legs?.[0]?.steps || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s.maneuver)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => ({
      instruction: getManeuverText(s.maneuver.type, s.maneuver.modifier, s.name || undefined),
      distance: formatDist(s.distance),
      distanceMeters: s.distance,
      duration: formatDur(Math.ceil(s.duration / 60)),
      maneuver: `${s.maneuver.type}${s.maneuver.modifier ? '-' + s.maneuver.modifier : ''}`,
      location: [s.maneuver.location[1], s.maneuver.location[0]] as [number, number],
    }));

  return { coords, info, steps };
}

