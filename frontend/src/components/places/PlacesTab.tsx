'use client';

import React, { useState, useMemo } from 'react';
import { POI_LIST } from '@/lib/map-data';
import { MapPOI } from '@/types';

interface PlacesTabProps {
  onOpenMap: (poiId?: string) => void;
}

export default function PlacesTab({ onOpenMap }: PlacesTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Lấy danh sách thể loại duy nhất
  const categories = useMemo(() => {
    const set = new Set(POI_LIST.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Lọc danh sách điểm đến
  const filteredPlaces = useMemo(() => {
    return POI_LIST.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.desc.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [search, selectedCategory]);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F8FAFC] pb-28 lg:pb-12 pt-16">
      {/* ─── Header & Search ────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-6 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-2">
                <span>📍</span> Điểm đến Quận 4
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Danh sách Địa điểm du lịch
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Khám phá các di tích lịch sử, cảnh quan ven sông và điểm đến nổi tiếng
              </p>
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Tìm tên địa điểm, di tích..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Thanh phân loại (Category Pills) */}
          <div className="flex items-center gap-2 overflow-x-auto pt-5 pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                }`}
              >
                {cat === 'all' ? '✨ Tất cả' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Grid danh sách địa điểm ───────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Hiển thị {filteredPlaces.length} địa điểm
          </p>
        </div>

        {filteredPlaces.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <span className="text-4xl">🔍</span>
            <p className="font-bold text-gray-700 mt-3 text-base">Không tìm thấy địa điểm nào</p>
            <p className="text-xs text-gray-400 mt-1">Hãy thử tìm kiếm với từ khóa khác xem sao nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPlaces.map((poi: MapPOI) => (
              <div
                key={poi.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-200 overflow-hidden flex flex-col justify-between group"
              >
                {/* Phần trên card */}
                <div>
                  {/* Header màu sắc theo danh mục */}
                  <div
                    className="h-28 relative flex items-center justify-center p-4 transition"
                    style={{
                      background: `linear-gradient(135deg, ${poi.color}25 0%, ${poi.color}10 100%)`,
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md border-2 border-white group-hover:scale-110 transition"
                      style={{ backgroundColor: poi.color }}
                    >
                      {poi.emoji}
                    </div>

                    <span className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm border border-gray-100">
                      {poi.category}
                    </span>
                  </div>

                  {/* Nội dung chi tiết */}
                  <div className="p-5">
                    <h3 className="font-extrabold text-gray-900 text-base leading-snug group-hover:text-blue-600 transition">
                      {poi.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                      {poi.desc}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 pb-5 pt-0">
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => onOpenMap(poi.id)}
                      className="flex-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Xem trên bản đồ</span>
                    </button>

                    <button
                      onClick={() => onOpenMap(poi.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-blue-500/25 cursor-pointer"
                      title="Chỉ đường đến đây"
                    >
                      <span>🚀</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
