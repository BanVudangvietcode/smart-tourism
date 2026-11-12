'use client';

import React from 'react';
import { PoiSummary, CreateTourInput } from '@/types';

interface AdminTourModalProps {
  pois: PoiSummary[];
  tourFormData: CreateTourInput;
  setTourFormData: React.Dispatch<React.SetStateAction<CreateTourInput>>;
  tourSubmitting: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onAddStop: () => void;
  onRemoveStop: (index: number) => void;
}

export default function AdminTourModal({
  pois,
  tourFormData,
  setTourFormData,
  tourSubmitting,
  onClose,
  onSave,
  onAddStop,
  onRemoveStop,
}: AdminTourModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>🧭</span>
              <span>Tạo Tuyến Tour Du Lịch Mới</span>
            </h3>
            <p className="text-xs text-slate-500">Thiết kế lộ trình tham quan tuần tự kèm gợi ý món ngon và thuyết minh</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-bold block mb-1">Tên tuyến tour du lịch *</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Tour Đêm Ốc Vĩnh Khánh & Di Tích Bến Nhà Rồng"
              value={tourFormData.name}
              onChange={(e) => setTourFormData({ ...tourFormData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold shadow-2xs focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 font-bold block mb-1">Chủ đề (Theme)</label>
              <select
                value={tourFormData.theme || 'FOOD'}
                onChange={(e) => setTourFormData({ ...tourFormData, theme: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold shadow-2xs"
              >
                <option value="FOOD">🍲 Ẩm thực đêm</option>
                <option value="CULTURE">🏛️ Lịch sử & Văn hóa</option>
                <option value="WALKING">🚶 Đi bộ khám phá</option>
                <option value="SCENIC">🌉 Ngắm cảnh ven sông</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Trạng thái phát hành</label>
              <select
                value={tourFormData.isPublic ? 'true' : 'false'}
                onChange={(e) => setTourFormData({ ...tourFormData, isPublic: e.target.value === 'true' })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold shadow-2xs"
              >
                <option value="true">🟢 Công khai (Cho mọi du khách)</option>
                <option value="false">🔒 Bản nháp nội bộ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-600 font-bold block mb-1">Mô tả tóm tắt hành trình</label>
            <textarea
              rows={2}
              placeholder="Giới thiệu điểm nhấn của tour này..."
              value={tourFormData.description || ''}
              onChange={(e) => setTourFormData({ ...tourFormData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-2xs focus:bg-white"
            />
          </div>

          {/* Danh sách các trạm dừng chân */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                <span>📍</span>
                <span>Các điểm dừng trong lộ trình ({tourFormData.stops.length})</span>
              </label>
              <button
                type="button"
                onClick={onAddStop}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
              >
                + Thêm điểm dừng
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {tourFormData.stops.map((stop, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-600 text-xs">Trạm #{idx + 1}</span>
                    {tourFormData.stops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveStop(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                      >
                        ✕ Xóa trạm
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <select
                        value={stop.poiId}
                        onChange={(e) => {
                          const updated = [...tourFormData.stops];
                          updated[idx].poiId = Number(e.target.value);
                          setTourFormData({ ...tourFormData, stops: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-[11px] font-bold shadow-2xs"
                      >
                        {pois.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.id} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Thời lượng (phút)"
                        value={stop.estimatedDurationMinutes || 30}
                        onChange={(e) => {
                          const updated = [...tourFormData.stops];
                          updated[idx].estimatedDurationMinutes = Number(e.target.value);
                          setTourFormData({ ...tourFormData, stops: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-[11px] shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Gợi ý món ăn / trải nghiệm..."
                        value={stop.recommendedDishOrActivity || ''}
                        onChange={(e) => {
                          const updated = [...tourFormData.stops];
                          updated[idx].recommendedDishOrActivity = e.target.value;
                          setTourFormData({ ...tourFormData, stops: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-[11px] shadow-2xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Ghi chú di chuyển / lưu ý đặc biệt..."
                        value={stop.note || ''}
                        onChange={(e) => {
                          const updated = [...tourFormData.stops];
                          updated[idx].note = e.target.value;
                          setTourFormData({ ...tourFormData, stops: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-[11px] shadow-2xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={tourSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>💾</span>
              <span>{tourSubmitting ? 'Đang lưu tuyến tour...' : 'Tạo Tuyến Tour'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
