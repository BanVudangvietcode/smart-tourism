'use client';

import React from 'react';

interface AdminSettingsViewProps {
  adminEvictCache: (pattern: string) => Promise<any>;
  showNotification: (type: 'success' | 'error', message: string) => void;
}

export default function AdminSettingsView({
  adminEvictCache,
  showNotification,
}: AdminSettingsViewProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-lg font-black text-slate-900">Thao Tác Hệ Thống & Redis Cache</h2>
        <p className="text-xs text-slate-500">Quản trị bộ nhớ cache, PostGIS spatial indices, và kết nối máy chủ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Xóa Bộ Nhớ Cache Nhanh</h3>
          <div className="space-y-2">
            <button
              onClick={() => adminEvictCache('poi:*').then(() => showNotification('success', 'Đã xóa cache POI!'))}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer"
            >
              <span>⚡ Xóa Cache Quán Ăn (`poi:*`)</span>
              <span className="text-[10px] text-slate-400">Key POIs</span>
            </button>
            <button
              onClick={() => adminEvictCache('menu:*').then(() => showNotification('success', 'Đã xóa cache Thực đơn!'))}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer"
            >
              <span>⚡ Xóa Cache Thực Đơn (`menu:*`)</span>
              <span className="text-[10px] text-slate-400">Key Dishes</span>
            </button>
            <button
              onClick={() => adminEvictCache('*').then(() => showNotification('success', 'Đã xóa toàn bộ Cache Redis!'))}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer"
            >
              <span>🔥 Xóa Toàn Bộ Redis Cache (`*`)</span>
              <span className="text-[10px] text-rose-500">Flush DB</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Thông Số Máy Chủ Backend</h3>
          <div className="space-y-2 text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Server Engine:</span>
              <span className="text-slate-900 font-mono">Spring Boot 3.3.4 (Java 17)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Database:</span>
              <span className="text-slate-900 font-mono">PostgreSQL 16 + PostGIS 3.4</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Spatial Index:</span>
              <span className="text-emerald-600 font-mono">GIST (geom_point)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Audio Format:</span>
              <span className="text-slate-900 font-mono">MP3 (206 Partial Content Stream)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
