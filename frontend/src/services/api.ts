import { HealthStatus, AuthResponse, POI } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const checkHealth = async (): Promise<HealthStatus> => {
  try {
    return { status: 'ok', message: 'Connected (Mock)', timestamp: new Date().toISOString() };
  } catch {
    return { status: 'error', message: 'Connection failed', timestamp: new Date().toISOString() };
  }
};

export const getPois = async (): Promise<POI[]> => [
  { id: '1', name: 'Ốc Oanh Quận 4', description: 'Quán ốc nổi tiếng với các món hải sản tươi ngon.', address: 'Vĩnh Khánh, Phường 8, Quận 4', category: 'Hải sản', rating: 4.5 },
  { id: '2', name: 'Mì Ốc Hến Dì Lan', description: 'Mì ốc hến chua cay đậm đà.', address: '2/4 Ngô Văn Sở, Phường 13, Quận 4', category: 'Ăn vặt', rating: 4.2 },
  { id: '3', name: 'Bánh Cuốn Nóng Bà Hanh', description: 'Bánh cuốn tráng tay truyền thống.', address: '26 Nguyễn Trường Tộ, Phường 12, Quận 4', category: 'Ăn sáng', rating: 4.8 },
];

export const requestOtp = async (phone: string): Promise<boolean> => {
  const res = await fetch(`${API_BASE}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi gửi yêu cầu OTP');
  }
  return true;
};

export const verifyOtpAndLogin = async (phone: string, otp: string): Promise<AuthResponse> => {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi xác nhận OTP');
  }
  const data = await res.json();
  return { token: data.token, user: { id: 'user-id', phone: data.phone } };
};

