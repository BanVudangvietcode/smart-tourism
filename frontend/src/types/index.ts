// Shared TypeScript types cho toàn bộ frontend

export interface HealthStatus {
  status: string;
  message: string;
  timestamp: string;
}

export interface POI {
  id: string;
  name: string;
  description: string;
  address: string;
  category: string;
  rating: number;
}

export interface AuthResponse {
  token: string;
  user: { id: string; phone: string };
}

// Địa điểm hiển thị trên bản đồ
export interface MapPOI {
  id: string;
  name: string;
  desc: string;
  category: string;
  lat: number;
  lng: number;
  color: string;
  emoji: string;
}

// Một bước dẫn đường (turn-by-turn)
export interface NavStep {
  instruction: string;
  distance: string;
  distanceMeters: number;
  duration: string;
  maneuver: string;
  location: [number, number];
}

// Thông tin lộ trình tổng
export interface RouteInfo {
  distance: string;
  duration: string;
  distanceM: number;
  durationS: number;
  eta: string;
}

