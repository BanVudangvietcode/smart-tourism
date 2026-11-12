'use client';

import React from 'react';
import { TourSummary } from '@/types';

interface AdminToursViewProps {
  tours: TourSummary[];
  openCreateTourModal: () => void;
  handleViewTourDetail: (tourId: number) => void;
  loadingDetailTourId: number | null;
  handleDeleteTour: (tourId: number, tourName: string) => void;
}

export default function AdminToursView({
  tours,
  openCreateTourModal,
  handleViewTourDetail,
  loadingDetailTourId,
  handleDeleteTour,
}: AdminToursViewProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>🧭</span>
            <span>Quản Lý Tuyến Du Lịch (Tours)</span>
          </h2>
          <p className="text-xs text-slate-500">Tuyến ẩm thực, di tích lịch sử và văn hóa tâm linh Quận 4</p>
        </div>
        <button
          type="button"
          onClick={openCreateTourModal}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span>+</span>
          <span>Tạo Tuyến Tour Mới</span>
        </button>
      </div>

      {tours.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 text-2xl flex items-center justify-center">
            🧭
          </div>
          <h4 className="text-sm font-bold text-slate-800">Chưa có tuyến tour du lịch nào</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hãy bấm nút bên dưới để thiết kế tuyến tour đầu tiên với các trạm dừng ẩm thực và di tích tại Quận 4.
          </p>
          <button
            type="button"
            onClick={openCreateTourModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            + Tạo Tuyến Tour Mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tours.map((t) => (
            <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {t.theme || 'Ẩm thực'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">⏱️ {t.estimatedDurationMinutes} phút</span>
                    {t.isPublic ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Công khai
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Nội bộ
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-black text-slate-900 line-clamp-1">{t.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{t.description || 'Chưa có mô tả chi tiết cho tuyến tour này.'}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">📍 {t.stopCount || 0} điểm dừng</span>
                  <span className="text-slate-400">•</span>
                  <span className="truncate max-w-[120px]" title={t.creatorName}>👤 {t.creatorName || 'Hệ thống'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewTourDetail(t.id)}
                    disabled={loadingDetailTourId === t.id}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <span>👁️</span>
                    <span>{loadingDetailTourId === t.id ? 'Đang mở...' : 'Xem lộ trình'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTour(t.id, t.name)}
                    className="px-2 py-1 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-xs transition cursor-pointer"
                    title="Xóa tuyến tour"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
