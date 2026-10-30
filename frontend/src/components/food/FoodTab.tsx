'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PoiSummary } from '@/types';
import { fetchPois } from '@/services/api';
import PoiDetailModal from '@/components/poi/PoiDetailModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface FoodTabProps {
  onOpenMap: (poiId?: string | number) => void;
}

export default function FoodTab({ onOpenMap }: FoodTabProps) {
  const { tk } = useLanguage();
  const [foods, setFoods] = useState<PoiSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadFoods = async () => {
      setLoading(true);
      try {
        const allPois = await fetchPois();
        // Lọc các quán ẩm thực, ốc, ăn vặt
        const foodPois = allPois.filter(
          (p) =>
            p.poiType === 'FOOD' ||
            p.categoryName?.includes('Ốc') ||
            p.categoryName?.includes('Ẩm thực') ||
            p.categoryName?.includes('Phá lấu') ||
            p.categoryName?.includes('Ăn vặt')
        );
        if (isMounted) setFoods(foodPois.length > 0 ? foodPois : allPois);
      } catch (err) {
        console.error('Lỗi khi tải quán ăn:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadFoods();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(foods.map((f) => f.categoryName).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [foods]);

  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.address.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterType === 'all' || f.categoryName === filterType;
      return matchSearch && matchCategory;
    });
  }, [foods, search, filterType]);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 pb-28 lg:pb-12 pt-16">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1.5">
                {tk('food_badge')}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {tk('food_title')}
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                {tk('food_subtitle')}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder={tk('food_search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                suppressHydrationWarning
                autoComplete="off"
                spellCheck={false}
                data-gramm="false"
                data-enable-grammarly="false"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition"
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

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pt-6 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  filterType === cat
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? tk('food_all') : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Food Grid ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">{tk('food_loading')}</span>
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-3xl mb-2">🍜</p>
            <h3 className="text-sm font-bold text-slate-800">{tk('food_not_found')}</h3>
            <p className="text-xs text-slate-500 mt-1">{tk('food_not_found_hint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFoods.map((poi) => (
              <div
                key={poi.id}
                onClick={() => setSelectedPoiId(poi.id)}
                className="group bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-orange-200 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
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
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-orange-50 text-orange-400">
                      🍲
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span className="bg-orange-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {poi.categoryName}
                    </span>
                  </div>

                  {poi.avgRating > 0 && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <span className="text-amber-500">★</span>
                      <span>{poi.avgRating.toFixed(1)}</span>
                      <span className="text-[10px] font-normal text-slate-500">({poi.reviewCount})</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-orange-600 transition leading-snug line-clamp-1">
                      {poi.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1">
                      <span className="shrink-0 text-slate-400">📍</span>
                      <span className="line-clamp-1">{poi.address}</span>
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{tk('food_price_label')}</p>
                      <p className="text-xs font-black text-orange-600">
                        {poi.priceRangeMin ? `${poi.priceRangeMin.toLocaleString()}đ` : tk('food_budget_default')}
                        {poi.priceRangeMax ? ` - ${poi.priceRangeMax.toLocaleString()}đ` : ''}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPoiId(poi.id);
                      }}
                      className="bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      {tk('food_view_menu')}
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
          onNavigate={() => onOpenMap(selectedPoiId)}
        />
      )}
    </div>
  );
}
