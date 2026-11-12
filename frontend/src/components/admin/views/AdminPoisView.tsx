'use client';

import React from 'react';
import { PoiSummary } from '@/types';
import PoiTable from '../tables/PoiTable';

interface AdminPoisViewProps {
  filteredPois: PoiSummary[];
  onOpenCategoryModal: () => void;
  onOpenPoiTypeModal: () => void;
  onOpenCreatePoiModal: () => void;
  onOpenEditPoiModal: (poi: any) => void;
  onDeletePoi: (id: number, name: string) => void;
  onOpenAudioModal: (poiId: number, poiName: string) => void;
}

export default function AdminPoisView({
  filteredPois,
  onOpenCategoryModal,
  onOpenPoiTypeModal,
  onOpenCreatePoiModal,
  onOpenEditPoiModal,
  onDeletePoi,
  onOpenAudioModal,
}: AdminPoisViewProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-slate-900">Quản Lý Điểm Đến & Quán Ăn (POIs)</h2>
          <p className="text-xs text-slate-500">Hỗ trợ tọa độ PostGIS không gian, audio MP3 thuyết minh tự động</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
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
    </div>
  );
}
