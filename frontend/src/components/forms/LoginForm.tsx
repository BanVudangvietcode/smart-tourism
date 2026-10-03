'use client';

import { useState, useEffect, useRef } from 'react';
import { requestOtp, verifyOtpAndLogin, loginWithGoogle } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function LoginForm() {
  const { user, login, logout } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('sw_token');
    if (savedToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(savedToken);
    }
  }, []);

  // Initialize Google Sign-In
  useEffect(() => {
    if (token || user || !GOOGLE_CLIENT_ID) return; // Already logged in or no client ID

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

    const timer = setTimeout(initGoogle, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const handleGoogleResponse = async (response: { credential: string }) => {
    setLoading(true);
    setMessage('');
    try {
      const authRes = await loginWithGoogle(response.credential);
      login(authRes);
      setToken(authRes.token);
      localStorage.setItem('sw_token', authRes.token);
    } catch (error: unknown) {
      const err = error as Error;
      setMessage(err.message || 'Lỗi đăng nhập Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOneTap = () => {
    if (!GOOGLE_CLIENT_ID) {
      setMessage('Google Client ID chưa được cấu hình. Vui lòng đặt NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setMessage('');
    
    try {
      await requestOtp(phone);
      setStep(2);
    } catch (error: unknown) {
      const err = error as Error;
      setMessage(err.message || 'Lỗi khi gửi yêu cầu OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setMessage('');
    
    try {
      const res = await verifyOtpAndLogin(phone, otp);
      setToken(res.token);
      localStorage.setItem('sw_token', res.token);
    } catch (error: unknown) {
      const err = error as Error;
      setMessage(err.message || 'Lỗi xác nhận OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (token || user) {
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
          onClick={() => { 
            setToken(null);
            logout();
            localStorage.removeItem('sw_token');
          }} 
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
          🙌 Welcome in<br />Saigon Whispers
        </h3>
      </div>

      {/* ── Google Sign In ── */}
      <div className="mb-6">
        {GOOGLE_CLIENT_ID ? (
          <div ref={googleBtnRef} className="flex justify-center" />
        ) : (
          <button
            onClick={handleGoogleOneTap}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-[13px] py-[16px] px-4 rounded-[20px] transition disabled:opacity-50 cursor-pointer"
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

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[11px] text-gray-400 font-medium">hoặc đăng nhập bằng SĐT</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      
      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <div className="relative">
            <input 
              type="tel" 
              className="w-full px-6 py-[18px] bg-[#FAF9F6] border-none rounded-[20px] text-[#222222] text-[13px] font-medium placeholder-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 transition-all" 
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={loading}
              required
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FBE4B9]"></div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FF4522] text-white py-[18px] rounded-[20px] text-[13px] font-black hover:bg-[#E63E1F] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-[0_4px_14px_rgba(255,69,34,0.3)] tracking-wider cursor-pointer"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'SIGN IN 👈'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 animate-in fade-in duration-500">
          <p className="text-[13px] text-[#787774] mb-1 font-medium text-left">Mã OTP đã được gửi vào Telegram.</p>
          <div className="relative">
            <input 
              type="text" 
              className="w-full px-6 py-[18px] bg-[#FAF9F6] border-none rounded-[20px] text-[#222222] text-xl text-center font-bold placeholder-[#D1D1D1] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 transition-all tracking-[0.4em]" 
              placeholder="••••••"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              disabled={loading}
              required
              autoFocus
              maxLength={6}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#FBE4B9]"></div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FF4522] text-white py-[18px] rounded-[20px] text-[13px] font-black hover:bg-[#E63E1F] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-[0_4px_14px_rgba(255,69,34,0.3)] tracking-wider cursor-pointer"
          >
            {loading ? 'ĐANG XÁC THỰC...' : 'VERIFY 👈'}
          </button>
          
          <button 
            type="button" 
            onClick={() => { setStep(1); setOtp(''); setMessage(''); }} 
            className="text-[12px] font-medium text-[#888888] hover:text-[#222222] transition-colors mt-2 cursor-pointer"
          >
            Đổi số điện thoại khác
          </button>
        </form>
      )}

      {message && (
        <div className="mt-4 text-center">
          <span className={`text-[12px] font-medium ${message.includes('Lỗi') ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
            {message}
          </span>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-[10px] text-[#A1A1A1] font-medium tracking-wide">
          By signing up, you confirm our<br />
          <span className="text-[#333333] font-bold">Terms of Use</span> and <span className="text-[#333333] font-bold">Privacy policy</span>
        </p>
      </div>
    </div>
  );
}
