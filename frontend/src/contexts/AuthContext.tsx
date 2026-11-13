'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthV1Response } from '@/types';
import { createGuestSession } from '@/services/api';

interface AuthUser {
  userId: number;
  email: string | null;
  phone?: string | null;
  displayName: string | null;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isGuest: boolean;          // đang dùng phiên khách (chưa đăng nhập thật)
  isAuthenticated: boolean;  // đã đăng nhập thật (Google / SĐT / Admin)
  deviceId: string;
  login: (response: AuthV1Response) => void;
  logout: () => void;
  refreshGuestSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isGuest: true,
  isAuthenticated: false,
  deviceId: '',
  login: () => {},
  logout: () => {},
  refreshGuestSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState('');

  // Lấy hoặc tạo mới deviceId cho trình duyệt
  const getOrCreateDeviceId = (): string => {
    let id = localStorage.getItem('sw_device_id');
    if (!id) {
      id = 'web-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('sw_device_id', id);
    }
    return id;
  };

  const login = useCallback((response: AuthV1Response) => {
    const authUser: AuthUser = {
      userId: response.userId,
      email: response.email,
      phone: response.phone,
      displayName: response.displayName,
      role: response.role,
    };
    setToken(response.token);
    setUser(authUser);
    localStorage.setItem('sw_token', response.token);
    localStorage.setItem('sw_user', JSON.stringify(authUser));
  }, []);

  const refreshGuestSession = useCallback(async () => {
    try {
      const devId = getOrCreateDeviceId();
      setDeviceId(devId);
      const res = await createGuestSession(devId, 'web');
      login(res);
    } catch (err) {
      console.warn('Không thể tự động tạo Guest Session:', err);
    }
  }, [login]);

  // Load saved auth from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const devId = getOrCreateDeviceId();
        setDeviceId(devId);

        const savedToken = localStorage.getItem('sw_token');
        const savedUser = localStorage.getItem('sw_user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } else {
          // Tự động cấp phiên Guest để du khách dùng ngay không bị chặn
          await refreshGuestSession();
        }
      } catch (e) {
        console.error('Lỗi khởi tạo Auth:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshGuestSession]);

  // Gửi heartbeat hiện diện thời gian thực (Real-time active visitor ping)
  useEffect(() => {
    const currentDevId =
      deviceId ||
      (typeof window !== 'undefined' ? localStorage.getItem('sw_device_id') : '') ||
      'web-' + Math.random().toString(36).substring(2, 9);

    if (typeof window !== 'undefined') {
      localStorage.setItem('sw_device_id', currentDevId);
    }

    const ping = () => {
      // Chỉ gửi ping khi tab đang hiển thị (tránh ping ngầm khi đã khóa máy / ẩn tab)
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      // 1. Gửi tới Next.js real-time presence (trực tiếp port 3000)
      fetch('/api/realtime/ping?deviceId=' + encodeURIComponent(currentDevId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: currentDevId }),
        keepalive: true,
      }).catch(() => {});

      // 2. Gửi tới Spring Boot backend nếu đang chạy
      fetch('/api/v1/analytics/realtime/ping?deviceId=' + encodeURIComponent(currentDevId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: currentDevId }),
        keepalive: true,
      }).catch(() => {});
    };

    const leave = () => {
      const leaveUrl = '/api/realtime/leave?deviceId=' + encodeURIComponent(currentDevId);
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon(leaveUrl, JSON.stringify({ deviceId: currentDevId }));
        } else {
          fetch(leaveUrl, { method: 'POST', keepalive: true }).catch(() => {});
        }
      } catch {}

      try {
        fetch('/api/v1/analytics/realtime/leave?deviceId=' + encodeURIComponent(currentDevId), {
          method: 'POST',
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    // Ping tức thì ngay khi mở trang
    ping();
    // Heartbeat đều đặn mỗi 5 giây
    const interval = setInterval(ping, 5000);

    // Bắt sự kiện thoát, khóa màn hình, chuyển ứng dụng trên điện thoại (Mobile Page Lifecycle)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        leave();
      } else if (document.visibilityState === 'visible') {
        ping();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', leave);
    window.addEventListener('beforeunload', leave);

    return () => {
      clearInterval(interval);
      leave();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', leave);
      window.removeEventListener('beforeunload', leave);
    };
  }, [deviceId]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sw_token');
    localStorage.removeItem('sw_user');
    // Khởi tạo lại một guest session mới
    refreshGuestSession();
  }, [refreshGuestSession]);

  const isGuest = !user || user.role === 'GUEST';
  const isAuthenticated = !!user && user.role !== 'GUEST';

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isGuest, isAuthenticated, deviceId, login, logout, refreshGuestSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
