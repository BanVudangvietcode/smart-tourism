'use client';

import React from 'react';
import { PoiSummary } from '@/types';
import KpiCards from '../KpiCards';
import OcrScanner from '../OcrScanner';
import PoiTable from '../tables/PoiTable';
import DishTable from '../tables/DishTable';

interface AdminDashboardViewProps {
  activeVisitors: number;
  audioStats: any;
  topHotspots: any[];
  dwellStats: any;
  systemOverview: any;
  onSelectMetric: (type: 'visitors' | 'audio' | 'dwell' | 'system') => void;
  bottomTab: 'ocr' | 'pois' | 'dishes' | 'cache';
  setBottomTab: (tab: 'ocr' | 'pois' | 'dishes' | 'cache') => void;
  pois: PoiSummary[];
  filteredPois: PoiSummary[];
  ocrPoiId: number;
  setOcrPoiId: (id: number) => void;
  ocrFile: File | null;
  setOcrFile: (file: File | null) => void;
  ocrLoading: boolean;
  ocrItems: any[];
  setOcrItems: (items: any[]) => void;
  onScanMenuOcr: () => void;
  onSaveOcrDishes: () => void;
  onOpenCategoryModal: () => void;
  onOpenPoiTypeModal: () => void;
  onOpenCreatePoiModal: () => void;
  onOpenEditPoiModal: (poi: any) => void;
  onDeletePoi: (id: number, name: string) => void;
  onOpenAudioModal: (poiId: number, poiName: string) => void;
  selectedPoiId: number | null;
  onSelectPoiId: (id: number) => void;
  dishes: any[];
  onOpenAddDishModal: () => void;
  onDeleteDish: (dishId: number, dishName: string) => void;
  cachePattern: string;
  setCachePattern: (pattern: string) => void;
  onEvictCache: (pattern: string) => void;
}

export default function AdminDashboardView({
  activeVisitors,
  audioStats,
  topHotspots,
  dwellStats,
  systemOverview,
  onSelectMetric,
  bottomTab,
  setBottomTab,
  pois,
  filteredPois,
  ocrPoiId,
  setOcrPoiId,
  ocrFile,
  setOcrFile,
  ocrLoading,
  ocrItems,
  setOcrItems,
  onScanMenuOcr,
  onSaveOcrDishes,
  onOpenCategoryModal,
  onOpenPoiTypeModal,
  onOpenCreatePoiModal,
  onOpenEditPoiModal,
  onDeletePoi,
  onOpenAudioModal,
  selectedPoiId,
  onSelectPoiId,
  dishes,
  onOpenAddDishModal,
  onDeleteDish,
  cachePattern,
  setCachePattern,
  onEvictCache,
}: AdminDashboardViewProps) {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* 5 COLORFUL KPI CARDS */}
      <KpiCards
        activeVisitors={activeVisitors}
        audioStats={audioStats}
        topHotspots={topHotspots}
        dwellStats={dwellStats}
        systemOverview={systemOverview}
        onSelectMetric={onSelectMetric}
      />

      {/* BOTTOM ROW: [📋 Bảng Danh Sách / Form Nhập Liệu / Quy Trình AI OCR] */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header with Tabs */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="text-xs sm:text-sm font-black text-slate-800">
              Khu Vực Thao Tác & Quản Trị Dữ Liệu
            </h3>
          </div>

          {/* Scrollable Tabs */}
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar -mx-1 px-1">
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl w-max sm:w-auto">
              <button
                type="button"
                onClick={() => setBottomTab('ocr')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  bottomTab === 'ocr'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🤖</span>
                <span className="hidden sm:inline">Quy Trình Duyệt </span>
                <span>AI OCR</span>
              </button>
              <button
                type="button"
                onClick={() => setBottomTab('pois')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  bottomTab === 'pois'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📍</span>
                <span className="hidden sm:inline">Bảng </span>
                <span>POI & Audio</span>
              </button>
              <button
                type="button"
                onClick={() => setBottomTab('dishes')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  bottomTab === 'dishes'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🍲</span>
                <span>Thực Đơn</span>
              </button>
              <button
                type="button"
                onClick={() => setBottomTab('cache')}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  bottomTab === 'cache'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>⚡</span>
                <span>Cache</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: AI OCR SCANNER */}
        {bottomTab === 'ocr' && (
          <div className="p-3 sm:p-5">
            <OcrScanner
              pois={pois}
              ocrPoiId={ocrPoiId}
              setOcrPoiId={setOcrPoiId}
              ocrFile={ocrFile}
              setOcrFile={setOcrFile}
              ocrLoading={ocrLoading}
              ocrItems={ocrItems}
              setOcrItems={setOcrItems}
              onScanMenuOcr={onScanMenuOcr}
              onSaveOcrDishes={onSaveOcrDishes}
            />
          </div>
        )}

        {/* TAB 2: POI TABLE */}
        {bottomTab === 'pois' && (
          <div className="p-5">
            <PoiTable
              pois={filteredPois}
              onOpenCategoryModal={onOpenCategoryModal}
              onOpenPoiTypeModal={onOpenPoiTypeModal}
              onOpenCreatePoiModal={onOpenCreatePoiModal}
              onOpenEditPoiModal={onOpenEditPoiModal}
              onDeletePoi={onDeletePoi}
              onOpenAudioModal={onOpenAudioModal}
            />
          </div>
        )}

        {/* TAB 3: DISHES TABLE */}
        {bottomTab === 'dishes' && (
          <div className="p-5">
            <DishTable
              pois={pois}
              selectedPoiId={selectedPoiId}
              onSelectPoiId={onSelectPoiId}
              dishes={dishes}
              onOpenAddDishModal={onOpenAddDishModal}
              onDeleteDish={onDeleteDish}
            />
          </div>
        )}

        {/* TAB 4: REDIS CACHE */}
        {bottomTab === 'cache' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Xóa Cache Theo Pattern</h4>
                <p className="text-[11px] text-slate-500">
                  Nhập mẫu key Redis cần xóa (ví dụ: `poi:*`, `menu:*`, `tour:*`, `*`):
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cachePattern}
                    onChange={(e) => setCachePattern(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono shadow-xs focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => onEvictCache(cachePattern)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    Xóa Key
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800">Trạng Thái Bộ Nhớ Đệm Redis</h4>
                <div className="space-y-1 text-slate-500 text-[11px]">
                  <p>• Host: <b>localhost:6379 (Redis 7)</b></p>
                  <p>• TTL mặc định: <b>24 giờ (86400 giây)</b></p>
                  <p>• Tự động vô hiệu khi có CRUD từ Quản Trị Viên.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
