'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithGoogle } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function LoginForm() {
  const router = useRouter();
  const { user, login, logout, isAuthenticated, deviceId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign-In
  useEffect(() => {
    if (isAuthenticated || !GOOGLE_CLIENT_ID) return;

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
          width: 280,
        });
      }
    };

    const timer = setTimeout(initGoogle, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleGoogleResponse = async (response: { credential: string }) => {
    setLoading(true);
    setMessage('');
    try {
      const authRes = await loginWithGoogle(response.credential, deviceId);
      login(authRes);
      router.push('/');
    } catch (error: unknown) {
      const err = error as Error;
      setMessage(err.message || 'Lỗi đăng nhập Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOneTap = () => {
    if (!GOOGLE_CLIENT_ID) {
      setMessage('Google Client ID chưa được cấu hình.');
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

  if (isAuthenticated) {
    return (
      <div className="w-full max-w-sm bg-white border border-[#EAEAEA] rounded-[32px] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col text-center">
        <div className="w-16 h-16 bg-[#F9F9F8] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✨</span>
        </div>
        <h3 className="text-2xl font-bold text-[#111111] mb-2">Đã đăng nhập</h3>
        <p className="text-sm text-[#787774] mb-2">Trải nghiệm của bạn đã sẵn sàng.</p>
        {user?.displayName && (
          <p className="text-sm font-semibold text-blue-600 mb-6">{user.displayName}</p>
        )}
        
        <button 
          onClick={() => logout()}
          className="w-full bg-[#F9F9F8] text-[#111111] py-4 rounded-full text-sm font-bold hover:bg-[#EAEAEA] transition-colors cursor-pointer"
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-white border border-[#EAEAEA] rounded-[32px] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col">
      <div className="mb-8 text-center sm:text-left">
        <h3 className="text-[24px] leading-tight font-extrabold text-[#222222] tracking-tight">
          🙌 Welcome to<br />Smart Tourism
        </h3>
        <p className="text-xs text-[#787774] mt-2">
          Đăng nhập 1-chạm bằng tài khoản Google để lưu địa điểm yêu thích và viết đánh giá.
        </p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
          {message}
        </div>
      )}

      {/* ── Google Sign In ── */}
      <div className="mb-6 flex flex-col items-center justify-center min-h-[50px]">
        {GOOGLE_CLIENT_ID ? (
          <div ref={googleBtnRef} className="flex justify-center" />
        ) : (
          <button
            onClick={handleGoogleOneTap}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-[13px] py-[14px] px-4 rounded-[20px] transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
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

      <div className="pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-2xl transition cursor-pointer"
        >
          Tiếp tục khám phá với tư cách Khách 👉
        </button>
      </div>
    </div>
  );
}
