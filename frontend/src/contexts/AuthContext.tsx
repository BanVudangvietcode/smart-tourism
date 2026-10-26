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
  deviceId: string;
  login: (response: AuthV1Response) => void;
  logout: () => void;
  refreshGuestSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
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

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sw_token');
    localStorage.removeItem('sw_user');
    // Khởi tạo lại một guest session mới
    refreshGuestSession();
  }, [refreshGuestSession]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, deviceId, login, logout, refreshGuestSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
