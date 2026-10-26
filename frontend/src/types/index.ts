// Shared TypeScript types cho toàn bộ frontend - Đồng bộ cùng Backend Spring Boot

export interface HealthStatus {
  status: string;
  database?: string;
  timestamp: string;
}

// Danh mục địa điểm (Categories)
export interface Category {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string | null;
  sortOrder: number;
}

// Tóm tắt địa điểm (PoiSummaryResponse)
export interface PoiSummary {
  id: number;
  name: string;
  slug: string;
  address: string;
  thumbnailUrl: string | null;
  avgRating: number;
  reviewCount: number;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  categoryName: string;
  poiType: 'FOOD' | 'HISTORICAL' | 'RELIGIOUS' | 'LANDMARK' | 'CULTURE' | string;
  longitude: number;
  latitude: number;
  distanceMeters: number | null;
}

// Chi tiết địa điểm (PoiDetailResponse)
export interface PoiDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  district: string | null;
  ward: string | null;
  phone: string | null;
  openingHours: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  avgRating: number;
  reviewCount: number;
  popularity: number;
  audioUrl: string | null;
  thumbnailUrl: string | null;
  categoryName: string;
  poiType: string;
  longitude: number;
  latitude: number;
  images: string[];
}

// Món ăn trong thực đơn (DishDto)
export interface Dish {
  id: number;
  poiId: number;
  menuCategoryId: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  unit: string | null;
  isSignature: boolean;
  thumbnailUrl: string | null;
  allergens: string[];
  hasPeanuts: boolean;
  hasSeafood: boolean;
  hasGluten: boolean;
}

// Nhóm thực đơn (MenuCategoryDto)
export interface MenuCategory {
  categoryId: number;
  categoryName: string;
  sortOrder: number;
  dishes: Dish[];
}

// Toàn bộ menu của một quán (PoiMenuResponse)
export interface PoiMenuResponse {
  poiId: number;
  poiName: string;
  totalDishes: number;
  categories: MenuCategory[];
}

// Đánh giá cộng đồng (ReviewResponse)
export interface ReviewItem {
  id: number;
  poiId: number;
  userId: number;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
}

export interface ReviewPageResponse {
  items: ReviewItem[];
  totalCount: number;
  page: number;
  size: number;
  totalPages: number;
  avgRating: number;
  reviewCount: number;
}

// Huy hiệu check-in
export interface Badge {
  badgeCode: string;
  badgeName: string;
  description: string;
  iconUrl: string;
  unlockedAt: string;
}

// Kết quả check-in GPS 30m
export interface CheckinResult {
  success: boolean;
  poiId: number;
  poiName: string;
  distanceMeters: number;
  verified: boolean;
  message: string;
  checkinTime: string;
  newlyUnlockedBadges?: Badge[];
}

// Tuyến tham quan (Tour)
export interface TourSummary {
  id: number;
  name: string;
  slug: string;
  description: string;
  theme: string;
  estimatedDurationMinutes: number;
  estimatedCost: number;
  totalDistanceMeters: number;
  thumbnailUrl: string | null;
  stopCount: number;
  isPublic: boolean;
  creatorId: number | null;
  creatorRole: string;
  creatorName: string;
  createdAt: string;
}

export interface TourStop {
  id: number;
  stopOrder: number;
  poiId: number;
  poiName: string;
  address: string;
  latitude: number;
  longitude: number;
  thumbnailUrl: string | null;
  suggestedDurationMinutes: number;
  notes: string | null;
}

export interface TourDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  theme: string;
  estimatedDurationMinutes: number;
  estimatedCost: number;
  totalDistanceMeters: number;
  thumbnailUrl: string | null;
  isPublic: boolean;
  creatorName?: string;
  stops: TourStop[];
}

// Kế hoạch tour tự động (CustomPlanResponse)
export interface CustomPlanResponse {
  tourId: number | null;
  tourName: string;
  theme: string;
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  totalEstimatedCost: number;
  stops: TourStop[];
  message?: string;
}

// AI Hỏi đáp
export interface AiAskResponse {
  answer: string;
  poiId?: number | null;
  poiName?: string | null;
  conversationId: string;
  distanceMeters: number | null;
  suggestedFollowUps: string[];
}

export interface RecommendedDish {
  dishId: number;
  dishName: string;
  poiId: number;
  poiName: string;
  price: number;
  unit: string;
  imageUrl: string | null;
  isSignature: boolean;
  reason: string;
}

export interface AiRecommendDishResponse {
  summary: string;
  totalEstimatedPrice: number;
  budgetRemaining: number;
  dishes: RecommendedDish[];
  tips: string;
}

// Auth types
export interface AuthV1Response {
  token: string;
  tokenType: string;
  userId: number;
  email: string | null;
  phone?: string | null;
  displayName: string | null;
  role: string;
}

export interface UserProfile {
  id: number;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  provider: string;
  spicy: boolean;
  vegetarian: boolean;
  noSeafood: boolean;
  role: string;
  createdAt: string;
}

// Bản đồ & Dẫn đường
export interface MapPOI {
  id: string | number;
  name: string;
  desc: string;
  category: string;
  lat: number;
  lng: number;
  color: string;
  emoji: string;
  thumbnailUrl?: string | null;
  rating?: number;
  poiType?: string;
  rawPoi?: PoiSummary;
}

export interface NavStep {
  instruction: string;
  distance: string;
  distanceMeters: number;
  duration: string;
  maneuver: string;
  location: [number, number];
}

export interface RouteInfo {
  distance: string;
  duration: string;
  distanceM: number;
  durationS: number;
  eta: string;
}
