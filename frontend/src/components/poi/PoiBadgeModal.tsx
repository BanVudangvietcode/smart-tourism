'use client';

import React from 'react';
import { Badge } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface PoiBadgeModalProps {
  badges: Badge[];
  onClose: () => void;
}

export default function PoiBadgeModal({ badges, onClose }: PoiBadgeModalProps) {
  const { tk } = useLanguage();

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
        <div className="text-5xl animate-bounce">🏆</div>
        <h3 className="text-lg font-black text-slate-900">{tk('poi_badge_title')}</h3>
        <p className="text-xs text-slate-600">{tk('poi_badge_subtitle')}</p>

        <div className="space-y-3">
          {badges.map((b) => (
            <div key={b.badgeCode} className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-xs shrink-0 flex items-center justify-center">
                <img src={b.iconUrl} alt={b.badgeName} className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-900">{b.badgeName}</h4>
                <p className="text-[11px] text-amber-800 leading-tight">{b.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-2xl transition cursor-pointer"
        >
          {tk('poi_badge_continue')}
        </button>
      </div>
    </div>
  );
}
