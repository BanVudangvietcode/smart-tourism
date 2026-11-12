'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserFavoritePoiResponse } from '@/types';
import { fetchMyFavorites, toggleFavorite } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPoi: (poi: { poiId: number; lat: number; lng: number; name: string }) => void;
  onOpenPoiDetail: (poiId: number) => void;
}

export default function FavoritesModal({
  isOpen,
  onClose,
  onSelectPoi,
  onOpenPoiDetail,
}: FavoritesModalProps) {
  const { tk, language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState<UserFavoritePoiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch favorites whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setLoading(true);

    fetchMyFavorites()
      .then((data) => {
        if (active) {
          setFavorites(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.warn('Không thể tải danh sách yêu thích:', err);
        if (active) {
          setFavorites([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  // Remove a POI from favorites
  const handleRemove = async (poiId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemovingId(poiId);
    try {
      await toggleFavorite(poiId, false);
      setFavorites((prev) => prev.filter((p) => p.poiId !== poiId));
      setToastMessage(tk('fav_removed'));
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Lỗi khi bỏ lưu quán:', err);
    } finally {
      setRemovingId(null);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[10000] animate-bounce">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-rose-50/70 via-white to-pink-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-xl shadow-sm shadow-rose-500/20">
              ❤️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  {tk('fav_title')}
                </h3>
                <span className="bg-rose-100 text-rose-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-rose-200">
                  {favorites.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {tk('fav_subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/40">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <span className="w-7 h-7 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải danh sách quán yêu thích...</span>
            </div>
          ) : favorites.length === 0 ? (
            <div className="py-12 sm:py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 text-rose-500 text-3xl flex items-center justify-center shadow-inner">
                💔
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {tk('fav_empty')}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {tk('fav_empty_desc')}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-sm transition cursor-pointer"
              >
                {tk('fav_explore_now')}
              </button>
            </div>
          ) : (
            favorites.map((item) => (
              <div
                key={item.poiId}
                onClick={() => onOpenPoiDetail(item.poiId)}
                className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group cursor-pointer"
              >
                {/* Left info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 shadow-2xs group-hover:scale-102 transition-transform"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-tr from-rose-100 to-amber-100 text-rose-600 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                      🍲
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/70">
                        {item.categoryName || 'Ẩm thực'}
                      </span>
                      {item.avgRating ? (
                        <span className="text-[11px] font-black text-amber-500 flex items-center gap-1">
                          ★ {item.avgRating.toFixed(1)}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({item.reviewCount || 0})
                          </span>
                        </span>
                      ) : null}
                    </div>

                    <h4 className="text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                      {item.name}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                      <span>📍</span>
                      <span>{item.address || 'Quận 4, TP. Hồ Chí Minh'}</span>
                    </p>

                    {item.favoritedAt && (
                      <p className="text-[10px] text-slate-400">
                        Đã lưu: {new Date(item.favoritedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPoi({
                        poiId: item.poiId,
                        lat: item.latitude,
                        lng: item.longitude,
                        name: item.name,
                      });
                      onClose();
                    }}
                    className="bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    title={tk('fav_btn_map')}
                  >
                    <span>🧭</span>
                    <span>{tk('fav_btn_map')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPoiDetail(item.poiId);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                    title={tk('fav_btn_view')}
                  >
                    <span>{tk('fav_btn_view')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleRemove(item.poiId, e)}
                    disabled={removingId === item.poiId}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                    title="Bỏ lưu quán này"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
