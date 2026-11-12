'use client';

import React from 'react';
import { PoiSummary } from '@/types';
import OcrScanner from '../OcrScanner';
import DishTable from '../tables/DishTable';

interface AdminMenuViewProps {
  bottomTab: 'ocr' | 'pois' | 'dishes' | 'cache';
  setBottomTab: (tab: 'ocr' | 'pois' | 'dishes' | 'cache') => void;
  pois: PoiSummary[];
  selectedPoiId: number | null;
  onSelectPoiId: (id: number) => void;
  dishes: any[];
  onOpenAddDishModal: () => void;
  onDeleteDish: (dishId: number, dishName: string) => void;
  ocrPoiId: number;
  setOcrPoiId: (id: number) => void;
  ocrFile: File | null;
  setOcrFile: (file: File | null) => void;
  ocrLoading: boolean;
  ocrItems: any[];
  setOcrItems: (items: any[]) => void;
  onScanMenuOcr: () => void;
  onSaveOcrDishes: () => void;
}

export default function AdminMenuView({
  bottomTab,
  setBottomTab,
  pois,
  selectedPoiId,
  onSelectPoiId,
  dishes,
  onOpenAddDishModal,
  onDeleteDish,
  ocrPoiId,
  setOcrPoiId,
  ocrFile,
  setOcrFile,
  ocrLoading,
  ocrItems,
  setOcrItems,
  onScanMenuOcr,
  onSaveOcrDishes,
}: AdminMenuViewProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-slate-900">Quản Lý Thực Đơn & AI OCR Menu Scanner</h2>
          <p className="text-xs text-slate-500">Trích xuất tự động qua Gemini 1.5 Flash và quản lý giá món ăn</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setBottomTab('ocr')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              bottomTab === 'ocr' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🤖 Quy Trình Duyệt AI OCR
          </button>
          <button
            type="button"
            onClick={() => setBottomTab('dishes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              bottomTab === 'dishes' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🍲 Danh Sách Món Theo Quán
          </button>
        </div>

        {bottomTab === 'ocr' ? (
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
        ) : (
          <DishTable
            pois={pois}
            selectedPoiId={selectedPoiId}
            onSelectPoiId={onSelectPoiId}
            dishes={dishes}
            onOpenAddDishModal={onOpenAddDishModal}
            onDeleteDish={onDeleteDish}
          />
        )}
      </div>
    </div>
  );
}
