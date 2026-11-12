'use client';

import React from 'react';

export default function AdminUsersView() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-lg font-black text-slate-900">Quản Lý Người Dùng & Phân Quyền</h2>
        <p className="text-xs text-slate-500">Danh sách tài khoản Admin và khách du lịch tương tác hệ thống</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Vai trò (Role)</th>
              <th className="p-3">Lượt nghe</th>
              <th className="p-3">Check-in</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50">
              <td className="p-3 font-bold text-slate-900">admin@saigonwhispers.vn</td>
              <td className="p-3">
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200">
                  ROLE_ADMIN
                </span>
              </td>
              <td className="p-3 text-slate-500">23 lượt</td>
              <td className="p-3 text-slate-500">4 lần</td>
              <td className="p-3 text-emerald-600 font-bold">🟢 Đang hoạt động</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="p-3 font-bold text-slate-900">traveler@saigonwhispers.vn</td>
              <td className="p-3">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                  ROLE_USER
                </span>
              </td>
              <td className="p-3 text-slate-500">12 lượt</td>
              <td className="p-3 text-slate-500">2 lần</td>
              <td className="p-3 text-emerald-600 font-bold">🟢 Khách du lịch</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
