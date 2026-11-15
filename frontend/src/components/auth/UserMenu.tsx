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
        {isAuthenticated && user ? (
          // Logged-in: show avatar
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white/80 hover:scale-105 active:scale-95 transition cursor-pointer"
            title={user.displayName || tk('label_user_default')}
          >
            {getInitials()}
          </button>
        ) : (
          // Not logged in: show login button
          <button
            onClick={openLoginModal}
            className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg border border-white/60 text-gray-700 hover:bg-white transition cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[11px] sm:text-xs font-bold hidden sm:inline">{tk('btn_login')}</span>
          </button>
        )}

        {/* Dropdown menu when logged in */}
        {showDropdown && isAuthenticated && user && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900 truncate">{user.displayName || tk('label_user_default')}</p>
              <p className="text-xs text-gray-500 truncate">{user.email || `ID: ${user.userId}`}</p>
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'
              }`}>
                {user.role === 'ADMIN' ? '⚡ Quản trị viên' : (user.role === 'GUEST' ? tk('label_guest') : tk('label_member'))}
              </span>
            </div>

            {onOpenFavorites && (
              <button
                type="button"
                onClick={() => {
                  onOpenFavorites();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2 cursor-pointer border-b border-gray-100"
              >
                <span>❤️</span>
                <span>{tk('label_favorites')}</span>
              </button>
            )}

            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setShowDropdown(false)}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-50 transition flex items-center gap-2 cursor-pointer border-b border-gray-100"
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
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {tk('btn_logout')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
