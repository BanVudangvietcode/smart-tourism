'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminGetUsers } from '@/services/api';
import { AdminUserItem } from '@/types';

export default function AdminUsersView() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetUsers();
      setUsers(data || []);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Không thể tải danh sách người dùng từ hệ thống.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const getInitials = (name?: string | null, email?: string | null, phone?: string | null) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.trim().slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    if (phone && phone.trim()) {
      return phone.slice(-2);
    }
    return '👤';
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900">Quản Lý Người Dùng &amp; Phân Quyền</h2>
          <p className="text-xs text-slate-500">
            Danh sách tài khoản Google &amp; Số điện thoại đăng nhập hệ thống ({users.length} tài khoản)
          </p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
          title="Tải lại danh sách"
        >
          <span className={loading ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
          <span>{error}</span>
          <button
            onClick={loadUsers}
            className="underline font-bold ml-2 cursor-pointer hover:text-rose-900"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3 min-w-[220px]">Người dùng / Email</th>
                <th className="p-3 min-w-[130px]">Nguồn (Provider)</th>
                <th className="p-3 min-w-[110px]">Vai trò (Role)</th>
                <th className="p-3 min-w-[100px]">Lượt nghe</th>
                <th className="p-3 min-w-[90px]">Check-in</th>
                <th className="p-3 min-w-[130px]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                /* Loading Skeleton */
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3.5 bg-slate-200 rounded" />
                          <div className="w-36 h-3 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="w-16 h-5 bg-slate-200 rounded-full" />
                    </td>
                    <td className="p-3">
                      <div className="w-20 h-5 bg-slate-200 rounded" />
                    </td>
                    <td className="p-3">
                      <div className="w-12 h-4 bg-slate-200 rounded" />
                    </td>
                    <td className="p-3">
                      <div className="w-12 h-4 bg-slate-200 rounded" />
                    </td>
                    <td className="p-3">
                      <div className="w-24 h-4 bg-slate-200 rounded" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                /* Empty State */
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-3xl">👥</span>
                      <p className="font-bold text-slate-700 text-sm">Chưa có người dùng nào</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Chưa ghi nhận tài khoản đăng ký qua Google hoặc Số điện thoại. Hệ thống sẽ tự động cập nhật khi có du khách đăng nhập.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Data Rows */
                users.map((user) => {
                  const isRoleAdmin =
                    user.role === 'ROLE_ADMIN' || user.role === 'ADMIN';
                  const providerLower = (user.provider || '').toLowerCase();
                  const contactDisplay =
                    user.email || user.providerId || 'Chưa cập nhật';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      {/* Người dùng / Email */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.displayName || 'Avatar'}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                              {getInitials(user.displayName, user.email, user.providerId)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {user.displayName || 'Người dùng'}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono truncate">
                              {contactDisplay}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Nguồn đăng nhập (Provider) */}
                      <td className="p-3">
                        {providerLower === 'google' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="text-[11px]">🔴</span> Google
                          </span>
                        ) : providerLower === 'phone' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="text-[11px]">📱</span> Phone
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {user.provider}
                          </span>
                        )}
                      </td>

                      {/* Vai trò (Role) */}
                      <td className="p-3">
                        {isRoleAdmin ? (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200">
                            ROLE_ADMIN
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                            ROLE_USER
                          </span>
                        )}
                      </td>

                      {/* Lượt nghe */}
                      <td className="p-3 text-slate-600 font-medium">
                        {user.listenCount} lượt
                      </td>

                      {/* Check-in */}
                      <td className="p-3 text-slate-600 font-medium">
                        {user.checkinCount} lần
                      </td>

                      {/* Trạng thái */}
                      <td className="p-3 font-bold text-xs">
                        {isRoleAdmin ? (
                          <span className="text-purple-600">🟢 Quản trị viên</span>
                        ) : (
                          <span className="text-emerald-600">🟢 Khách du lịch</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
