import {
  HealthStatus,
  Category,
  PoiTypeItem,
  PoiSummary,
  PoiDetail,
  PoiMenuResponse,
  ReviewPageResponse,
  CheckinResult,
  TourSummary,
  TourDetail,
  TourReviewItem,
  TourReviewListResponse,
  CreateTourInput,
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

export const createCategory = async (data: {
  name: string;
  slug?: string;
  iconUrl?: string;
  sortOrder?: number;
}): Promise<Category> => {
  const res = await fetch(`${API_V1}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể tạo danh mục mới');
  }
  return res.json();
};

export const updateCategory = async (
  id: number,
  data: {
    name?: string;
    slug?: string;
    iconUrl?: string;
    sortOrder?: number;
  }
): Promise<Category> => {
  const res = await fetch(`${API_V1}/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể cập nhật danh mục');
  }
  return res.json();
};

export const deleteCategory = async (id: number): Promise<void> => {
  const res = await fetch(`${API_V1}/categories/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể xóa danh mục');
  }
};

// ─── 2.1 POI Types (Phân loại hệ thống) ─────────────────────────
export const fetchPoiTypes = async (): Promise<PoiTypeItem[]> => {
  const res = await fetch(`${API_V1}/poi-types`);
  if (!res.ok) throw new Error('Không thể tải danh sách phân loại hệ thống');
  return res.json();
};

export const createPoiType = async (data: {
  code: string;
  name: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
}): Promise<PoiTypeItem> => {
  const res = await fetch(`${API_V1}/poi-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể tạo phân loại hệ thống mới');
  }
  return res.json();
};

export const updatePoiType = async (
  code: string,
  data: {
    name?: string;
    icon?: string;
    description?: string;
    sortOrder?: number;
  }
): Promise<PoiTypeItem> => {
  const res = await fetch(`${API_V1}/poi-types/${code}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể cập nhật phân loại hệ thống');
  }
  return res.json();
};

export const deletePoiType = async (code: string): Promise<void> => {
  const res = await fetch(`${API_V1}/poi-types/${code}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể xóa phân loại hệ thống');
  }
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

export const createTour = async (payload: CreateTourInput): Promise<TourDetail> => {
  const res = await fetch(`${API_V1}/tours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || errData?.message || 'Không thể tạo tour du lịch');
  }
  return res.json();
};

export const deleteTour = async (tourId: number): Promise<void> => {
  const res = await fetch(`${API_V1}/tours/${tourId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || errData?.message || 'Không thể xóa tour du lịch');
  }
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
  data: { rating: number; comment: string; images?: string[]; isAnonymous?: boolean }
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

export const fetchTourReviews = async (tourId: number | string): Promise<TourReviewListResponse> => {
  const res = await fetch(`${API_V1}/tours/${tourId}/reviews`);
  if (!res.ok) throw new Error('Không thể tải đánh giá tuyến tour');
  return res.json();
};

export const postTourReview = async (
  tourId: number | string,
  data: { rating: number; comment: string; isAnonymous?: boolean }
): Promise<TourReviewItem> => {
  const res = await fetch(`${API_V1}/tours/${tourId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi gửi đánh giá tuyến tour');
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

export const loginWithGoogle = async (idToken: string, deviceId?: string): Promise<AuthV1Response> => {
  const res = await fetch(`${API_V1}/auth/oauth2/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, deviceId }),
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

// ─── 11. Admin CMS APIs ─────────────────────────────────────────

export const loginAsAdmin = async (): Promise<AuthV1Response> => {
  const res = await fetch(`${API_V1}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi đăng nhập tài khoản Quản trị');
  }
  const data: AuthV1Response = await res.json();
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', data.token);
  }
  return data;
};

export const adminCreatePoi = async (formData: FormData): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/pois`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể tạo địa điểm mới');
  }
  return res.json();
};

export const adminUpdatePoi = async (id: number, data: any): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/pois/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể cập nhật địa điểm');
  }
  return res.json();
};

export const adminDeletePoi = async (id: number): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/pois/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể xóa địa điểm');
  }
  return res.json();
};

export const adminUploadPoiAudio = async (id: number, formData: FormData): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/pois/${id}/audio`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể tải lên file thuyết minh');
  }
  return res.json();
};

export const adminScanMenuOcr = async (poiId: number, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_V1}/admin/pois/${poiId}/menu/scan-ocr`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'AI OCR không thể nhận diện thực đơn');
  }
  return res.json();
};

export const adminCreateDish = async (poiId: number, data: any): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/pois/${poiId}/dishes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể tạo món ăn mới');
  }
  return res.json();
};

export const adminUpdateDish = async (dishId: number, data: any): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/dishes/${dishId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể cập nhật món ăn');
  }
  return res.json();
};

export const adminDeleteDish = async (dishId: number): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/dishes/${dishId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể xóa món ăn');
  }
  return res.json();
};

export const adminBatchImportMenu = async (poiId: number, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_V1}/admin/pois/${poiId}/menu/batch-import`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Lỗi nhập hàng loạt thực đơn');
  }
  return res.json();
};

export const adminEvictCache = async (pattern = 'poi:*'): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/cache/evict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ pattern }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể xóa cache');
  }
  return res.json();
};

export const getDashboardSummary = async (): Promise<any> => {
  const res = await fetch(`${API_V1}/analytics/dashboard-summary`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể tải báo cáo Dashboard');
  }
  return res.json();
};

export const getHeatmap = async (minDwellSeconds = 30, limit = 500): Promise<any> => {
  const res = await fetch(`${API_V1}/analytics/heatmap?minDwellSeconds=${minDwellSeconds}&limit=${limit}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể tải bản đồ nhiệt');
  }
  return res.json();
};import {
  HealthStatus,
  Category,
  PoiTypeItem,
  PoiSummary,
  PoiDetail,
  PoiMenuResponse,
  ReviewPageResponse,
  CheckinResult,
  TourSummary,
  TourDetail,
  TourReviewItem,
  TourReviewListResponse,
  CreateTourInput,
  CustomPlanResponse,
  AiAskResponse,
  AiRecommendDishResponse,
  AuthV1Response,
  UserProfile,
  UserFavoritePoiResponse,
} from '@/types';

const isServer = typeof window === 'undefined';
const rawBackend = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const API_V1 = isServer
  ? (rawBackend.endsWith('/api/v1') ? rawBackend : `${rawBackend}/api/v1`)
  : '/api/v1';

// Lấy token từ localStorage một cách an toàn
const getAuthHeader = (customToken?: string | null): Record<string, string> => {
  const token = customToken || (typeof window !== 'undefined' ? localStorage.getItem('sw_token') : null);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lấy ngôn ngữ hiện tại từ localStorage
const getLanguageHeader = (): Record<string, string> => {
  const lang = typeof window !== 'undefined' ? (localStorage.getItem('sw_language') || 'vi') : 'vi';
  return { 'Accept-Language': lang };
};

// Kết hợp headers bao gồm ngôn ngữ và auth
const getCommonHeaders = (customToken?: string | null): Record<string, string> => {
  return {
    ...getLanguageHeader(),
    ...getAuthHeader(customToken),
  };
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
  const res = await fetch(`${API_V1}/categories`, {
    headers: getCommonHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải danh mục');
  return res.json();
};

export const createCategory = async (data: {
  name: string;
  slug?: string;
  iconUrl?: string;
  sortOrder?: number;
}): Promise<Category> => {
  const res = await fetch(`${API_V1}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể tạo danh mục mới');
  }
  return res.json();
};

export const updateCategory = async (
  id: number,
  data: {
    name?: string;
    slug?: string;
    iconUrl?: string;
    sortOrder?: number;
  }
): Promise<Category> => {
  const res = await fetch(`${API_V1}/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể cập nhật danh mục');
  }
  return res.json();
};

export const deleteCategory = async (id: number): Promise<void> => {
  const res = await fetch(`${API_V1}/categories/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể xóa danh mục');
  }
};

// ─── 2.1 POI Types (Phân loại hệ thống) ─────────────────────────
export const fetchPoiTypes = async (): Promise<PoiTypeItem[]> => {
  const res = await fetch(`${API_V1}/poi-types`, {
    headers: getCommonHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải danh sách phân loại hệ thống');
  return res.json();
};

export const createPoiType = async (data: {
  code: string;
  name: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
}): Promise<PoiTypeItem> => {
  const res = await fetch(`${API_V1}/poi-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể tạo phân loại hệ thống mới');
  }
  return res.json();
};

export const updatePoiType = async (
  code: string,
  data: {
    name?: string;
    icon?: string;
    description?: string;
    sortOrder?: number;
  }
): Promise<PoiTypeItem> => {
  const res = await fetch(`${API_V1}/poi-types/${code}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể cập nhật phân loại hệ thống');
  }
  return res.json();
};

export const deletePoiType = async (code: string): Promise<void> => {
  const res = await fetch(`${API_V1}/poi-types/${code}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể xóa phân loại hệ thống');
  }
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

  const res = await fetch(`${API_V1}/pois/search?${query.toString()}`, {
    headers: getCommonHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tìm kiếm địa điểm');
  return res.json();
};

export const fetchPoiDetail = async (id: number | string): Promise<PoiDetail> => {
  const res = await fetch(`${API_V1}/pois/${id}`, {
    headers: getCommonHeaders(),
  });
  if (!res.ok) throw new Error(`Không tìm thấy chi tiết địa điểm ID ${id}`);
  return res.json();
};

export const fetchNearbyPois = async (lat: number, lng: number, radiusInMeters = 1000): Promise<PoiSummary[]> => {
  const res = await fetch(`${API_V1}/pois/nearby?lat=${lat}&lng=${lng}&radiusInMeters=${radiusInMeters}`, {
    headers: getCommonHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải địa điểm lân cận');
  return res.json();
};

// ─── 4. Dishes & Menu ───────────────────────────────────────────
export const fetchPoiMenu = async (poiId: number | string): Promise<PoiMenuResponse> => {
  const res = await fetch(`${API_V1}/pois/${poiId}/menu`, {
    headers: getCommonHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải thực đơn món ăn');
  return res.json();
};

// ─── 5. Tours ───────────────────────────────────────────────────
export const fetchTours = async (theme?: string, search?: string): Promise<TourSummary[]> => {
  const query = new URLSearchParams();
  if (theme) query.set('theme', theme);
  if (search) query.set('search', search);

  const res = await fetch(`${API_V1}/tours?${query.toString()}`, {
    headers: getCommonHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải danh sách tour');
  return res.json();
};

export const fetchTourDetail = async (tourIdOrSlug: number | string): Promise<TourDetail> => {
  const res = await fetch(`${API_V1}/tours/${tourIdOrSlug}`, {
    headers: getCommonHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải chi tiết tuyến tour');
  return res.json();
};

export const createTour = async (payload: CreateTourInput): Promise<TourDetail> => {
  const res = await fetch(`${API_V1}/tours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || errData?.message || 'Không thể tạo tour du lịch');
  }
  return res.json();
};

export const deleteTour = async (tourId: number): Promise<void> => {
  const res = await fetch(`${API_V1}/tours/${tourId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || errData?.message || 'Không thể xóa tour du lịch');
  }
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
  const res = await fetch(`${API_V1}/pois/${poiId}/reviews?page=${page}&size=${size}`, {
    headers: getCommonHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải đánh giá');
  return res.json();
};

export const postReview = async (
  poiId: number | string,
  data: { rating: number; comment: string; images?: string[]; isAnonymous?: boolean }
): Promise<ReviewPageResponse['items'][0]> => {
  const res = await fetch(`${API_V1}/pois/${poiId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCommonHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi gửi đánh giá');
  }
  return res.json();
};

export const fetchTourReviews = async (tourId: number | string): Promise<TourReviewListResponse> => {
  const res = await fetch(`${API_V1}/tours/${tourId}/reviews`, {
    headers: getCommonHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải đánh giá tuyến tour');
  return res.json();
};

export const postTourReview = async (
  tourId: number | string,
  data: { rating: number; comment: string; isAnonymous?: boolean }
): Promise<TourReviewItem> => {
  const res = await fetch(`${API_V1}/tours/${tourId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCommonHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi gửi đánh giá tuyến tour');
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

export const fetchMyFavorites = async (): Promise<UserFavoritePoiResponse[]> => {
  const res = await fetch(`${API_V1}/users/me/favorites`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Không thể tải danh sách quán yêu thích');
  return res.json();
};

// ─── 7. Audio Guide & Streaming ─────────────────────────────────
export const getAudioStreamUrl = (poiId: number | string, lang?: string): string => {
  const currentLang = lang || (typeof window !== 'undefined' ? (localStorage.getItem('sw_language') || 'vi') : 'vi');
  return `${API_V1}/audio/stream/${poiId}?lang=${currentLang}`;
};

export const getAudioMetadata = async (poiId: number | string, lang?: string): Promise<any> => {
  const currentLang = lang || (typeof window !== 'undefined' ? (localStorage.getItem('sw_language') || 'vi') : 'vi');
  const res = await fetch(`${API_V1}/audio/metadata/${poiId}?lang=${currentLang}`, {
    headers: { ...getCommonHeaders() },
  });
  if (!res.ok) return null;
  return res.json();
};

export const generateMultilingualAudio = async (data: {
  poiId: number;
  title?: string;
  transcript: string;
  voice?: string;
  zone?: string;
  targetLanguages?: string[];
}): Promise<any> => {
  const res = await fetch(`${API_V1}/audio/generate-multilingual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCommonHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Lỗi sinh audio đa ngôn ngữ');
  }
  return res.json();
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
      ...getCommonHeaders(),
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
      ...getCommonHeaders(),
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

// ─── 11. Admin CMS APIs ─────────────────────────────────────────

export const loginAsAdmin = async (): Promise<AuthV1Response> => {
  const res = await fetch(`${API_V1}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi đăng nhập tài khoản Quản trị');
  }
  const data: AuthV1Response = await res.json();
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', data.token);
  }
  return data;
};

export const adminCreatePoi = async (formData: FormData): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/pois`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể tạo địa điểm mới');
  }
  return res.json();
};

export const adminUpdatePoi = async (id: number, data: any): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/pois/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể cập nhật địa điểm');
  }
  return res.json();
};

export const adminDeletePoi = async (id: number): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/pois/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể xóa địa điểm');
  }
  return res.json();
};

export const adminUploadPoiAudio = async (id: number, formData: FormData): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/pois/${id}/audio`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể tải lên file thuyết minh');
  }
  return res.json();
};

export const adminScanMenuOcr = async (poiId: number, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_V1}/admin/pois/${poiId}/menu/scan-ocr`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'AI OCR không thể nhận diện thực đơn');
  }
  return res.json();
};

export const adminCreateDish = async (poiId: number, data: any): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/pois/${poiId}/dishes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể tạo món ăn mới');
  }
  return res.json();
};

export const adminUpdateDish = async (dishId: number, data: any): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/dishes/${dishId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể cập nhật món ăn');
  }
  return res.json();
};

export const adminDeleteDish = async (dishId: number): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/dishes/${dishId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể xóa món ăn');
  }
  return res.json();
};

export const adminBatchImportMenu = async (poiId: number, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_V1}/admin/pois/${poiId}/menu/batch-import`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Lỗi nhập hàng loạt thực đơn');
  }
  return res.json();
};

export const adminEvictCache = async (pattern = 'poi:*'): Promise<any> => {
  const res = await fetch(`${API_V1}/admin/cache/evict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ pattern }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Không thể xóa cache');
  }
  return res.json();
};

export const getDashboardSummary = async (): Promise<any> => {
  const res = await fetch(`${API_V1}/analytics/dashboard-summary`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể tải báo cáo Dashboard');
  }
  return res.json();
};

export const getHeatmap = async (minDwellSeconds = 30, limit = 500): Promise<any> => {
  const res = await fetch(`${API_V1}/analytics/heatmap?minDwellSeconds=${minDwellSeconds}&limit=${limit}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể tải bản đồ nhiệt');
  }
  return res.json();
};
