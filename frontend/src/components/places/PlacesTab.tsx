'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Category, PoiSummary } from '@/types';
import { fetchCategories, fetchPois } from '@/services/api';
import PoiDetailModal from '@/components/poi/PoiDetailModal';

interface PlacesTabProps {
  onOpenMap: (poiId?: string | number) => void;
}

export default function PlacesTab({ onOpenMap }: PlacesTabProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<PoiSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [cats, pois] = await Promise.all([
          fetchCategories().catch(() => []),
          fetchPois().catch(() => []),
        ]);
        if (isMounted) {
          setCategories(cats);
          setPlaces(pois);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách địa điểm:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategoryId === 'all' ||
        categories.find((c) => c.id === selectedCategoryId)?.name === p.categoryName;
      return matchSearch && matchCategory;
    });
  }, [places, search, selectedCategoryId, categories]);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 pb-28 lg:pb-12 pt-16">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">
                Cơ sở dữ liệu PostGIS Quận 4
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Địa Điểm Du Lịch & Di Tích Lịch Sử
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                Khám phá {places.length} di tích lịch sử, bảo tàng, chùa chiền và các điểm check-in ven sông Bến Nghé.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Tìm tên địa điểm, di tích, đường..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                suppressHydrationWarning
                autoComplete="off"
                spellCheck={false}
                data-gramm="false"
                data-enable-grammarly="false"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition"
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-6 no-scrollbar">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategoryId === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              Tất cả ({places.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Places Grid ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Đang tải danh sách địa điểm từ Backend...</span>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-3xl mb-2">🔍</p>
            <h3 className="text-sm font-bold text-slate-800">Không tìm thấy địa điểm nào</h3>
            <p className="text-xs text-slate-500 mt-1">Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaces.map((poi) => (
              <div
                key={poi.id}
                onClick={() => setSelectedPoiId(poi.id)}
                className="group bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Photo */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  {poi.thumbnailUrl ? (
                    <img
                      src={poi.thumbnailUrl}
                      alt={poi.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-tr from-blue-50 to-indigo-100 text-blue-400">
                      🏛️
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {poi.categoryName}
                    </span>
                  </div>

                  {poi.avgRating > 0 && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <span className="text-amber-500">★</span>
                      <span>{poi.avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-1">
                      {poi.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1">
                      <span className="shrink-0 text-slate-400">📍</span>
                      <span className="line-clamp-1">{poi.address}</span>
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-blue-600">
                      {poi.priceRangeMin ? `${poi.priceRangeMin.toLocaleString()}đ` : 'Miễn phí vé vào'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMap(poi.id);
                      }}
                      className="text-xs font-bold text-slate-700 group-hover:text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Xem bản đồ</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POI DETAIL MODAL */}
      {selectedPoiId && (
        <PoiDetailModal
          poiId={selectedPoiId}
          onClose={() => setSelectedPoiId(null)}
          onNavigate={(p) => onOpenMap(selectedPoiId)}
        />
      )}
    </div>
  );
}
