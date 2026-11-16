'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { loginWithGoogle, requestTelegramOtp, verifyTelegramOtp, loginAsAdmin } from '@/services/api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

export default function LoginModal({ isOpen, onClose, title, subtitle }: LoginModalProps = {}) {
  const { isLoginModalOpen, closeLoginModal, login, deviceId } = useAuth();
  const { tk } = useLanguage();

  const showModal = isOpen !== undefined ? isOpen : isLoginModalOpen;
  const handleClose = onClose || closeLoginModal;

  const [activeTab, setActiveTab] = useState<'google' | 'phone'>('google');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [telegramBotUrl, setTelegramBotUrl] = useState('');
  const [telegramWebUrl, setTelegramWebUrl] = useState('');
  const [countdown, setCountdown] = useState(0);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Countdown timer for OTP resend (60 seconds)
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Initialize Google Sign-In SDK
  useEffect(() => {
    if (!showModal || !GOOGLE_CLIENT_ID) return;

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

    const timer = setTimeout(initGoogle, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, activeTab]);

  const handleGoogleResponse = async (response: { credential: string }) => {
    setLoading(true);
    setError('');
    try {
      const authRes = await loginWithGoogle(response.credential, deviceId);
      login(authRes);
      handleClose();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.trim()) return;
    if (countdown > 0) return;

    setLoading(true);
    setError('');
    setOtpMessage('');
    try {
      const res = await requestTelegramOtp(phone.trim());
      setOtpMessage(res.message || 'Mã OTP đã được gửi thành công qua Telegram.');
      setTelegramBotUrl(res.telegramBotUrl || '');
      setTelegramWebUrl(res.telegramWebUrl || '');
      setCountdown(60);
      setStep(2);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || 'Không thể gửi mã OTP qua Telegram.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    setError('');
    try {
      const authRes = await verifyTelegramOtp(phone.trim(), otp.trim());
      login(authRes);
      handleClose();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl relative animate-scaleUp">
        {/* Close button */}
        <button
          onClick={() => {
            handleClose();
            setError('');
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20 text-white text-2xl">
            ✨
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {title || tk('login_title')}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
            {subtitle || 'Đăng nhập để đánh giá, bình luận, lưu quán yêu thích và đồng bộ dữ liệu.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'google' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('phone')}
            className={`py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'phone' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            SĐT (OTP)
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-start gap-2">
            <span>⚠️</span>
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        {/* TAB 1: GOOGLE */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center min-h-[50px]">
              <div ref={googleBtnRef} className="w-full flex justify-center" />
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-bold py-2">
                <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý đăng nhập...</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TELEGRAM PHONE OTP */}
        {activeTab === 'phone' && (
          <div>
            {step === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Mã OTP sẽ được gửi qua Telegram Bot</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || !phone.trim() || countdown > 0}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20"
                >
                  {loading
                    ? 'Đang gửi mã...'
                    : countdown > 0
                    ? `Gửi lại sau (${countdown}s)`
                    : 'Nhận mã OTP qua Telegram'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                {otpMessage && (
                  <p className="text-[11px] text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">
                    {otpMessage}
                  </p>
                )}

                {telegramBotUrl && (
                  <div className="bg-sky-50 p-3 rounded-2xl border border-sky-100 space-y-2">
                    <div className="flex flex-col gap-1.5">
                      {telegramWebUrl && (
                        <a
                          href={telegramWebUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-[#229ED9] hover:bg-[#1e8ec3] text-white font-bold text-xs rounded-xl shadow-md transition transform active:scale-98 cursor-pointer"
                        >
                          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                          </svg>
                          <span>Mở trên Telegram Web (Trình duyệt)</span>
                        </a>
                      )}
                      <a
                        href={telegramBotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-white hover:bg-sky-100 text-[#229ED9] border border-[#229ED9]/30 font-bold text-[11px] rounded-xl transition cursor-pointer"
                      >
                        <span>Mở bằng ứng dụng Telegram App</span>
                      </a>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center leading-tight">
                      💡 Hoặc vào Telegram tìm bot <b className="text-sky-700">@smart_tourism_sts_bot</b> và gửi tin nhắn: <b className="text-slate-800 font-mono">{phone}</b> để nhận mã ngay!
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nhập mã OTP gồm 6 chữ số
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Nhập mã 6 số"
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-black tracking-widest text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(''); setTelegramBotUrl(''); }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !otp.trim()}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    {loading ? 'Đang xác thực...' : 'Xác thực & Đăng nhập'}
                  </button>
                </div>
                <div className="text-center pt-1">
                  {countdown > 0 ? (
                    <span className="text-[11px] font-bold text-slate-400">
                      Chưa nhận được mã? Gửi lại sau <span className="text-blue-600 font-extrabold">{countdown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestOtp()}
                      disabled={loading}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Chưa nhận được mã? Gửi lại mã OTP
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer info */}
        <p className="mt-6 text-center text-[10px] text-slate-400">
          {tk('login_terms')}{' '}
          <span className="text-slate-600 font-semibold">{tk('login_terms_link')}</span> &amp;{' '}
          <span className="text-slate-600 font-semibold">{tk('login_privacy_link')}</span>
        </p>
      </div>
    </div>
  );
}
