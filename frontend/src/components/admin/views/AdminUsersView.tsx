'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  adminGetUsers,
  adminUpdateUserRole,
  adminUpdateUserLockStatus,
  adminDeleteUser,
} from '@/services/api';
import { AdminUserItem } from '@/types';

type ConfirmAction = {
  type: 'lock' | 'unlock' | 'delete';
  user: AdminUserItem;
};

export default function AdminUsersView() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modal xác nhận thao tác
  const [confirmModal, setConfirmModal] = useState<ConfirmAction | null>(null);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  // Toast thông báo
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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

  // Đổi vai trò trực tiếp
  const handleRoleChange = async (user: AdminUserItem, newRole: string) => {
    if (user.role === newRole) return;
    setActionLoadingId(user.id);
    try {
      await adminUpdateUserRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      showToast('success', `Đã cập nhật vai trò cho "${user.displayName || user.email || user.id}" thành ${newRole}.`);
    } catch (err: unknown) {
      const e = err as Error;
      showToast('error', e.message || 'Không thể cập nhật vai trò người dùng.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Xác nhận thực hiện Khóa / Mở khóa / Xóa
  const handleConfirmSubmit = async () => {
    if (!confirmModal) return;
    const { type, user } = confirmModal;
    setIsSubmittingConfirm(true);

    try {
      if (type === 'lock' || type === 'unlock') {
        const nextLockState = type === 'lock';
        await adminUpdateUserLockStatus(user.id, nextLockState);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, locked: nextLockState } : u))
        );
        showToast(
          'success',
          nextLockState
            ? `Đã khóa tài khoản "${user.displayName || user.email || user.id}".`
            : `Đã mở khóa tài khoản "${user.displayName || user.email || user.id}".`
        );
      } else if (type === 'delete') {
        await adminDeleteUser(user.id);
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        showToast('success', `Đã xóa vĩnh viễn tài khoản "${user.displayName || user.email || user.id}".`);
      }
      setConfirmModal(null);
    } catch (err: unknown) {
      const e = err as Error;
      showToast('error', e.message || 'Thao tác thất bại.');
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

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
    <div className="space-y-4 animate-fadeIn relative">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
              : 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-500/10'
          }`}
        >
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-700 cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>
      )}

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
                <th className="p-3 min-w-[200px]">Người dùng / Email</th>
                <th className="p-3 min-w-[110px]">Nguồn</th>
                <th className="p-3 min-w-[140px]">Vai trò (Role)</th>
                <th className="p-3 min-w-[90px]">Lượt nghe</th>
                <th className="p-3 min-w-[80px]">Check-in</th>
                <th className="p-3 min-w-[130px]">Trạng thái</th>
                <th className="p-3 min-w-[130px] text-right">Thao tác</th>
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
                    <td className="p-3"><div className="w-16 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="p-3"><div className="w-24 h-6 bg-slate-200 rounded-lg" /></td>
                    <td className="p-3"><div className="w-12 h-4 bg-slate-200 rounded" /></td>
                    <td className="p-3"><div className="w-12 h-4 bg-slate-200 rounded" /></td>
                    <td className="p-3"><div className="w-20 h-4 bg-slate-200 rounded" /></td>
                    <td className="p-3 text-right"><div className="w-20 h-6 bg-slate-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                /* Empty State */
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
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
                  const isUpdating = actionLoadingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        user.locked ? 'bg-rose-50/20' : ''
                      }`}
                    >
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
                            <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{user.displayName || 'Người dùng'}</span>
                              {user.locked && (
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                                  Bị khóa
                                </span>
                              )}
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

                      {/* Vai trò (Role) - Đổi quyền trực tiếp */}
                      <td className="p-3">
                        <div className="relative inline-block">
                          <select
                            value={isRoleAdmin ? 'ROLE_ADMIN' : 'ROLE_USER'}
                            disabled={isUpdating}
                            onChange={(e) => handleRoleChange(user, e.target.value)}
                            title="Nhấp để thay đổi quyền"
                            className={`text-[11px] font-bold pl-2.5 pr-6 py-1 rounded-lg border appearance-none cursor-pointer outline-none transition-all shadow-2xs ${
                              isRoleAdmin
                                ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200/80 focus:ring-2 focus:ring-purple-300'
                                : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200/80 focus:ring-2 focus:ring-blue-300'
                            } disabled:opacity-50`}
                          >
                            <option value="ROLE_USER">ROLE_USER</option>
                            <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500 text-[9px]">
                            {isUpdating ? '⏳' : '▼'}
                          </div>
                        </div>
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
                        {user.locked ? (
                          <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            Đã khóa
                          </span>
                        ) : isRoleAdmin ? (
                          <span className="text-purple-600">🟢 Quản trị viên</span>
                        ) : (
                          <span className="text-emerald-600">🟢 Khách du lịch</span>
                        )}
                      </td>

                      {/* Thao tác (Khóa / Mở khóa / Xóa) */}
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Nút Khóa / Mở khóa */}
                          {user.locked ? (
                            <button
                              onClick={() => setConfirmModal({ type: 'unlock', user })}
                              disabled={isUpdating}
                              title="Mở khóa tài khoản này"
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50 shadow-2xs"
                            >
                              <span>🔓</span> Mở khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmModal({ type: 'lock', user })}
                              disabled={isUpdating}
                              title="Khóa tài khoản này"
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50 shadow-2xs"
                            >
                              <span>🔒</span> Khóa
                            </button>
                          )}

                          {/* Nút Xóa */}
                          <button
                            onClick={() => setConfirmModal({ type: 'delete', user })}
                            disabled={isUpdating}
                            title="Xóa vĩnh viễn tài khoản"
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50 shadow-2xs"
                          >
                            <span>🗑️</span> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xác Nhận Hành Động (Lock / Unlock / Delete) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full space-y-4 animate-scaleUp">
            {/* Header Icon */}
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-100 text-rose-600'
                    : confirmModal.type === 'lock'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {confirmModal.type === 'delete' ? '🗑️' : confirmModal.type === 'lock' ? '🔒' : '🔓'}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {confirmModal.type === 'delete'
                    ? 'Xác nhận xóa tài khoản'
                    : confirmModal.type === 'lock'
                    ? 'Xác nhận khóa tài khoản'
                    : 'Xác nhận mở khóa tài khoản'}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmModal.type === 'delete'
                    ? 'Hành động này sẽ xóa vĩnh viễn dữ liệu người dùng'
                    : 'Thay đổi trạng thái quyền truy cập của người dùng'}
                </p>
              </div>
            </div>

            {/* Thông tin tài khoản mục tiêu */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-500">Tài khoản được chọn:</p>
              <p className="font-bold text-slate-900 text-sm">
                {confirmModal.user.displayName || 'Người dùng'}
              </p>
              <p className="text-slate-500 font-mono text-[11px]">
                {confirmModal.user.email || confirmModal.user.providerId || 'Không có email/phone'} (ID: #{confirmModal.user.id})
              </p>
            </div>

            {/* Cảnh báo chi tiết */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmModal.type === 'delete' ? (
                <span className="text-rose-600 font-medium">
                  ⚠️ Cảnh báo: Việc xóa tài khoản sẽ hủy liên kết tất cả lịch sử check-in, đánh giá và thông tin tài khoản liên quan. Hành động này không thể hoàn tác!
                </span>
              ) : confirmModal.type === 'lock' ? (
                <span>
                  Sau khi bị khóa, người dùng này sẽ không thể đăng nhập vào ứng dụng qua Google hoặc Số điện thoại.
                </span>
              ) : (
                <span>
                  Sau khi mở khóa, người dùng này có thể đăng nhập và sử dụng các tính năng bình thường.
                </span>
              )}
            </p>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={isSubmittingConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmittingConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : confirmModal.type === 'lock'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                {isSubmittingConfirm && <span className="animate-spin inline-block">🔄</span>}
                <span>
                  {confirmModal.type === 'delete'
                    ? 'Xác nhận xóa vĩnh viễn'
                    : confirmModal.type === 'lock'
                    ? 'Xác nhận khóa'
                    : 'Xác nhận mở khóa'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
