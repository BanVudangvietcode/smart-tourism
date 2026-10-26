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
  postReview,
  checkinPoi,
  toggleFavorite,
  getAudioStreamUrl,
  trackAudioListen,
  askAi,
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import FormattedAiText from '@/components/common/FormattedAiText';

interface PoiDetailModalProps {
  poiId: number | string | null;
  initialTab?: 'info' | 'menu' | 'reviews' | 'ai';
  onClose: () => void;
  onNavigate?: (poi: { lat: number; lng: number; name: string }) => void;
}

export default function PoiDetailModal({ poiId, initialTab = 'info', onClose, onNavigate }: PoiDetailModalProps) {
  const { user, deviceId } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'menu' | 'reviews' | 'ai'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, poiId]);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Review Form State
  const [userRating, setUserRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [reviewIsPublic, setReviewIsPublic] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // AI Ask State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiFollowUps, setAiFollowUps] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    if (!poiId) return;

    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const pDetail = await fetchPoiDetail(poiId);
        if (isMounted) setDetail(pDetail);

        // Tải thực đơn nếu là điểm ăn uống
        if (pDetail.poiType === 'FOOD' || pDetail.categoryName?.includes('Ốc') || pDetail.categoryName?.includes('Ẩm thực')) {
          try {
            const pMenu = await fetchPoiMenu(poiId);
            if (isMounted) setMenu(pMenu);
          } catch {
            // Không có menu
          }
        }

        // Tải reviews
        try {
          const revs = await fetchPoiReviews(poiId);
          if (isMounted) setReviewsData(revs);
        } catch {
          // reviews rỗng
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết POI:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [poiId]);

  if (!poiId) return null;

  // Toggle Favorite
  const handleToggleFav = async () => {
    try {
      const nextState = !isFav;
      setIsFav(nextState);
      await toggleFavorite(poiId, nextState);
    } catch {
      setIsFav(!isFav);
    }
  };

  // Audio Play / Pause
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
      // Ghi nhận telemetry lượt nghe
      if (detail) {
        trackAudioListen({
          deviceId: deviceId || 'web-guest',
          poiId: Number(poiId),
          durationSeconds: 15,
          completed: false,
          triggerType: 'MANUAL',
        });
      }
    }
  };

  // Check-in GPS 30m
  const handleCheckin = () => {
    setCheckingIn(true);
    setCheckinError(null);

    // Ưu tiên vị trí giả lập nếu đang thử nghiệm
    const savedSim = typeof window !== 'undefined' ? sessionStorage.getItem('sw_sim_pos') : null;
    if (savedSim) {
      try {
        const parsed = JSON.parse(savedSim);
        if (parsed.lat && parsed.lng) {
          executeCheckin(parsed.lat, parsed.lng);
          return;
        }
      } catch {
        // ignore
      }
    }

    if (!navigator.geolocation) {
      // Dùng tọa độ thực của địa điểm làm vị trí giả lập nếu máy không có GPS
      executeCheckin(detail?.latitude || 10.7612, detail?.longitude || 106.7025);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        executeCheckin(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // Fallback: Nếu từ chối GPS thì dùng tọa độ xấp xỉ gần quán để trải nghiệm tính năng
        executeCheckin(detail?.latitude || 10.7612, detail?.longitude || 106.7025);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const executeCheckin = async (lat: number, lng: number) => {
    try {
      const res = await checkinPoi(poiId, lat, lng);
      setCheckinResult(res);
      if (res.newlyUnlockedBadges && res.newlyUnlockedBadges.length > 0) {
        setShowBadgesModal(res.newlyUnlockedBadges);
      }
    } catch (err: any) {
      setCheckinError(err.message || 'Lỗi kiểm tra vị trí check-in');
    } finally {
      setCheckingIn(false);
    }
  };

  // Gửi đánh giá
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingReview(true);
    try {
      await postReview(poiId, {
        rating: userRating,
        comment: commentText.trim(),
        isAnonymous: !reviewIsPublic,
      });
      setReviewSuccess(true);
      setCommentText('');
      // Reload reviews
      const updated = await fetchPoiReviews(poiId);
      setReviewsData(updated);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Hỏi AI
  const handleAskAi = async (q?: string) => {
    const question = q || aiQuestion;
    if (!question.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await askAi({
        poiId: Number(poiId),
        question: question.trim(),
        userLat: detail?.latitude,
        userLng: detail?.longitude,
      });
      setAiAnswer(res.answer);
      setAiFollowUps(res.suggestedFollowUps || []);
      setAiQuestion('');
    } catch (err: any) {
      setAiAnswer(err.message || 'AI đang bận, bạn vui lòng hỏi lại câu khác.');
    } finally {
      setAiLoading(false);
    }
  };

  if (!poiId || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Audio Element ngầm */}
      <audio
        ref={audioRef}
        src={getAudioStreamUrl(poiId)}
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
            <span>Chỉ đường</span>
          </button>

          {/* Nút Audio Thuyết minh */}
          <button
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
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <span>Nghe Audio Thuyết minh</span>
              </>
            )}
          </button>

          {/* Nút Check-in GPS 30m */}
          <button
            onClick={handleCheckin}
            disabled={checkingIn}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <span>🎯</span>
            <span>{checkingIn ? 'Đang đo GPS...' : 'Check-in 30m'}</span>
          </button>

          {/* Nút Lưu yêu thích */}
          <button
            onClick={handleToggleFav}
            className={`p-2 rounded-xl border transition shrink-0 cursor-pointer ${
              isFav ? 'bg-rose-50 border-rose-300 text-rose-600' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
            title="Lưu vào danh sách"
          >
            <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Thanh audio timeline nếu đang bật */}
        {isPlayingAudio && audioDuration > 0 && (
          <div className="bg-emerald-50 px-4 py-1.5 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900">
            <span className="font-semibold">🎧 Đang phát thuyết minh tự động</span>
            <span>{Math.floor(audioProgress)}s / {Math.floor(audioDuration)}s</span>
          </div>
        )}

        {/* Thông báo Check-in thành công */}
        {checkinResult && (
          <div className="bg-emerald-100 border-b border-emerald-300 text-emerald-900 px-4 py-2 text-xs flex items-center justify-between animate-fadeIn">
            <span>🎉 {checkinResult.message}</span>
            <button onClick={() => setCheckinResult(null)} className="font-bold text-emerald-700 ml-2">✕</button>
          </div>
        )}
        {checkinError && (
          <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-xs flex items-center justify-between">
            <span>⚠️ {checkinError}</span>
            <button onClick={() => setCheckinError(null)} className="font-bold text-amber-700 ml-2">✕</button>
          </div>
        )}

        {/* ── 3. TABS BAR ───────────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
              activeTab === 'info' ? 'border-blue-600 text-blue-600 bg-blue-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Thông tin
          </button>
          {menu && menu.categories && menu.categories.length > 0 && (
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                activeTab === 'menu' ? 'border-blue-600 text-blue-600 bg-blue-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Thực đơn ({menu.totalDishes})
            </button>
          )}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
              activeTab === 'reviews' ? 'border-blue-600 text-blue-600 bg-blue-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đánh giá {reviewsData ? `(${reviewsData.totalCount})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
              activeTab === 'ai' ? 'border-purple-600 text-purple-600 bg-purple-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ✨ Hỏi AI
          </button>
        </div>

        {/* ── 4. TAB CONTENTS (SCROLLABLE) ─────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Đang đồng bộ dữ liệu...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: THÔNG TIN TỔNG QUAN */}
              {activeTab === 'info' && detail && (
                <div className="space-y-4">
                  {/* Mô tả */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Giới thiệu</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {detail.description?.replace(/<!--pin:.*?-->/g, '').trim() || 'Chưa có mô tả chi tiết cho địa điểm này.'}
                    </p>
                  </div>

                  {/* Chi tiết hoạt động */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                        ⏰
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Giờ mở cửa</p>
                        <p className="text-xs font-extrabold text-slate-800">{detail.openingHours || 'Đang cập nhật'}</p>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                        💵
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Mức giá</p>
                        <p className="text-xs font-extrabold text-slate-800">
                          {detail.priceRangeMin ? `${detail.priceRangeMin.toLocaleString()}đ` : 'Miễn phí'}
                          {detail.priceRangeMax ? ` - ${detail.priceRangeMax.toLocaleString()}đ` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                        📞
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Điện thoại</p>
                        <p className="text-xs font-extrabold text-slate-800">{detail.phone || '0903 123 456'}</p>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                        📍
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Tọa độ PostGIS</p>
                        <p className="text-xs font-mono font-bold text-slate-700">
                          {detail.latitude.toFixed(4)}, {detail.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: THỰC ĐƠN & MÓN ĂN */}
              {activeTab === 'menu' && menu && (
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
                                {dish.description || 'Món đặc sản trứ danh.'}
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
                                    ⚠️ Có đậu phộng
                                  </span>
                                )}
                                {dish.hasSeafood && (
                                  <span className="bg-cyan-50 text-cyan-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border border-cyan-200">
                                    🦐 Có hải sản
                                  </span>
                                )}
                                {dish.hasGluten && (
                                  <span className="bg-purple-50 text-purple-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border border-purple-200">
                                    🌾 Chứa gluten
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
              )}

              {/* TAB 3: ĐÁNH GIÁ CỘNG ĐỒNG */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Form viết đánh giá */}
                  <form onSubmit={handleSubmitReview} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">Để lại cảm nhận của bạn</h4>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className={`text-xl transition cursor-pointer ${star <= userRating ? 'text-amber-400' : 'text-slate-200'}`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-2">{userRating} sao</span>
                    </div>

                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm ẩm thực, hương vị, phong cách phục vụ tại quán..."
                      rows={2}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-slate-50"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500">Chế độ:</span>
                        <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setReviewIsPublic(true)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              reviewIsPublic ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            🌐 Công khai
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewIsPublic(false)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              !reviewIsPublic ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            🔒 Riêng tư / Ẩn danh
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5">
                        <span className="text-[10px] text-slate-400">
                          Đăng dưới tên: <b className="text-slate-600">{reviewIsPublic ? (user?.displayName || 'Du khách ẩm thực') : 'Du khách ẩn danh'}</b>
                        </span>
                        <button
                          type="submit"
                          disabled={submittingReview || !commentText.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                        >
                          {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                      </div>
                    </div>

                    {reviewSuccess && (
                      <p className="text-[11px] text-emerald-600 font-bold">✓ Cảm ơn bạn! Đánh giá đã được ghi nhận.</p>
                    )}
                  </form>

                  {/* Danh sách đánh giá */}
                  <div className="space-y-3">
                    {reviewsData && reviewsData.items.length > 0 ? (
                      reviewsData.items.map((rev) => (
                        <div key={rev.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                                {rev.userDisplayName ? rev.userDisplayName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{rev.userDisplayName || 'Du khách'}</p>
                                <p className="text-[10px] text-slate-400">
                                  {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            </div>
                            <div className="flex text-amber-400 text-xs">
                              {'★'.repeat(rev.rating)}
                            </div>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: HỎI TRỢ LÝ AI */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">✨</span>
                      <h4 className="text-xs font-black uppercase tracking-wider">Trợ lý AI Gemini 1.5 Flash</h4>
                    </div>
                    <p className="text-xs text-purple-100">
                      Hỏi bất cứ điều gì về lịch sử, nguồn gốc nguyên liệu, các món ăn đặc sắc nhất của quán {detail?.name}.
                    </p>
                  </div>

                  {/* Input câu hỏi */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="Ví dụ: Quán có món ốc nào cay nhất?"
                      onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                      className="flex-1 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 bg-white"
                    />
                    <button
                      onClick={() => handleAskAi()}
                      disabled={aiLoading || !aiQuestion.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {aiLoading ? 'Đang nghĩ...' : 'Hỏi AI'}
                    </button>
                  </div>

                  {/* Gợi ý câu hỏi nhanh */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Món nào là Best-seller?',
                      'Đi 2 người nên gọi gì?',
                      'Quán có món gì cho người không ăn cay?',
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleAskAi(chip)}
                        className="text-[11px] bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-full transition cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Câu trả lời AI */}
                  {aiAnswer && (
                    <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                        <span>🤖 Câu trả lời từ AI:</span>
                      </div>
                      <FormattedAiText content={aiAnswer} />

                      {aiFollowUps.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Câu hỏi tiếp theo:</p>
                          <div className="flex flex-wrap gap-1">
                            {aiFollowUps.map((fu, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAskAi(fu)}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition"
                              >
                                {fu}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL HUY HIỆU KHI CHECK-IN */}
      {showBadgesModal && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="text-5xl animate-bounce">🏆</div>
            <h3 className="text-lg font-black text-slate-900">Chúc Mừng Bạn!</h3>
            <p className="text-xs text-slate-600">Bạn vừa mở khóa được huy hiệu du lịch mới tại Quận 4:</p>

            <div className="space-y-3">
              {showBadgesModal.map((b) => (
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
              onClick={() => setShowBadgesModal(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-2xl transition cursor-pointer"
            >
              Tiếp tục hành trình
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

