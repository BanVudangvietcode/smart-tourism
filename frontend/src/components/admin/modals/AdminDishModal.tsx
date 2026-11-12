'use client';

import React from 'react';

interface AdminDishModalProps {
  dishFormData: {
    name: string;
    categoryName: string;
    price: number;
    isSignature: boolean;
    description: string;
    allergens: string;
    imageUrl: string;
  };
  setDishFormData: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
}

export default function AdminDishModal({
  dishFormData,
  setDishFormData,
  onClose,
  onSave,
}: AdminDishModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h3 className="text-sm font-black text-slate-900">Thêm Món Ăn Mới</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-600 font-bold block mb-1">Tên món ăn *</label>
            <input
              type="text"
              required
              value={dishFormData.name}
              onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })}
              placeholder="Ví dụ: Ốc hương xào bơ tỏi"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 font-bold block mb-1">Đơn giá (VNĐ) *</label>
              <input
                type="number"
                required
                value={dishFormData.price}
                onChange={(e) => setDishFormData({ ...dishFormData, price: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Nhóm danh mục</label>
              <input
                type="text"
                value={dishFormData.categoryName}
                onChange={(e) => setDishFormData({ ...dishFormData, categoryName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isSignature"
              checked={dishFormData.isSignature}
              onChange={(e) => setDishFormData({ ...dishFormData, isSignature: e.target.checked })}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
            />
            <label htmlFor="isSignature" className="text-slate-700 font-bold cursor-pointer">
              Đánh dấu là món đặc trưng (Signature / Món Tủ)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-sm cursor-pointer"
            >
              Lưu Món
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
