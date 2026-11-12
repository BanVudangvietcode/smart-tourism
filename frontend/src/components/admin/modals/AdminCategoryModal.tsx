'use client';

import React, { useState } from 'react';
import { Category } from '@/types';
import { createCategory, updateCategory, deleteCategory } from '@/services/api';

interface AdminCategoryModalProps {
  categoriesList: Category[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const CATEGORY_EMOJIS = ['🍲', '🍢', '🍜', '☕', '🍺', '🥖', '🥪', '🍨', '🏛️', '⛩️', '⛪', '🌉', '📸', '📍', '⭐', '🔥'];

export default function AdminCategoryModal({
  categoriesList,
  onClose,
  onRefresh,
  showNotification,
}: AdminCategoryModalProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    iconUrl: '🍲',
  });
  const [loading, setLoading] = useState(false);

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name,
      iconUrl: cat.iconUrl || '🍲',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      showNotification('error', 'Vui lòng nhập tên danh mục!');
      return;
    }
    setLoading(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: categoryFormData.name.trim(),
          iconUrl: categoryFormData.iconUrl,
        });
        showNotification('success', `Đã cập nhật danh mục "${categoryFormData.name}"!`);
      } else {
        await createCategory({
          name: categoryFormData.name.trim(),
          iconUrl: categoryFormData.iconUrl,
        });
        showNotification('success', `Đã tạo danh mục mới "${categoryFormData.name}"!`);
      }
      setEditingCategory(null);
      setCategoryFormData({ name: '', iconUrl: '🍲' });
      await onRefresh();
    } catch (err: any) {
      showNotification('error', `Lỗi lưu danh mục: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?\nCác quán thuộc danh mục này sẽ chuyển về mặc định an toàn.`)) return;
    try {
      await deleteCategory(id);
      showNotification('success', `Đã xóa danh mục "${name}"!`);
      await onRefresh();
    } catch (err: any) {
      showNotification('error', `Lỗi xóa danh mục: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>🏷️</span>
              <span>Quản Lý Danh Mục Điểm Đến</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Thêm mới, chỉnh sửa tên, icon hoặc xóa danh mục hiển thị trên bản đồ và bộ lọc du lịch
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

        {/* Form Thêm / Sửa Danh mục */}
        <form onSubmit={handleSave} className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-purple-950 flex items-center gap-1.5">
              <span>{editingCategory ? '✏️ Chỉnh Sửa Danh Mục' : '➕ Thêm Danh Mục Mới'}</span>
            </h4>
            {editingCategory && (
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryFormData({ name: '', iconUrl: '🍲' });
                }}
                className="text-[10px] text-slate-500 hover:underline cursor-pointer"
              >
                Hủy sửa
              </button>
            )}
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
              <span>Tên danh mục *</span>
              <span className="text-[10px] text-purple-600 font-medium bg-purple-100/70 px-2 py-0.5 rounded-full">
                Thứ tự: Tự động tăng ⚡
              </span>
            </label>
            <input
              type="text"
              required
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
              placeholder="Ví dụ: Bánh mì & Xôi đêm, Lẩu bò..."
              className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-slate-900 shadow-2xs focus:border-purple-600 focus:outline-none"
            />
          </div>

          {/* Chọn Biểu Tượng Icon Emoji */}
          <div>
            <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
              <span>Biểu tượng hiển thị:</span>
              <span className="text-lg bg-white px-2 py-0.5 rounded-lg border border-purple-200 shadow-2xs">
                {categoryFormData.iconUrl || '🍲'}
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setCategoryFormData({ ...categoryFormData, iconUrl: em })}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                    categoryFormData.iconUrl === em
                      ? 'bg-purple-600 text-white shadow-sm scale-110 ring-2 ring-purple-400'
                      : 'bg-white hover:bg-purple-100 text-slate-700 border border-purple-200'
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
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{editingCategory ? '💾 Cập Nhật Danh Mục' : '➕ Tạo Danh Mục'}</span>
            </button>
          </div>
        </form>

        {/* Danh sách các danh mục hiện tại */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Danh Sách Danh Mục Hiện Có ({categoriesList.length})</span>
            <span className="text-[10px] text-slate-400">Bấm Sửa hoặc Xóa</span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700 min-w-[480px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-12 text-center whitespace-nowrap">Icon</th>
                  <th className="p-2.5 whitespace-nowrap">Tên danh mục</th>
                  <th className="p-2.5 whitespace-nowrap">Slug định danh</th>
                  <th className="p-2.5 w-16 text-center whitespace-nowrap">Thứ tự</th>
                  <th className="p-2.5 text-right whitespace-nowrap w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {categoriesList.map((cat, index) => (
                  <tr key={cat.id} className="hover:bg-purple-50/30 transition">
                    <td className="p-2.5 text-center text-base whitespace-nowrap">
                      {cat.iconUrl || '🏷️'}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                      {cat.name}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-purple-700 whitespace-nowrap">
                      {cat.slug || '—'}
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-400 font-bold text-[11px] whitespace-nowrap">
                      #{index + 1}
                    </td>
                    <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleEdit(cat)}
                        className="text-purple-600 hover:text-purple-800 font-bold text-[11px] hover:underline cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-[11px] hover:underline cursor-pointer"
                      >
                        Xóa
                      </button>
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
