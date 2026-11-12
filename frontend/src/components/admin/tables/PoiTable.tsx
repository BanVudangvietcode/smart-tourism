'use client';

import React from 'react';
import { PoiSummary } from '@/types';

interface PoiTableProps {
  pois: PoiSummary[];
  onOpenCategoryModal?: () => void;
  onOpenPoiTypeModal?: () => void;
  onOpenCreatePoiModal?: () => void;
  onOpenEditPoiModal: (poi: any) => void;
  onDeletePoi: (id: number, name: string) => void;
  onOpenAudioModal: (poiId: number, poiName: string) => void;
  showTopActions?: boolean;
  title?: string;
}

export default function PoiTable({
  pois,
  onOpenCategoryModal,
  onOpenPoiTypeModal,
  onOpenCreatePoiModal,
  onOpenEditPoiModal,
  onDeletePoi,
  onOpenAudioModal,
  showTopActions = true,
  title,
}: PoiTableProps) {
  return (
    <div className="space-y-4">
      {showTopActions && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500">
            {title || `Hiển thị ${pois.length} địa điểm ẩm thực & di tích Quận 4`}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {onOpenCategoryModal && (
              <button
                type="button"
                onClick={onOpenCategoryModal}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold text-xs px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Thêm, sửa hoặc xóa danh mục điểm đến"
              >
                <span>🏷️</span>
                <span>Quản Lý Danh Mục</span>
              </button>
            )}
            {onOpenPoiTypeModal && (
              <button
                type="button"
                onClick={onOpenPoiTypeModal}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-xs px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Thêm, sửa hoặc xóa phân loại hệ thống (POI Types)"
              >
                <span>🧭</span>
                <span>Quản Lý Phân Loại</span>
              </button>
            )}
            {onOpenCreatePoiModal && (
              <button
                type="button"
                onClick={onOpenCreatePoiModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Thêm Quán Mới</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs text-slate-700 min-w-[850px]">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3 w-14 text-center whitespace-nowrap">ID</th>
              <th className="p-3 whitespace-nowrap min-w-[240px]">Tên quán & Địa chỉ</th>
              <th className="p-3 whitespace-nowrap min-w-[150px]">Danh mục</th>
              <th className="p-3 whitespace-nowrap">Tọa độ PostGIS</th>
              <th className="p-3 whitespace-nowrap">Giờ mở cửa</th>
              <th className="p-3 whitespace-nowrap">Thuyết minh</th>
              <th className="p-3 text-right whitespace-nowrap w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pois.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Không tìm thấy địa điểm nào phù hợp.
                </td>
              </tr>
            ) : (
              pois.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono text-slate-400 text-center whitespace-nowrap">#{p.id}</td>
                  <td className="p-3 min-w-[240px]">
                    <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-sm">{p.address}</p>
                  </td>
                  <td className="p-3 whitespace-nowrap min-w-[150px]">
                    <span className="inline-block whitespace-nowrap bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-purple-200/80 shadow-2xs">
                      {p.categoryName || 'Ẩm thực'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-blue-600 text-[11px] whitespace-nowrap">
                    📍 {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                  </td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">{(p as any).openingHours || '15:00 - 23:00'}</td>
                  <td className="p-3 whitespace-nowrap">
                    {(p as any).hasAudio || (p as any).audioUrl ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">🎧 Sẵn sàng</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenAudioModal(p.id, p.name)}
                        className="text-amber-600 hover:underline text-[11px] font-bold cursor-pointer"
                      >
                        + Thêm MP3
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenAudioModal(p.id, p.name)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold cursor-pointer"
                      title="Tải audio MP3"
                    >
                      Audio
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEditPoiModal(p)}
                      className="text-amber-600 hover:text-amber-800 text-xs font-bold cursor-pointer"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePoi(p.id, p.name)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
