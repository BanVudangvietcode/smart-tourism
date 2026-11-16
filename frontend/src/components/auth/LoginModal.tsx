'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { loginWithGoogle } from '@/services/api';

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const googleBtnRef = useRef<HTMLDivElement>(null);

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

    const timer = setTimeout(initGoogle, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

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
            {subtitle || 'Đăng nhập nhanh 1-chạm bằng tài khoản Google để lưu địa điểm yêu thích và đánh giá.'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-start gap-2">
            <span>⚠️</span>
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        {/* Google Sign In Area */}
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

          {/* Continue as Guest button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleClose()}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Tiếp tục với tư cách Khách
            </button>
          </div>
        </div>

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
