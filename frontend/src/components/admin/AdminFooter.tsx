'use client';

import React from 'react';
import Link from 'next/link';

interface AdminFooterProps {
  onScrollToTop?: () => void;
  poisCount?: number;
  toursCount?: number;
  onEvictCache?: () => void;
}

export default function AdminFooter({
  onScrollToTop,
  poisCount = 0,
  toursCount = 0,
  onEvictCache,
}: AdminFooterProps) {
  const handleScrollTop = () => {
    if (onScrollToTop) {
      onScrollToTop();
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="mt-12 pt-8 pb-12 border-t border-slate-200/90 text-slate-500 text-xs">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Section: Info & Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Col 1: System Info */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                🍲
              </div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                FoodTour Quận 4 • Trung Tâm Quản Trị CMS
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-md">
              Hệ thống quản lý điểm đến thông minh, phân tích lưu lượng du khách theo thời gian thực,
              tối ưu hóa lộ trình PostGIS và số hóa thực đơn ẩm thực qua AI OCR Gemini.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PostGIS Không Gian
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Redis Cache Layer
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                <span>✨</span>
                Gemini AI Flash
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Liên Kết Nhanh</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  href="/"
                  className="text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition"
                >
                  <span>🌐</span>
                  <span>Trang Du Khách</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/?tab=map"
                  className="text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition"
                >
                  <span>🗺️</span>
                  <span>Bản Đồ Quận 4</span>
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:8080/swagger-ui/index.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition"
                >
                  <span>📖</span>
                  <span>Tài Liệu Swagger API</span>
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition"
                >
                  <span>🔑</span>
                  <span>Đăng Nhập Khách Hàng</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Actions & System Stats */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Hành Động Quản Trị</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleScrollTop}
                className="w-full text-left px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-between cursor-pointer"
              >
                <span>Cuộn Lên Đầu Trang</span>
                <span>↑</span>
              </button>
              {onEvictCache && (
                <button
                  type="button"
                  onClick={onEvictCache}
                  className="w-full text-left px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center justify-between cursor-pointer border border-rose-200/80"
                >
                  <span>Xóa Nhanh Cache Redis</span>
                  <span>⚡</span>
                </button>
              )}
              <div className="text-[11px] text-slate-400 pt-1 space-y-0.5">
                <p>Tổng điểm quản lý: <strong className="text-slate-700">{poisCount}</strong> địa điểm</p>
                <p>Tổng hành trình: <strong className="text-slate-700">{toursCount}</strong> tour mẫu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 Smart Tourism Quận 4. Nền tảng Du Lịch & Ẩm Thực Phố Đêm Vĩnh Khánh.</p>
          <div className="flex items-center gap-3">
            <span>Phiên bản CMS v2.4.0</span>
            <span>•</span>
            <span>Next.js 16 + Spring Boot 3.5</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
