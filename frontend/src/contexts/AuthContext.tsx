'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthV1Response } from '@/types';

interface AuthUser {
  userId: number;
  email: string | null;
  displayName: string | null;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (response: AuthV1Response) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('sw_token');
      const savedUser = localStorage.getItem('sw_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore parse errors
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((response: AuthV1Response) => {
    const authUser: AuthUser = {
      userId: response.userId,
      email: response.email,
      displayName: response.displayName,
      role: response.role,
    };
    setToken(response.token);
    setUser(authUser);
    localStorage.setItem('sw_token', response.token);
    localStorage.setItem('sw_user', JSON.stringify(authUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sw_token');
    localStorage.removeItem('sw_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
