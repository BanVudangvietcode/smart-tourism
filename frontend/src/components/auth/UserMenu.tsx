'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserMenuProps {
  onOpenFavorites?: () => void;
}

export default function UserMenu({ onOpenFavorites }: UserMenuProps = {}) {
  const { user, logout, isAuthenticated, openLoginModal } = useAuth();
  const { tk } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Get initials for avatar
  const getInitials = () => {
    if (!user?.displayName) return '👤';
    const words = user.displayName.trim().split(' ').filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {isAuthenticated && user ? (
        // ── ĐÃ ĐĂNG NHẬP: HIỂN THỊ AVATAR + TÊN NGƯỜI DÙNG ──
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 bg-white/95 backdrop-blur-md hover:bg-white pl-1.5 pr-3 py-1 sm:pl-2 sm:pr-3.5 sm:py-1.5 rounded-2xl shadow-lg border border-slate-200/80 hover:border-blue-400 active:scale-95 transition-all cursor-pointer"
          title={user.displayName || 'Tài khoản cá nhân'}
        >
          {/* Avatar icon tròn gradient */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 rounded-xl flex items-center justify-center text-white font-black text-[10px] sm:text-xs shadow-sm shrink-0">
            {getInitials()}
          </div>

          {/* Tên người dùng */}
          <div className="text-left max-w-[90px] sm:max-w-[120px] md:max-w-[150px] truncate">
            <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate leading-tight">
              {user.displayName || user.email?.split('@')[0] || 'Người dùng'}
            </p>
            <p className="text-[9px] text-blue-600 font-semibold leading-tight hidden xs:block">
              {user.role === 'ADMIN' ? '⚡ Quản trị' : 'Thành viên'}
            </p>
          </div>

          {/* Mũi tên Dropdown */}
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
              showDropdown ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        // ── CHƯA ĐĂNG NHẬP: HIỆN NÚT NỔI BẬT ĐÒI ĐĂNG NHẬP ──
        <button
          onClick={openLoginModal}
          className="group flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white pl-2 pr-3 py-1.5 sm:pl-2.5 sm:pr-3.5 sm:py-2 rounded-2xl shadow-lg shadow-blue-500/20 border border-white/40 active:scale-95 transition-all cursor-pointer"
          title="Bấm để đăng nhập"
        >
          {/* Icon avatar rỗng */}
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          {/* Dòng chữ đòi đăng nhập */}
          <div className="text-left">
            <span className="text-[11px] sm:text-xs font-black tracking-tight leading-none block">
              Đăng nhập
            </span>
          </div>
        </button>
      )}

      {/* ── Dropdown menu khi đã đăng nhập ── */}
      {showDropdown && isAuthenticated && user && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900 truncate">
              {user.displayName || user.email?.split('@')[0] || 'Người dùng'}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email || `ID: ${user.userId}`}</p>
            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'
            }`}>
              {user.role === 'ADMIN' ? '⚡ Quản trị viên' : 'Thành viên'}
            </span>
          </div>

          {onOpenFavorites && (
            <button
              type="button"
              onClick={() => {
                onOpenFavorites();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2 cursor-pointer border-b border-slate-100"
            >
              <span>❤️</span>
              <span>{tk('label_favorites')}</span>
            </button>
          )}

          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              onClick={() => setShowDropdown(false)}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-50 transition flex items-center gap-2 cursor-pointer border-b border-slate-100"
            >
              <span>⚡</span>
              <span>{tk('label_admin')}</span>
            </Link>
          )}

          <button
            onClick={() => {
              logout();
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{tk('btn_logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
