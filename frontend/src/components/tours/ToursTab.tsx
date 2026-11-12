'use client';

import React, { useState, useEffect } from 'react';
import { TourSummary, TourDetail, TourReviewListResponse } from '@/types';
import { fetchTours, fetchTourDetail, fetchTourReviews, postTourReview } from '@/services/api';
import CustomTourModal from '@/components/tours/CustomTourModal';
import UserManualTourModal from '@/components/tours/UserManualTourModal';
import PoiDetailModal from '@/components/poi/PoiDetailModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface ToursTabProps {
  onOpenMap: (poiId?: string | number, tour?: TourDetail) => void;
}

export default function ToursTab({ onOpenMap }: ToursTabProps) {
  const { language, tk } = useLanguage();
  const [tours, setTours] = useState<TourSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTourDetail, setActiveTourDetail] = useState<TourDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [selectedPoiInitialTab, setSelectedPoiInitialTab] = useState<'info' | 'reviews'>('info');

  // Tour detail tabs & reviews
  const [tourDetailTab, setTourDetailTab] = useState<'stops' | 'reviews'>('stops');
  const [tourReviews, setTourReviews] = useState<TourReviewListResponse | null>(null);
  const [tourRating, setTourRating] = useState<number>(5);
  const [tourComment, setTourComment] = useState<string>('');
  const [tourIsAnonymous, setTourIsAnonymous] = useState<boolean>(false);
  const [submittingTourReview, setSubmittingTourReview] = useState<boolean>(false);
  const [tourReviewSuccess, setTourReviewSuccess] = useState<boolean>(false);

  const loadTours = async () => {
    setLoading(true);
    try {
      const data = await fetchTours();
      setTours(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tour:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTours();
    if (activeTourDetail) {
      fetchTourDetail(activeTourDetail.id)
        .then((detail) => setActiveTourDetail(detail))
        .catch(() => {});
    }
  }, [language]);

  const handleOpenDetail = async (tourId: number) => {
    setLoadingDetailId(tourId);
    setTourDetailTab('stops');
    setTourComment('');
    setTourReviewSuccess(false);
    try {
      const [detail, reviews] = await Promise.all([
        fetchTourDetail(tourId),
        fetchTourReviews(tourId).catch(() => null),
      ]);
      setActiveTourDetail(detail);
      setTourReviews(reviews);
    } catch (err: any) {
      alert(err.message || 'Không thể tải chi tiết tour');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleSubmitTourReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTourDetail || !tourComment.trim()) return;
    setSubmittingTourReview(true);
    try {
      await postTourReview(activeTourDetail.id, {
        rating: tourRating,
        comment: tourComment.trim(),
        isAnonymous: tourIsAnonymous,
      });
      setTourReviewSuccess(true);
      setTourComment('');
      // Reload reviews
      const updated = await fetchTourReviews(activeTourDetail.id);
      setTourReviews(updated);
      setTimeout(() => setTourReviewSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmittingTourReview(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 pb-28 lg:pb-12 pt-16">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1.5">
                {tk('tours_badge')}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {tk('tours_title')}
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                {tk('tours_subtitle')}
              </p>
            </div>

            {/* Create Tour Main Button */}
            <button
              onClick={() => setIsChoiceModalOpen(true)}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition cursor-pointer self-start md:self-auto shrink-0"
            >
              <span>🧭</span>
              <span>{tk('tours_btn_create')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tours List ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">{tk('tours_loading')}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Photo & Badges */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                  {tour.thumbnailUrl ? (
                    <img
                      src={tour.thumbnailUrl}
                      alt={tour.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-indigo-900 text-indigo-400">
                      🗺️
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  <div className="absolute top-4 left-4">
                    <span className="bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {tour.theme}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-lg font-black leading-snug">{tour.name}</h3>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {tour.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{tk('tours_duration')}</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">{tour.estimatedDurationMinutes} {tk('tours_minutes')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{tk('tours_distance')}</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">{(tour.totalDistanceMeters / 1000).toFixed(1)} km</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{tk('tours_cost')}</p>
                      <p className="text-xs font-black text-indigo-600 mt-0.5">
                        {tour.estimatedCost ? `${tour.estimatedCost.toLocaleString()}đ` : tk('tours_free')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-500">
                      📍 {tour.stopCount} {tk('tours_stops_count')}
                    </span>

                    <button
                      onClick={() => handleOpenDetail(tour.id)}
                      disabled={loadingDetailId === tour.id}
                      className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      {loadingDetailId === tour.id ? tk('tours_loading_detail') : tk('tours_view_detail')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOUR DETAIL MODAL */}
      {activeTourDetail && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{tk('tours_route_detail')}</span>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">{activeTourDetail.name}</h3>
              </div>
              <button
                onClick={() => setActiveTourDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs: Lộ trình & Đánh giá */}
            <div className="flex border-b border-slate-200 bg-white px-5 shrink-0">
              <button
                type="button"
                onClick={() => setTourDetailTab('stops')}
                className={`py-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                  tourDetailTab === 'stops'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📍 {tk('tours_tab_stops')} ({activeTourDetail.stops.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTourDetailTab('reviews')}
                className={`py-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition cursor-pointer ml-6 ${
                  tourDetailTab === 'reviews'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>⭐ {tk('tours_tab_reviews')} {tourReviews ? `(${tourReviews.totalCount})` : ''}</span>
              </button>
            </div>

            {/* TAB 1: STOPS TIMELINE */}
            {tourDetailTab === 'stops' && (
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="bg-indigo-50/60 border border-indigo-100 p-3.5 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
                  <span>⏱️ <b>{activeTourDetail.estimatedDurationMinutes} {tk('tours_minutes')}</b></span>
                  <span>📏 <b>{(activeTourDetail.totalDistanceMeters / 1000).toFixed(1)} km</b></span>
                  <span>💰 <b>{activeTourDetail.estimatedCost?.toLocaleString()}đ</b></span>
                </div>

                <div className="space-y-3 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
                  {activeTourDetail.stops.map((stop, idx) => {
                    const poiId = stop.poi?.id || stop.poiId;
                    const poiName = stop.poi?.name || stop.poiName || `Điểm dừng #${idx + 1}`;
                    const address = stop.poi?.address || stop.address || 'Quận 4, TP. Hồ Chí Minh';
                    const duration = stop.estimatedDurationMinutes || stop.suggestedDurationMinutes || 30;
                    const dish = stop.recommendedDishOrActivity;
                    const note = stop.note || stop.notes;

                    return (
                      <div key={stop.stopId || stop.id || idx} className="relative bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="absolute -left-[27px] top-3.5 w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center ring-4 ring-white">
                          {stop.stopOrder || idx + 1}
                        </div>

                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900">{poiName}</h4>
                          <span className="text-[10px] font-bold text-indigo-600">~{duration} phút</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">📍 {address}</p>
                        {dish && (
                          <p className="text-[10px] text-indigo-700 font-semibold bg-indigo-50/80 px-2 py-0.5 rounded-md mt-1 border border-indigo-100">
                            🍲 {dish}
                          </p>
                        )}
                        {note && <p className="text-[11px] text-slate-600 italic mt-1">💡 {note}</p>}

                        <div className="mt-2.5 flex items-center flex-wrap gap-2">
                          {poiId && (
                            <button
                              onClick={() => {
                                setSelectedPoiInitialTab('info');
                                setSelectedPoiId(poiId);
                              }}
                              className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              Xem quán/di tích →
                            </button>
                          )}
                          {poiId && <span className="text-slate-300">•</span>}
                          {poiId && (
                            <button
                              onClick={() => {
                                setSelectedPoiInitialTab('reviews');
                                setSelectedPoiId(poiId);
                              }}
                              className="text-[10px] font-bold text-amber-600 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>⭐ Đánh giá quán này</span>
                            </button>
                          )}
                          {poiId && <span className="text-slate-300">•</span>}
                          {poiId && (
                            <button
                              onClick={() => {
                                onOpenMap(poiId);
                                setActiveTourDetail(null);
                              }}
                              className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              Chỉ đường trên bản đồ →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: REVIEWS & RATINGS */}
            {tourDetailTab === 'reviews' && (
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {/* Điểm trung bình */}
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {tourReviews ? (tourReviews.avgRating ? tourReviews.avgRating.toFixed(1) : '5.0') : '5.0'}
                      </span>
                      <div className="text-amber-500 text-sm">★★★★★</div>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Dựa trên <b>{tourReviews?.totalCount ?? 0}</b> lượt đánh giá từ du khách
                    </p>
                  </div>
                  <span className="text-3xl">🌟</span>
                </div>

                {/* Form gửi đánh giá */}
                <form onSubmit={handleSubmitTourReview} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">Để lại đánh giá cho tuyến tour</h4>
                    <span className="text-[10px] text-slate-400">Trải nghiệm du lịch Quận 4</span>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTourRating(star)}
                        className={`text-2xl transition cursor-pointer hover:scale-110 ${
                          star <= tourRating ? 'text-amber-400' : 'text-slate-200'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 ml-2">{tourRating} sao</span>
                  </div>

                  {/* Comment input */}
                  <textarea
                    value={tourComment}
                    onChange={(e) => setTourComment(e.target.value)}
                    placeholder="Cảm nhận của bạn về độ hợp lý của thời gian, hương vị quán ăn và trải nghiệm khám phá tuyến tour này..."
                    rows={2}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-slate-50"
                  />

                  {/* Chế độ: Công khai vs Riêng tư / Ẩn danh */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">Chế độ hiển thị:</span>
                      <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setTourIsAnonymous(false)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            !tourIsAnonymous
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>🌐</span> Công khai
                        </button>
                        <button
                          type="button"
                          onClick={() => setTourIsAnonymous(true)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            tourIsAnonymous
                              ? 'bg-white text-purple-700 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>🔒</span> Riêng tư / Ẩn danh
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingTourReview || !tourComment.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs shrink-0"
                    >
                      {submittingTourReview ? 'Đang gửi...' : 'Gửi Đánh Giá Tour'}
                    </button>
                  </div>

                  {tourReviewSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                      <span>🎉 Cảm ơn bạn! Đánh giá đã được ghi nhận thành công.</span>
                    </div>
                  )}
                </form>

                {/* Danh sách đánh giá */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Nhận xét từ du khách ({tourReviews?.items?.length || 0})
                  </h4>

                  {(!tourReviews?.items || tourReviews.items.length === 0) ? (
                    <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                      Chưa có đánh giá nào cho tuyến này. Hãy là người đầu tiên chia sẻ cảm nhận!
                    </div>
                  ) : (
                    tourReviews.items.map((rev) => (
                      <div key={rev.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center">
                              {rev.isAnonymous ? '👤' : (rev.userDisplayName?.[0]?.toUpperCase() || 'D')}
                            </div>
                            <span className="text-xs font-bold text-slate-800">{rev.userDisplayName}</span>
                            {rev.isAnonymous ? (
                              <span className="text-[9px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                Ẩn danh
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                Công khai
                              </span>
                            )}
                          </div>
                          <div className="text-amber-400 text-xs">
                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed pl-8">
                          {rev.comment}
                        </p>
                        <p className="text-[10px] text-slate-400 pl-8">
                          {new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">
                {tourDetailTab === 'stops' ? '📍 Chúc bạn có chuyến đi vui vẻ!' : '⭐ Cảm ơn bạn đã đóng góp đánh giá!'}
              </span>
              <button
                onClick={() => {
                  onOpenMap(undefined, activeTourDetail);
                  setActiveTourDetail(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                Bắt đầu đi theo tuyến →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHỌN PHƯƠNG THỨC TẠO TOUR (CHOICE MODAL) */}
      {isChoiceModalOpen && (
        <div className="fixed inset-0 z-[2150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">Thiết Kế Tuyến Tour Khám Phá</h3>
                <p className="text-xs text-slate-500">Chọn cách thức bạn muốn lên lộ trình du lịch:</p>
              </div>
              <button
                onClick={() => setIsChoiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Tự thiết kế thủ công */}
              <button
                type="button"
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  setIsManualModalOpen(true);
                }}
                className="w-full text-left p-4 rounded-2xl border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50/40 transition group cursor-pointer space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">✍️</span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Tự chọn điểm dừng
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition">
                  1. Tự Thiết Kế Tuyến (Thủ công như Admin)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tự chọn các quán ăn, di tích từ bản đồ, sắp xếp thứ tự trạm dừng, thời gian lưu lại và chọn chế độ <b>Công khai</b> hoặc <b>Riêng tư</b>.
                </p>
              </button>

              {/* Option 2: AI lập lộ trình */}
              <button
                type="button"
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  setIsCustomModalOpen(true);
                }}
                className="w-full text-left p-4 rounded-2xl border-2 border-purple-100 hover:border-purple-600 hover:bg-purple-50/40 transition group cursor-pointer space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🤖</span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Tối ưu tự động bằng AI
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-purple-600 transition">
                  2. AI Lên Lịch Trình Tự Động (AI / PostGIS)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nhập quỹ thời gian rảnh và ngân sách, thuật toán AI & PostGIS tự động tính toán các điểm đến hấp dẫn và tối ưu cung đường ngắn nhất.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER MANUAL TOUR MODAL */}
      <UserManualTourModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onTourCreated={loadTours}
        onStartTour={(tour) => {
          setIsManualModalOpen(false);
          onOpenMap(undefined, tour);
        }}
      />

      {/* CUSTOM TOUR MODAL */}
      <CustomTourModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onTourCreated={loadTours}
        onSelectPoi={(id) => {
          setSelectedPoiId(id);
          setIsCustomModalOpen(false);
        }}
        onStartTour={(tour) => {
          setIsCustomModalOpen(false);
          onOpenMap(undefined, tour);
        }}
      />

      {/* POI DETAIL MODAL */}
      {selectedPoiId && (
        <PoiDetailModal
          poiId={selectedPoiId}
          initialTab={selectedPoiInitialTab}
          onClose={() => {
            setSelectedPoiId(null);
            setSelectedPoiInitialTab('info');
          }}
          onNavigate={() => onOpenMap(selectedPoiId)}
        />
      )}
    </div>
  );
}
