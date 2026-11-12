'use client';

import React from 'react';
import { PoiMenuResponse } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface PoiMenuTabProps {
  menu: PoiMenuResponse;
}

export default function PoiMenuTab({ menu }: PoiMenuTabProps) {
  const { language, tk } = useLanguage();

  return (
    <div className="space-y-6">
      {menu.categories.map((cat) => (
        <div key={cat.categoryId} className="space-y-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            {cat.categoryName} ({cat.dishes.length})
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {cat.dishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3 hover:border-slate-300 transition"
              >
                {dish.thumbnailUrl ? (
                  <img
                    src={dish.thumbnailUrl}
                    alt={dish.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-2xl shrink-0">
                    🍲
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">
                      {dish.name}
                    </h4>
                    <span className="text-xs font-black text-blue-600 shrink-0">
                      {dish.price.toLocaleString()}đ
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {dish.description ||
                      (language === 'en' ? 'Renowned signature dish.' : 'Món đặc sản trứ danh.')}
                  </p>

                  {/* Badges: Signature & Allergens */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {dish.isSignature && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        ★ Best Seller
                      </span>
                    )}
                    {dish.hasPeanuts && (
                      <span className="bg-rose-50 text-rose-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border border-rose-200">
                        {tk('poi_dish_peanut')}
                      </span>
                    )}
                    {dish.hasSeafood && (
                      <span className="bg-cyan-50 text-cyan-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border border-cyan-200">
                        {tk('poi_dish_seafood')}
                      </span>
                    )}
                    {dish.hasGluten && (
                      <span className="bg-purple-50 text-purple-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border border-purple-200">
                        {tk('poi_dish_gluten')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
