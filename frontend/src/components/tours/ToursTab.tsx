'use client';

import React, { useState, useEffect } from 'react';
import { TourSummary, TourDetail } from '@/types';
import { fetchTours, fetchTourDetail } from '@/services/api';
import CustomTourModal from '@/components/tours/CustomTourModal';
import PoiDetailModal from '@/components/poi/PoiDetailModal';

interface ToursTabProps {
  onOpenMap: (poiId?: string | number) => void;
}

export default function ToursTab({ onOpenMap }: ToursTabProps) {
  const [tours, setTours] = useState<TourSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTourDetail, setActiveTourDetail] = useState<TourDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadTours = async () => {
      setLoading(true);
      try {
        const data = await fetchTours();
        if (isMounted) setTours(data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách tour:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadTours();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenDetail = async (tourId: number) => {
    setLoadingDetailId(tourId);
    try {
      const detail = await fetchTourDetail(tourId);
      setActiveTourDetail(detail);
    } catch (err: any) {
      alert(err.message || 'Không thể tải chi tiết tour');
    } finally {
      setLoadingDetailId(null);
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
                Lộ Trình Được Thiết Kế Chuyên Nghiệp
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Tuyến Tour Thuyết Minh Tự Động
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                Trải nghiệm {tours.length} tour di sản, ẩm thực đường phố và ngắm cảnh ven sông với chỉ đường thông minh và audio GPS.
              </p>
            </div>

            {/* Custom Tour Button */}
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition cursor-pointer self-start md:self-auto shrink-0"
            >
              <span>🧭</span>
              <span>Tạo Tour Cá Nhân Hóa (AI / PostGIS)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tours List ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Đang tải tuyến tour từ Backend...</span>
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
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Thời gian</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">{tour.estimatedDurationMinutes} phút</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Cự ly</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">{(tour.totalDistanceMeters / 1000).toFixed(1)} km</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Chi phí</p>
                      <p className="text-xs font-black text-indigo-600 mt-0.5">
                        {tour.estimatedCost ? `${tour.estimatedCost.toLocaleString()}đ` : 'Miễn phí'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-500">
                      📍 {tour.stopCount} điểm dừng chân
                    </span>

                    <button
                      onClick={() => handleOpenDetail(tour.id)}
                      disabled={loadingDetailId === tour.id}
                      className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      {loadingDetailId === tour.id ? 'Đang tải...' : 'Xem lộ trình chi tiết →'}
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
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Chi tiết lộ trình</span>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">{activeTourDetail.name}</h3>
              </div>
              <button
                onClick={() => setActiveTourDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stops Timeline */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-indigo-50/60 border border-indigo-100 p-3.5 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
                <span>⏱️ <b>{activeTourDetail.estimatedDurationMinutes} phút</b></span>
                <span>📏 <b>{(activeTourDetail.totalDistanceMeters / 1000).toFixed(1)} km</b></span>
                <span>💰 <b>{activeTourDetail.estimatedCost?.toLocaleString()}đ</b></span>
              </div>

              <div className="space-y-3 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
                {activeTourDetail.stops.map((stop, idx) => (
                  <div key={stop.id} className="relative bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="absolute -left-[27px] top-3.5 w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center ring-4 ring-white">
                      {idx + 1}
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900">{stop.poiName}</h4>
                      <span className="text-[10px] font-bold text-indigo-600">~{stop.suggestedDurationMinutes} phút</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">📍 {stop.address}</p>
                    {stop.notes && <p className="text-[11px] text-slate-600 italic mt-1">{stop.notes}</p>}

                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPoiId(stop.poiId);
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        Xem quán/di tích →
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        onClick={() => {
                          onOpenMap(stop.poiId);
                          setActiveTourDetail(null);
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Chỉ đường trên bản đồ →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => {
                  if (activeTourDetail.stops.length > 0) {
                    onOpenMap(activeTourDetail.stops[0].poiId);
                    setActiveTourDetail(null);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                Bắt đầu đi theo tuyến →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TOUR MODAL */}
      <CustomTourModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSelectPoi={(id) => {
          setSelectedPoiId(id);
          setIsCustomModalOpen(false);
        }}
      />

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
