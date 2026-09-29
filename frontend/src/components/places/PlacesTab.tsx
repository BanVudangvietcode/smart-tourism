'use client';

import React, { useState, useMemo } from 'react';
import { POI_LIST } from '@/lib/map-data';
import { MapPOI } from '@/types';

interface PlacesTabProps {
  onOpenMap: (poiId?: string) => void;
}

// Hình ảnh thực tế chất lượng cao cho từng điểm đến
const POI_IMAGES: Record<string, string> = {
  'ben-nha-rong': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
  'vinh-khanh': 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
  'cho-200': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
  'xom-chieu': 'https://images.unsplash.com/photo-1548625361-16a75f10b2bb?auto=format&fit=crop&w=800&q=80',
  'cau-mong': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
  'ben-van-don': 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=800&q=80',
};

export default function PlacesTab({ onOpenMap }: PlacesTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set(POI_LIST.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, []);

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
    <div className="w-full h-full overflow-y-auto bg-slate-50 pb-28 lg:pb-12 pt-16">
      {/* ─── Clean Header ────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Khám phá Quận 4
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Địa Điểm Du Lịch & Di Tích
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                Tổng hợp các di tích lịch sử, công trình kiến trúc tôn giáo và địa điểm check-in ven sông nổi bật.
              </p>
            </div>

            {/* Clean Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Tìm tên địa điểm, di tích..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Clean Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pt-6 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Places Grid ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-semibold text-slate-500">
            {filteredPlaces.length} điểm đến được hiển thị
          </span>
        </div>

        {filteredPlaces.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <p className="text-sm font-semibold text-slate-800">Không tìm thấy địa điểm nào</p>
            <p className="text-xs text-slate-500 mt-1">Vui lòng thử lại với từ khóa khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaces.map((poi: MapPOI) => (
              <div
                key={poi.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Container */}
                  <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={POI_IMAGES[poi.id] || 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80'}
                      alt={poi.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Category Tag */}
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-xs">
                      {poi.category}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition">
                      {poi.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {poi.desc}
                    </p>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-5 pt-0">
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onOpenMap(poi.id)}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-800 bg-white hover:bg-slate-900 text-slate-800 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Xem trên bản đồ</span>
                    </button>

                    <button
                      onClick={() => onOpenMap(poi.id)}
                      className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center justify-center cursor-pointer shadow-2xs"
                      title="Chỉ đường tới đây"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
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
