'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loginWithGoogle } from '@/services/api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function UserMenu() {
  const { user, login, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Initialize Google Sign-In when modal opens
  useEffect(() => {
    if (!showLoginModal || !GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 320,
        });
      }
    };

    // SDK may still be loading
    const timer = setTimeout(initGoogle, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoginModal]);

  const handleGoogleResponse = async (response: { credential: string }) => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const authRes = await loginWithGoogle(response.credential);
      login(authRes);
      setShowLoginModal(false);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Trigger Google One-Tap manually (fallback if renderButton fails)
  const handleGoogleOneTap = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID chưa được cấu hình.');
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.prompt();
    }
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!user?.displayName) return '?';
    return user.displayName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* ── Avatar / Login Button ── */}
      <div className="relative" ref={dropdownRef}>
        {user ? (
          // Logged-in: show avatar
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white/80 hover:scale-105 active:scale-95 transition cursor-pointer"
            title={user.displayName || 'Tài khoản'}
          >
            {getInitials()}
          </button>
        ) : (
          // Not logged in: show login button
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-white/60 text-gray-700 hover:bg-white transition cursor-pointer flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-bold hidden sm:inline">Đăng nhập</span>
          </button>
        )}

        {/* Dropdown menu when logged in */}
        {showDropdown && user && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900 truncate">{user.displayName || 'Người dùng'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email || `ID: ${user.userId}`}</p>
              <span className="inline-block mt-1 text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                {user.role === 'GUEST' ? 'Khách' : 'Thành viên'}
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* ── Login Modal ── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => {
                setShowLoginModal(false);
                setError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">Đăng nhập</h2>
              <p className="text-sm text-gray-500 mt-1">Saigon Whispers – Thì Thầm Sài Gòn</p>
            </div>

            {/* Google Sign In Button (rendered by SDK) */}
            <div className="flex flex-col items-center gap-4">
              {GOOGLE_CLIENT_ID ? (
                <>
                  <div ref={googleBtnRef} className="flex justify-center" />
                </>
              ) : (
                // No GOOGLE_CLIENT_ID configured – show a styled Google button
                <button
                  onClick={handleGoogleOneTap}
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm py-3.5 px-4 rounded-2xl transition disabled:opacity-50 cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  <span>Đăng nhập với Google</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">hoặc</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Link to OTP login page */}
            <a
              href="/login"
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm py-3.5 px-4 rounded-2xl transition cursor-pointer"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Đăng nhập bằng số điện thoại
            </a>

            {/* Error message */}
            {error && (
              <p className="mt-4 text-center text-xs font-medium text-red-500">{error}</p>
            )}

            {/* Terms */}
            <p className="mt-6 text-center text-[10px] text-gray-400">
              Khi đăng nhập, bạn đồng ý với{' '}
              <span className="text-gray-600 font-semibold">Điều khoản sử dụng</span> và{' '}
              <span className="text-gray-600 font-semibold">Chính sách bảo mật</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
