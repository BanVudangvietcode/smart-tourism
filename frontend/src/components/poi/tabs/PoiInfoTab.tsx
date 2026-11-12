'use client';

import React from 'react';
import { PoiDetail } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface PoiInfoTabProps {
  detail: PoiDetail;
}

export default function PoiInfoTab({ detail }: PoiInfoTabProps) {
  const { language, tk } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Mô tả */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {tk('poi_section_intro')}
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          {detail.description?.replace(/<!--pin:.*?-->/g, '').trim() ||
            (language === 'en'
              ? 'No detailed description available for this place yet.'
              : 'Chưa có mô tả chi tiết cho địa điểm này.')}
        </p>
      </div>

      {/* Chi tiết hoạt động */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
            ⏰
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{tk('poi_opening_hours')}</p>
            <p className="text-xs font-extrabold text-slate-800">{detail.openingHours || tk('poi_opening_tbd')}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
            💵
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{tk('poi_price')}</p>
            <p className="text-xs font-extrabold text-slate-800">
              {detail.priceRangeMin ? `${detail.priceRangeMin.toLocaleString()}đ` : tk('home_poi_free')}
              {detail.priceRangeMax ? ` - ${detail.priceRangeMax.toLocaleString()}đ` : ''}
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
            📞
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{tk('poi_phone')}</p>
            <p className="text-xs font-extrabold text-slate-800">{detail.phone || '0903 123 456'}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
            📍
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{tk('poi_coords')}</p>
            <p className="text-xs font-mono font-bold text-slate-700">
              {detail.latitude.toFixed(4)}, {detail.longitude.toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
