import {
  HealthStatus,
  Category,
  PoiSummary,
  PoiDetail,
  PoiMenuResponse,
  ReviewPageResponse,
  CheckinResult,
  TourSummary,
  TourDetail,
  CustomPlanResponse,
  AiAskResponse,
  AiRecommendDishResponse,
  AuthV1Response,
  UserProfile,
} from '@/types';

const isServer = typeof window === 'undefined';
const API_V1 = isServer
  ? (process.env.INTERNAL_API_URL || 'http://localhost:8080/api/v1')
  : '/api/v1';

// Lấy token từ localStorage một cách an toàn
const getAuthHeader = (customToken?: string | null): Record<string, string> => {
  const token = customToken || (typeof window !== 'undefined' ? localStorage.getItem('sw_token') : null);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── 1. Health & Status ─────────────────────────────────────────
export const checkHealth = async (): Promise<HealthStatus> => {
  try {
    const res = await fetch(`${API_V1}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  } catch (err) {
    return {
      status: 'DOWN',
      database: 'DISCONNECTED',
      timestamp: new Date().toISOString(),
    };
  }
};

// ─── 2. Categories ──────────────────────────────────────────────
export const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${API_V1}/categories`);
  if (!res.ok) throw new Error('Không thể tải danh mục');
  return res.json();
};

// ─── 3. POIs (Địa điểm) ─────────────────────────────────────────
export interface SearchPoiParams {
  q?: string;
  categoryId?: number;
  districtWard?: string;
  sortBy?: 'popularity' | 'rating' | 'distance' | 'price_asc' | 'price_desc';
  lat?: number;
  lng?: number;
}

export const fetchPois = async (params: SearchPoiParams = {}): Promise<PoiSummary[]> => {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.categoryId) query.set('category_id', params.categoryId.toString());
  if (params.districtWard) query.set('district_ward', params.districtWard);
  if (params.sortBy) query.set('sort_by', params.sortBy);
  if (params.lat !== undefined) query.set('lat', params.lat.toString());
  if (params.lng !== undefined) query.set('lng', params.lng.toString());

  const res = await fetch(`${API_V1}/pois/search?${query.toString()}`);
  if (!res.ok) throw new Error('Không thể tìm kiếm địa điểm');
  return res.json();
};

export const fetchPoiDetail = async (id: number | string): Promise<PoiDetail> => {
  const res = await fetch(`${API_V1}/pois/${id}`);
  if (!res.ok) throw new Error(`Không tìm thấy chi tiết địa điểm ID ${id}`);
  return res.json();
};

export const fetchNearbyPois = async (lat: number, lng: number, radiusInMeters = 1000): Promise<PoiSummary[]> => {
  const res = await fetch(`${API_V1}/pois/nearby?lat=${lat}&lng=${lng}&radiusInMeters=${radiusInMeters}`);
  if (!res.ok) throw new Error('Không thể tải địa điểm lân cận');
  return res.json();
};

// ─── 4. Dishes & Menu ───────────────────────────────────────────
export const fetchPoiMenu = async (poiId: number | string): Promise<PoiMenuResponse> => {
  const res = await fetch(`${API_V1}/pois/${poiId}/menu`);
  if (!res.ok) throw new Error('Không thể tải thực đơn món ăn');
  return res.json();
};

// ─── 5. Tours ───────────────────────────────────────────────────
export const fetchTours = async (theme?: string, search?: string): Promise<TourSummary[]> => {
  const query = new URLSearchParams();
  if (theme) query.set('theme', theme);
  if (search) query.set('search', search);

  const res = await fetch(`${API_V1}/tours?${query.toString()}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Không thể tải danh sách tour');
  return res.json();
};

export const fetchTourDetail = async (tourIdOrSlug: number | string): Promise<TourDetail> => {
  const res = await fetch(`${API_V1}/tours/${tourIdOrSlug}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Không thể tải chi tiết tuyến tour');
  return res.json();
};

export interface CustomTourPlanParams {
  availableMinutes: number;
  startLat: number;
  startLng: number;
  selectedCategories?: number[];
  poiTypes?: string[];
  maxBudget?: number;
  saveAsTour?: boolean;
  tourName?: string;
  isPublic?: boolean;
}

export const generateCustomTour = async (params: CustomTourPlanParams): Promise<CustomPlanResponse> => {
  const res = await fetch(`${API_V1}/tours/custom-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi tạo lộ trình tự động');
  }
  return res.json();
};

// ─── 6. Community & Reviews ─────────────────────────────────────
export const fetchPoiReviews = async (poiId: number | string, page = 0, size = 10): Promise<ReviewPageResponse> => {
  const res = await fetch(`${API_V1}/pois/${poiId}/reviews?page=${page}&size=${size}`);
  if (!res.ok) throw new Error('Không thể tải đánh giá');
  return res.json();
};

export const postReview = async (
  poiId: number | string,
  data: { rating: number; comment: string; images?: string[] }
): Promise<ReviewPageResponse['items'][0]> => {
  const res = await fetch(`${API_V1}/pois/${poiId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi gửi đánh giá');
  }
  return res.json();
};

export const checkinPoi = async (
  poiId: number | string,
  userLat: number,
  userLng: number
): Promise<CheckinResult> => {
  const res = await fetch(`${API_V1}/pois/${poiId}/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ userLat, userLng }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi check-in địa điểm');
  }
  return res.json();
};

export const toggleFavorite = async (
  poiId: number | string,
  isFavorite: boolean
): Promise<{ poiId: number; isFavorite: boolean; message: string }> => {
  const method = isFavorite ? 'POST' : 'DELETE';
  const res = await fetch(`${API_V1}/pois/${poiId}/favorite`, {
    method,
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật danh sách yêu thích');
  return res.json();
};

export const fetchMyFavorites = async (): Promise<PoiSummary[]> => {
  const res = await fetch(`${API_V1}/users/me/favorites`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Không thể tải danh sách quán yêu thích');
  return res.json();
};

// ─── 7. Audio Guide & Streaming ─────────────────────────────────
export const getAudioStreamUrl = (poiId: number | string): string => {
  return `${API_V1}/audio/stream/${poiId}`;
};

export const trackAudioListen = async (data: {
  deviceId: string;
  poiId: number;
  durationSeconds: number;
  completed: boolean;
  triggerType: 'AUTO' | 'MANUAL';
}): Promise<void> => {
  try {
    await fetch(`${API_V1}/analytics/listen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    // silent analytics failure
  }
};

// ─── 8. AI Assistant ────────────────────────────────────────────
export const askAi = async (data: {
  question: string;
  poiId?: number;
  userLat?: number;
  userLng?: number;
  conversationId?: string;
}): Promise<AiAskResponse> => {
  const res = await fetch(`${API_V1}/ai/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Trợ lý AI đang bận, vui lòng thử lại sau');
  }
  return res.json();
};

export const recommendDishesByBudget = async (data: {
  budget: number;
  tastePreferences?: string[];
  groupSize?: number;
  userLat?: number;
  userLng?: number;
}): Promise<AiRecommendDishResponse> => {
  const res = await fetch(`${API_V1}/ai/recommend-dish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể tạo gợi ý món ăn');
  }
  return res.json();
};

// ─── 9. Auth & Sessions ─────────────────────────────────────────
export const createGuestSession = async (deviceId: string, os: 'web' | 'ios' | 'android' = 'web'): Promise<AuthV1Response> => {
  const res = await fetch(`${API_V1}/auth/guest-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, os }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể khởi tạo phiên khách');
  }
  return res.json();
};

export const loginWithGoogle = async (idToken: string): Promise<AuthV1Response> => {
  const res = await fetch(`${API_V1}/auth/oauth2/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi đăng nhập Google');
  }
  return res.json();
};

export const requestTelegramOtp = async (phone: string): Promise<boolean> => {
  const res = await fetch(`${API_V1}/auth/telegram/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi gửi mã OTP Telegram');
  }
  return true;
};

export const verifyTelegramOtp = async (phone: string, otp: string): Promise<AuthV1Response> => {
  const res = await fetch(`${API_V1}/auth/telegram/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Mã OTP không chính xác');
  }
  return res.json();
};

export const getMyProfile = async (customToken?: string): Promise<UserProfile> => {
  const res = await fetch(`${API_V1}/users/me`, {
    headers: { ...getAuthHeader(customToken) },
  });
  if (!res.ok) throw new Error('Lỗi lấy hồ sơ cá nhân');
  return res.json();
};

// Aliases cho form đăng nhập
export const requestOtp = requestTelegramOtp;
export const verifyOtpAndLogin = verifyTelegramOtp;
