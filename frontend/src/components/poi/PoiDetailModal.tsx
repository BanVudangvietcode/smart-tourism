'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  PoiDetail,
  PoiMenuResponse,
  ReviewPageResponse,
  CheckinResult,
  Badge,
} from '@/types';
import {
  fetchPoiDetail,
  fetchPoiMenu,
  fetchPoiReviews,
  checkinPoi,
  toggleFavorite,
  getAudioStreamUrl,
  trackAudioListen,
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

import PoiInfoTab from './tabs/PoiInfoTab';
import PoiMenuTab from './tabs/PoiMenuTab';
import PoiReviewsTab from './tabs/PoiReviewsTab';
import PoiAiTab from './tabs/PoiAiTab';
import PoiBadgeModal from './PoiBadgeModal';

interface PoiDetailModalProps {
  poiId: number | string | null;
  initialTab?: 'info' | 'menu' | 'reviews' | 'ai';
  onClose: () => void;
  onNavigate?: (poi: { lat: number; lng: number; name: string }) => void;
}

export default function PoiDetailModal({
  poiId,
  initialTab = 'info',
  onClose,
  onNavigate,
}: PoiDetailModalProps) {
  const { user, deviceId } = useAuth();
  const { language, tk } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'menu' | 'reviews' | 'ai'>(initialTab);

  // Data states
  const [detail, setDetail] = useState<PoiDetail | null>(null);
  const [menu, setMenu] = useState<PoiMenuResponse | null>(null);
  const [reviewsData, setReviewsData] = useState<ReviewPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  // Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check-in State
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [showBadgesModal, setShowBadgesModal] = useState<Badge[] | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, poiId]);

  useEffect(() => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [poiId, language]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch POI details, menu, reviews
  useEffect(() => {
    if (!poiId) return;
    setLoading(true);
    setCheckinResult(null);
    setCheckinError(null);

    Promise.all([
      fetchPoiDetail(Number(poiId)),
      fetchPoiMenu(Number(poiId)).catch(() => null),
      fetchPoiReviews(Number(poiId)).catch(() => null),
    ])
      .then(([detailData, menuData, reviewsRes]) => {
        setDetail(detailData);
        setMenu(menuData);
        setReviewsData(reviewsRes);
        setIsFav(Boolean((detailData as any)?.isFavorite));
      })
      .catch((err) => {
        console.error('Failed to load POI details:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [poiId]);

  // Toggle favorite
  const handleToggleFav = async () => {
    if (!poiId) return;
    try {
      const res = await toggleFavorite(Number(poiId), !isFav);
      setIsFav(res.isFavorite);
    } catch {
      setIsFav(!isFav);
    }
  };

  // Audio guide controls
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
      if (poiId) {
        trackAudioListen({
          deviceId: deviceId || 'anonymous',
          poiId: Number(poiId),
          durationSeconds: Math.floor(audioDuration || 30),
          completed: false,
          triggerType: 'MANUAL',
        });
      }
    }
  };

  // Geolocation & Check-in
  const executeCheckin = async (lat: number, lng: number) => {
    if (!poiId) return;
    setCheckingIn(true);
    setCheckinError(null);
    setCheckinResult(null);

    try {
      const res = await checkinPoi(Number(poiId), lat, lng);
      setCheckinResult(res);

      if (res.newlyUnlockedBadges && res.newlyUnlockedBadges.length > 0) {
        setShowBadgesModal(res.newlyUnlockedBadges);
      }
    } catch (err: any) {
      setCheckinError(err.message || 'Lỗi check-in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckin = () => {
    if (!navigator.geolocation) {
      setCheckinError('Thiết bị của bạn không hỗ trợ định vị GPS');
      return;
    }

    setCheckingIn(true);
    setCheckinError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        executeCheckin(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        if (detail) {
          executeCheckin(detail.latitude, detail.longitude);
        } else {
          setCheckinError('Không thể lấy tọa độ GPS. Vui lòng bật định vị.');
          setCheckingIn(false);
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  if (!poiId || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={poiId ? getAudioStreamUrl(poiId, language) : undefined}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime);
            setAudioDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={() => {
          setIsPlayingAudio(false);
          setAudioProgress(0);
        }}
      />

      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition cursor-pointer backdrop-blur-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── 1. HEADER IMAGE & QUICK DETAILS ──────────────────────── */}
        <div className="relative h-48 sm:h-60 w-full shrink-0 bg-slate-900 overflow-hidden">
          {detail?.thumbnailUrl ? (
            <img
              src={detail.thumbnailUrl}
              alt={detail.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white/50 text-4xl">
              📍
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Badge & Tên */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {detail?.categoryName || 'Địa điểm'}
              </span>
              {detail?.avgRating ? (
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  ★ {detail.avgRating.toFixed(1)}
                  <span className="text-[10px] font-medium text-slate-800">({detail.reviewCount})</span>
                </span>
              ) : null}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {detail?.name || 'Đang tải...'}
            </h2>
            <p className="text-xs text-slate-300 truncate mt-0.5">
              📍 {detail?.address || 'Quận 4, TP. Hồ Chí Minh'}
            </p>
          </div>
        </div>

        {/* ── 2. QUICK ACTIONS BAR ──────────────────────────────────── */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          {/* Nút Chỉ đường */}
          <button
            type="button"
            onClick={() => {
              if (detail && onNavigate) {
                onNavigate({ lat: detail.latitude, lng: detail.longitude, name: detail.name });
                onClose();
              }
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span>{tk('poi_btn_navigate')}</span>
          </button>

          {/* Nút Audio Thuyết minh */}
          <button
            type="button"
            onClick={togglePlayAudio}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition shrink-0 cursor-pointer ${
              isPlayingAudio
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                <span>{tk('poi_btn_pause')}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <span>{tk('poi_btn_audio')}</span>
              </>
            )}
          </button>

          {/* Nút Check-in GPS 30m */}
          <button
            type="button"
            onClick={handleCheckin}
            disabled={checkingIn}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <span>🎯</span>
            <span>{checkingIn ? tk('poi_btn_checkin_loading') : tk('poi_btn_checkin')}</span>
          </button>

          {/* Nút Lưu yêu thích */}
          <button
            type="button"
            onClick={handleToggleFav}
            className={`p-2 rounded-xl border transition shrink-0 cursor-pointer ${
              isFav ? 'bg-rose-50 border-rose-300 text-rose-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
            title={tk('poi_btn_save')}
          >
            <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Thanh audio timeline */}
        {isPlayingAudio && audioDuration > 0 && (
          <div className="bg-emerald-50 px-4 py-1.5 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900">
            <span className="font-semibold">{tk('poi_audio_playing')}</span>
            <span>{Math.floor(audioProgress)}s / {Math.floor(audioDuration)}s</span>
          </div>
        )}

        {/* Thông báo Check-in */}
        {checkinResult && (
          <div className="bg-emerald-100 border-b border-emerald-300 text-emerald-900 px-4 py-2 text-xs flex items-center justify-between animate-fadeIn">
            <span>🎉 {checkinResult.message}</span>
            <button type="button" onClick={() => setCheckinResult(null)} className="font-bold text-emerald-700 ml-2 cursor-pointer">✕</button>
          </div>
        )}
        {checkinError && (
          <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-xs flex items-center justify-between">
            <span>⚠️ {checkinError}</span>
            <button type="button" onClick={() => setCheckinError(null)} className="font-bold text-amber-700 ml-2 cursor-pointer">✕</button>
          </div>
        )}

        {/* ── 3. TABS BAR ───────────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
              activeTab === 'info' ? 'border-blue-600 text-blue-600 bg-blue-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tk('poi_tab_info')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
              activeTab === 'menu' ? 'border-blue-600 text-blue-600 bg-blue-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tk('poi_tab_menu')} {menu ? `(${menu.categories?.reduce((acc, c) => acc + c.dishes.length, 0) || 0})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
              activeTab === 'reviews' ? 'border-blue-600 text-blue-600 bg-blue-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tk('poi_tab_reviews')} {reviewsData ? `(${reviewsData.totalCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'ai' ? 'border-purple-600 text-purple-600 bg-purple-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>✨</span>
            <span>{tk('poi_tab_ai')}</span>
          </button>
        </div>

        {/* ── 4. TAB CONTENTS ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/50">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>{tk('poi_syncing')}</span>
            </div>
          ) : (
            <>
              {activeTab === 'info' && detail && <PoiInfoTab detail={detail} />}
              {activeTab === 'menu' && menu && <PoiMenuTab menu={menu} />}
              {activeTab === 'reviews' && (
                <PoiReviewsTab
                  poiId={poiId}
                  reviewsData={reviewsData}
                  setReviewsData={setReviewsData}
                />
              )}
              {activeTab === 'ai' && (
                <PoiAiTab poiId={poiId} poiName={detail?.name} />
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL HUY HIỆU KHI CHECK-IN */}
      {showBadgesModal && (
        <PoiBadgeModal
          badges={showBadgesModal}
          onClose={() => setShowBadgesModal(null)}
        />
      )}
    </div>,
    document.body
  );
}
