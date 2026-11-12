'use client';

import React, { useState } from 'react';
import { PoiTypeItem } from '@/types';
import { createPoiType, updatePoiType, deletePoiType } from '@/services/api';

interface AdminPoiTypeModalProps {
  poiTypesList: PoiTypeItem[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const POI_TYPE_ICONS = ['📍', '🍲', '🏛️', '⛪', '⛩️', '🌉', '📸', '☕', '🍺', '🛍️', '🌳', '🎭', '⭐', '🔥'];

export default function AdminPoiTypeModal({
  poiTypesList,
  onClose,
  onRefresh,
  showNotification,
}: AdminPoiTypeModalProps) {
  const [editingPoiType, setEditingPoiType] = useState<PoiTypeItem | null>(null);
  const [poiTypeFormData, setPoiTypeFormData] = useState({
    code: '',
    name: '',
    icon: '📍',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleEdit = (pt: PoiTypeItem) => {
    setEditingPoiType(pt);
    setPoiTypeFormData({
      code: pt.code,
      name: pt.name,
      icon: pt.icon || '📍',
      description: pt.description || '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poiTypeFormData.name.trim()) {
      showNotification('error', 'Vui lòng nhập tên phân loại!');
      return;
    }
    setLoading(true);
    try {
      if (editingPoiType) {
        await updatePoiType(editingPoiType.code, {
          name: poiTypeFormData.name.trim(),
          icon: poiTypeFormData.icon,
          description: poiTypeFormData.description.trim(),
        });
        showNotification('success', `Đã cập nhật phân loại "${poiTypeFormData.name}"!`);
      } else {
        await createPoiType({
          code: '',
          name: poiTypeFormData.name.trim(),
          icon: poiTypeFormData.icon,
          description: poiTypeFormData.description.trim(),
        });
        showNotification('success', `Đã tạo phân loại mới "${poiTypeFormData.name}"!`);
      }
      setEditingPoiType(null);
      setPoiTypeFormData({ code: '', name: '', icon: '🍲', description: '' });
      await onRefresh();
    } catch (err: any) {
      showNotification('error', `Lỗi lưu phân loại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string, name: string) => {
    if (code === 'FOOD') {
      showNotification('error', 'Không thể xóa phân loại hệ thống mặc định FOOD!');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa phân loại "${name}" (${code})?\nCác quán thuộc phân loại này sẽ tự động chuyển về mặc định FOOD an toàn.`)) return;
    try {
      await deletePoiType(code);
      showNotification('success', `Đã xóa phân loại "${name}"!`);
      await onRefresh();
    } catch (err: any) {
      showNotification('error', `Lỗi xóa phân loại: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>🧭</span>
              <span>Quản Lý Phân Loại Hệ Thống (POI Types)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Phân loại cốt lõi hệ thống: Ẩm thực (FOOD), Di tích (HISTORICAL), Tôn giáo (RELIGIOUS)...
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

        {/* Form Thêm / Sửa Phân loại */}
        <form onSubmit={handleSave} className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
              <span>{editingPoiType ? '✏️ Chỉnh Sửa Phân Loại' : '➕ Thêm Phân Loại Mới'}</span>
            </h4>
            {editingPoiType && (
              <button
                type="button"
                onClick={() => {
                  setEditingPoiType(null);
                  setPoiTypeFormData({ code: '', name: '', icon: '📍', description: '' });
                }}
                className="text-[10px] text-slate-500 hover:underline cursor-pointer"
              >
                Hủy sửa
              </button>
            )}
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
              <span>Tên phân loại *</span>
              <span className="text-[10px] text-blue-600 font-medium bg-blue-100/70 px-2 py-0.5 rounded-full">
                Mã CODE: Tự động chuẩn hóa ⚡
              </span>
            </label>
            <input
              type="text"
              required
              value={poiTypeFormData.name}
              onChange={(e) => setPoiTypeFormData({ ...poiTypeFormData, name: e.target.value })}
              placeholder="Ví dụ: Điểm Check-in Sống Ảo, Quán Cà Phê..."
              className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-slate-900 shadow-2xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Mô tả đặc trưng</label>
            <input
              type="text"
              value={poiTypeFormData.description}
              onChange={(e) => setPoiTypeFormData({ ...poiTypeFormData, description: e.target.value })}
              placeholder="Mô tả ngắn gọn về phân loại này..."
              className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-slate-900 shadow-2xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Chọn Biểu Tượng Icon */}
          <div>
            <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
              <span>Biểu tượng phân loại:</span>
              <span className="text-lg bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                {poiTypeFormData.icon || '📍'}
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POI_TYPE_ICONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setPoiTypeFormData({ ...poiTypeFormData, icon: em })}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                    poiTypeFormData.icon === em
                      ? 'bg-blue-600 text-white shadow-sm scale-110 ring-2 ring-blue-400'
                      : 'bg-white hover:bg-blue-100 text-slate-700 border border-blue-200'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{editingPoiType ? '💾 Cập Nhật Phân Loại' : '➕ Tạo Phân Loại'}</span>
            </button>
          </div>
        </form>

        {/* Danh sách các phân loại hiện tại */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Danh Sách Phân Loại Hệ Thống Hiện Có ({poiTypesList.length})</span>
            <span className="text-[10px] text-slate-400">Bấm Sửa hoặc Xóa</span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700 min-w-[550px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-12 text-center whitespace-nowrap">Icon</th>
                  <th className="p-2.5 whitespace-nowrap">Tên phân loại</th>
                  <th className="p-2.5 whitespace-nowrap">Mô tả</th>
                  <th className="p-2.5 w-16 text-center whitespace-nowrap">Thứ tự</th>
                  <th className="p-2.5 text-right whitespace-nowrap w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {poiTypesList.map((pt, index) => (
                  <tr key={pt.code} className="hover:bg-blue-50/30 transition">
                    <td className="p-2.5 text-center text-base whitespace-nowrap">
                      {pt.icon || '📍'}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{pt.name}</p>
                      <p className="font-mono text-[10px] text-slate-400">Mã tự động: {pt.code}</p>
                    </td>
                    <td className="p-2.5 text-slate-500 text-[11px] max-w-[150px] truncate">{pt.description || '—'}</td>
                    <td className="p-2.5 text-center font-mono text-slate-500 font-bold text-[11px] whitespace-nowrap">
                      #{pt.sortOrder ?? (index + 1)}
                    </td>
                    <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleEdit(pt)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-[11px] hover:underline cursor-pointer"
                      >
                        Sửa
                      </button>
                      {pt.code !== 'FOOD' ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(pt.code, pt.name)}
                          className="text-rose-600 hover:text-rose-800 font-bold text-[11px] hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-medium italic">Gốc</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
