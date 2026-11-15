'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { loginAsAdmin } from '@/services/api';

export default function AdminLoginGuard() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const authRes = await loginAsAdmin(username.trim(), password.trim());
      login(authRes);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || 'Tài khoản hoặc mật khẩu Quản trị viên không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const isForbiddenUser = isAuthenticated && user && user.role !== 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white text-3xl shadow-xl shadow-purple-500/25 mb-1">
            🛡️
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Saigon Whispers Admin CMS
          </h1>
          <p className="text-xs text-slate-400">
            Hệ thống quản trị dữ liệu du lịch &amp; điều hành thành phố thông minh
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {isForbiddenUser ? (
            /* Logged in but not ADMIN */
            <div className="space-y-4">
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3">
                <span className="text-2xl">⛔</span>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-rose-400 uppercase tracking-wider">
                    Quyền truy cập bị từ chối (403)
                  </h3>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    Tài khoản <b className="text-white">{user.email || user.displayName || user.userId}</b> chỉ có vai trò <b className="text-amber-300 font-mono">[{user.role}]</b>, không đủ thẩm quyền để truy cập trang Quản trị viên (ADMIN).
                  </p>
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-400 font-bold bg-rose-950/50 p-2.5 rounded-xl border border-rose-800">
                  {error}
                </p>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tài khoản hoặc Email Quản trị
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin hoặc admin@saigonwhispers.vn"
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>🔒</span>
                  <span>{loading ? 'Đang chuyển đổi quyền...' : 'Đăng nhập Quản trị viên (ADMIN)'}</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition cursor-pointer"
                >
                  Đăng xuất tài khoản này
                </button>
              </form>
            </div>
          ) : (
            /* Not logged in */
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-1 text-slate-300 text-xs">
                <p className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>Khu vực bảo mật Quản trị viên</span>
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Vui lòng đăng nhập bằng tài khoản và mật khẩu Quản trị viên (ADMIN) để tiếp tục.
                </p>
              </div>

              {error && (
                <p className="text-xs text-rose-400 font-bold bg-rose-950/50 p-2.5 rounded-xl border border-rose-800">
                  {error}
                </p>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tài khoản hoặc Email
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin hoặc admin@saigonwhispers.vn"
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu quản trị"
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-purple-500/25 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>🔒</span>
                  <span>{loading ? 'Đang xác thực quyền Admin...' : 'Đăng nhập Quản trị viên'}</span>
                </button>
              </form>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-200 transition font-bold flex items-center justify-center gap-1.5"
            >
              <span>←</span>
              <span>Quay về trang chủ du khách</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
