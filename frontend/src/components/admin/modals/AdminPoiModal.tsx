'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Category, PoiTypeItem, PoiSummary } from '@/types';
import { PIN_EMOJIS, PIN_COLORS, inferPoiTypeFromCategory } from '@/components/admin/constants';

const LocationPickerMap = dynamic(() => import('@/components/map/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs border border-slate-200 gap-2 animate-pulse">
      <span className="text-xl">🗺️</span>
      <span>Đang tải bản đồ định vị...</span>
    </div>
  ),
});

interface AdminPoiModalProps {
  editingPoi: PoiSummary | null;
  poiFormData: any;
  setPoiFormData: React.Dispatch<React.SetStateAction<any>>;
  poiImageFile: File | null;
  setPoiImageFile: React.Dispatch<React.SetStateAction<File | null>>;
  poiAudioFile: File | null;
  setPoiAudioFile: React.Dispatch<React.SetStateAction<File | null>>;
  categoriesList: Category[];
  poiTypesList: PoiTypeItem[];
  onOpenCategoryModal: () => void;
  onOpenPoiTypeModal: () => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
}

export default function AdminPoiModal({
  editingPoi,
  poiFormData,
  setPoiFormData,
  poiImageFile,
  setPoiImageFile,
  poiAudioFile,
  setPoiAudioFile,
  categoriesList,
  poiTypesList,
  onOpenCategoryModal,
  onOpenPoiTypeModal,
  onClose,
  onSave,
}: AdminPoiModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {editingPoi ? `Sửa Quán: ${editingPoi.name}` : 'Thêm Điểm Đến / Quán Ăn Mới'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Định vị trực tiếp trên bản đồ Quận 4, hỗ trợ lưu trữ tọa độ PostGIS & audio thuyết minh
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-bold block mb-1">Tên quán / Địa điểm *</label>
            <input
              type="text"
              required
              value={poiFormData.name}
              onChange={(e) => setPoiFormData({ ...poiFormData, name: e.target.value })}
              placeholder="Ví dụ: Quán Ốc Vũ, Phá Lấu Cô Thảo..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-xs focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* PHẦN 1: CHỌN DANH MỤC & LOẠI HÌNH POI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-bold flex items-center gap-1.5">
                  <span>🏷️</span>
                  <span>Danh mục điểm đến (Category) *</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenCategoryModal}
                  className="px-2 py-0.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Thêm, sửa hoặc xóa danh mục điểm đến"
                >
                  <span>⚙️</span>
                  <span>Thêm / Sửa / Xóa</span>
                </button>
              </div>
              <select
                value={poiFormData.categoryId || ''}
                onChange={(e) => {
                  const newCatId = Number(e.target.value);
                  const cat = categoriesList.find((c) => c.id === newCatId);
                  const inferred = cat ? inferPoiTypeFromCategory(cat.name, cat.slug) : 'FOOD';
                  setPoiFormData((prev: any) => ({
                    ...prev,
                    categoryId: newCatId,
                    pinEmoji: cat?.iconUrl || prev.pinEmoji,
                    poiType: inferred || prev.poiType,
                  }));
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {categoriesList.length === 0 ? (
                  <option value="">-- Chưa có danh mục (đang tải...) --</option>
                ) : (
                  categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.iconUrl || '🏷️'} {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                  <span>🧭</span>
                  <span>Phân loại hệ thống (POI Type)</span>
                  <span className="text-[10px] text-blue-600 font-normal">(Tự động theo danh mục)</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenPoiTypeModal}
                  className="px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Quản lý Phân loại hệ thống"
                >
                  <span>⚙️</span>
                  <span>Thêm / Sửa / Xóa</span>
                </button>
              </div>
              <select
                value={poiFormData.poiType || ''}
                onChange={(e) => setPoiFormData({ ...poiFormData, poiType: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {poiTypesList.length === 0 ? (
                  <option value="">-- Chưa có phân loại (đang tải...) --</option>
                ) : (
                  poiTypesList.map((pt) => (
                    <option key={pt.code} value={pt.code}>
                      {pt.icon || '📍'} {pt.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* PHẦN 2: TÙY CHỌN BIỂU TƯỢNG VÀ MÀU SẮC GHIM BẢN ĐỒ */}
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold flex items-center gap-1.5">
                <span>🎨</span>
                <span>Tùy chỉnh Biểu tượng & Màu sắc Ghim</span>
              </label>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-medium">Ghim hiển thị:</span>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shadow-xs border border-white"
                  style={{ backgroundColor: poiFormData.pinColor }}
                >
                  {poiFormData.pinEmoji}
                </div>
              </div>
            </div>

            {/* Chọn Icon Emoji */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Biểu tượng ghim:</p>
              <div className="flex flex-wrap gap-1.5">
                {PIN_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setPoiFormData({ ...poiFormData, pinEmoji: emoji })}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer ${
                      poiFormData.pinEmoji === emoji
                        ? 'bg-blue-600 text-white shadow-md scale-110 ring-2 ring-blue-400'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn Màu Ghim */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Màu ghim bản đồ:</p>
              <div className="flex flex-wrap items-center gap-2">
                {PIN_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setPoiFormData({ ...poiFormData, pinColor: c.value })}
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition-transform cursor-pointer border-2 ${
                      poiFormData.pinColor === c.value
                        ? 'scale-125 border-slate-900 shadow-md ring-2 ring-white'
                        : 'border-white hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* PHẦN 3: ĐỊNH VỊ POSTGIS MAP */}
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold flex items-center gap-1.5">
                <span>📍</span>
                <span>Định vị tọa độ trên bản đồ PostGIS (Kéo thả ghim) *</span>
              </label>
              <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {poiFormData.latitude?.toFixed(5)}, {poiFormData.longitude?.toFixed(5)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Bấm vào vị trí trên bản đồ để tự động điền tọa độ và gợi ý địa chỉ chuẩn:
            </p>

            <LocationPickerMap
              latitude={poiFormData.latitude || 10.7612}
              longitude={poiFormData.longitude || 106.7025}
              pinIcon={poiFormData.pinEmoji}
              pinColor={poiFormData.pinColor}
              onChange={(lat, lng, suggestedAddress) => {
                setPoiFormData((prev: any) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                  address: suggestedAddress || prev.address,
                }));
              }}
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Địa chỉ chính xác *</label>
            <input
              type="text"
              required
              value={poiFormData.address}
              onChange={(e) => setPoiFormData({ ...poiFormData, address: e.target.value })}
              placeholder="Ví dụ: 37 Vĩnh Khánh, Phường 9, Quận 4"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-xs focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-600 font-bold block mb-1">Mô tả giới thiệu</label>
            <textarea
              rows={2}
              value={poiFormData.description}
              onChange={(e) => setPoiFormData({ ...poiFormData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-xs focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 font-bold block mb-1">Giờ mở cửa</label>
              <input
                type="text"
                value={poiFormData.openingHours}
                onChange={(e) => setPoiFormData({ ...poiFormData, openingHours: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-xs focus:bg-white"
              />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Số điện thoại</label>
              <input
                type="text"
                value={poiFormData.phone}
                onChange={(e) => setPoiFormData({ ...poiFormData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-xs focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              {editingPoi ? 'Cập Nhật' : 'Lưu Điểm Đến'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
