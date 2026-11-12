'use client';

import React from 'react';
import Link from 'next/link';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSidebar: string;
  setActiveSidebar: (tab: any) => void;
  poisCount: number;
  toursCount: number;
  onLogout: () => void;
}

export default function AdminSidebar({
  isOpen,
  onClose,
  activeSidebar,
  setActiveSidebar,
  poisCount,
  toursCount,
  onLogout,
}: AdminSidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'KPI & Biểu đồ' },
    { id: 'pois', label: 'Quán & POI', icon: '📍', desc: `${poisCount} địa điểm` },
    { id: 'menu', label: 'Thực Đơn', icon: '🍲', desc: 'Món ăn & AI OCR' },
    { id: 'tours', label: 'Tour', icon: '🗺️', desc: `${toursCount} tuyến hành trình` },
    { id: 'users', label: 'Người Dùng', icon: '👤', desc: 'Khách du lịch' },
    { id: 'settings', label: 'Thao Tác', icon: '⚙️', desc: 'Cache & Hạ tầng' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
            Menu Quản Trị
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = activeSidebar === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSidebar(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span className={`text-[10px] font-normal ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                  {item.desc}
                </span>
              </button>
            );
          })}
        </nav>

        {/* System Status in Footer */}
        <div className="p-3.5 m-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Spring Boot:</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 8080 OK
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">PostGIS 17:</span>
            <span className="text-blue-600 font-bold">5432 OK</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Redis 7:</span>
            <span className="text-rose-600 font-bold">6379 OK</span>
          </div>
        </div>

        {/* User action link back to Map & Logout */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
          <Link
            href="/"
            className="text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition"
          >
            <span>🗺️</span>
            <span>Bản đồ Du Lịch</span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
