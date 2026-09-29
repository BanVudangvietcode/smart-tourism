'use client';

import { useState, useEffect } from 'react';
import { requestOtp, verifyOtpAndLogin } from '@/services/api';

export default function LoginForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('sw_token');
    if (savedToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(savedToken);
    }
  }, []);

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

  if (token) {
    return (
      <div className="w-full max-w-sm bg-white border border-[#EAEAEA] rounded-[32px] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col text-center">
        <div className="w-16 h-16 bg-[#F9F9F8] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✨</span>
        </div>
        <h3 className="text-2xl font-bold text-[#111111] mb-2">Đã đăng nhập</h3>
        <p className="text-sm text-[#787774] mb-8">Trải nghiệm của bạn đã sẵn sàng.</p>
        
        <button 
          onClick={() => { 
            setToken(null);
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

