import { HealthStatus, POI, AuthResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Hàm kiểm tra trạng thái kết nối Backend
export const checkHealth = async (): Promise<HealthStatus> => {
  try {
    // const res = await fetch(`${API_BASE_URL}/health`);
    // return await res.json();
    return { status: 'ok', message: 'Connected (Mock)', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'error', message: 'Connection failed', timestamp: new Date().toISOString() };
  }
};

// Hàm lấy danh sách địa điểm ẩm thực (POI) mock data
export const getPois = async (): Promise<POI[]> => {
  return [
    {
      id: '1',
      name: 'Ốc Oanh Quận 4',
      description: 'Quán ốc nổi tiếng với các món hải sản tươi ngon.',
      address: 'Vĩnh Khánh, Phường 8, Quận 4, TP.HCM',
      category: 'Hải sản',
      rating: 4.5,
    },
    {
      id: '2',
      name: 'Mì Ốc Hến Dì Lan',
      description: 'Mì ốc hến chua cay đậm đà, đặc sản khó quên.',
      address: '2/4 Ngô Văn Sở, Phường 13, Quận 4, TP.HCM',
      category: 'Ăn vặt',
      rating: 4.2,
    },
    {
      id: '3',
      name: 'Bánh Cuốn Nóng Bà Hanh',
      description: 'Bánh cuốn tráng tay truyền thống.',
      address: '26 Nguyễn Trường Tộ, Phường 12, Quận 4, TP.HCM',
      category: 'Ăn sáng',
      rating: 4.8,
    }
  ];
};

// API Yêu cầu gửi mã OTP qua số điện thoại (Backend sẽ gọi Telegram Bot gửi OTP)
export const requestOtp = async (phone: string): Promise<boolean> => {
  console.log(`[API] Đang gửi yêu cầu cấp OTP cho SĐT: ${phone}`);
  const res = await fetch(`${API_BASE_URL}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Lỗi khi gửi yêu cầu OTP');
  }
  return true;
};

// API Xác nhận mã OTP và nhận về JWT
export const verifyOtpAndLogin = async (phone: string, otp: string): Promise<AuthResponse> => {
  console.log(`[API] Đang xác nhận OTP ${otp} cho SĐT: ${phone}`);
  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Lỗi xác nhận OTP');
  }
  
  const data = await res.json();
  return {
    token: data.token,
    user: { id: 'user-id', phone: data.phone }
  };
};
