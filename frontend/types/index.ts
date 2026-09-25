export interface POI {
  id: string;
  name: string;
  description: string;
  address: string;
  category: string;
  rating?: number;
  imageUrl?: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  message: string;
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    phone: string;
  };
}
