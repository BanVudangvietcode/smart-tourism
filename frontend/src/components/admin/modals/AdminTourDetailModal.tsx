'use client';

import React from 'react';
import { TourDetail } from '@/types';

interface AdminTourDetailModalProps {
  tour: TourDetail;
  onClose: () => void;
}

export default function AdminTourDetailModal({ tour, onClose }: AdminTourDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {tour.theme || 'Ẩm thực'}
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">{tour.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tour.description || 'Lộ trình khám phá Quận 4'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Thời lượng</p>
            <p className="text-xs font-black text-slate-800 mt-0.5">⏱️ {tour.estimatedDurationMinutes} phút</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Cự ly</p>
            <p className="text-xs font-black text-slate-800 mt-0.5">📏 {((tour.totalDistanceMeters || 1200) / 1000).toFixed(1)} km</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Chi phí ước tính</p>
            <p className="text-xs font-black text-emerald-600 mt-0.5">💰 {(tour.estimatedCost || 150000).toLocaleString()}đ</p>
          </div>
        </div>

        {/* Stops Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Thứ Tự Các Điểm Dừng ({tour.stops?.length || 0})
          </h4>

          <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
            {tour.stops?.map((stop, index) => {
              const poiName = stop.poi?.name || (stop as any).poiName || `Điểm dừng #${index + 1}`;
              const address = stop.poi?.address || (stop as any).address || 'Quận 4, TP. Hồ Chí Minh';
              const duration = stop.estimatedDurationMinutes || (stop as any).suggestedDurationMinutes || 30;
              const dish = stop.recommendedDishOrActivity;
              const note = stop.note || (stop as any).notes;

              return (
                <div key={stop.stopId || stop.id || index} className="relative bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="absolute -left-[27px] top-3 w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center ring-4 ring-white">
                    {stop.stopOrder || index + 1}
                  </div>

                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900">{poiName}</h5>
                    <span className="text-[10px] text-blue-600 font-bold">~{duration} phút</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">📍 {address}</p>
                  {dish && (
                    <p className="text-[10px] text-indigo-700 font-semibold bg-indigo-50/80 px-2 py-0.5 rounded-md mt-1 border border-indigo-100">
                      🍲 {dish}
                    </p>
                  )}
                  {note && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mt-1.5 border border-amber-200/60">
                      💡 {note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
