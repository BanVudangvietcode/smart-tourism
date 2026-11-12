'use client';

import React from 'react';
import { PoiSummary } from '@/types';

interface DishTableProps {
  pois: PoiSummary[];
  selectedPoiId: number | null;
  onSelectPoiId: (id: number) => void;
  dishes: any[];
  onOpenAddDishModal: () => void;
  onDeleteDish: (dishId: number, dishName: string) => void;
}

export default function DishTable({
  pois,
  selectedPoiId,
  onSelectPoiId,
  dishes,
  onOpenAddDishModal,
  onDeleteDish,
}: DishTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Chọn quán để quản lý món:</span>
          <select
            value={selectedPoiId || ''}
            onChange={(e) => onSelectPoiId(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold shadow-xs cursor-pointer focus:outline-none focus:border-amber-500"
          >
            {pois.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenAddDishModal}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>+ Thêm Món Vào Quán</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3 w-14 text-center whitespace-nowrap">ID</th>
              <th className="p-3 whitespace-nowrap min-w-[200px]">Tên món ăn</th>
              <th className="p-3 whitespace-nowrap">Nhóm món</th>
              <th className="p-3 whitespace-nowrap">Giá tiền</th>
              <th className="p-3 whitespace-nowrap">Đặc trưng</th>
              <th className="p-3 text-right whitespace-nowrap w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dishes.length > 0 ? (
              dishes.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono text-slate-400 text-center whitespace-nowrap">#{d.id}</td>
                  <td className="p-3 font-bold text-slate-900 min-w-[200px]">{d.name}</td>
                  <td className="p-3 text-slate-500 whitespace-nowrap">{d.categoryName}</td>
                  <td className="p-3 text-emerald-600 font-bold whitespace-nowrap">{d.price?.toLocaleString()}đ</td>
                  <td className="p-3 whitespace-nowrap">
                    {d.isSignature && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                        ⭐ Món Tủ
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDeleteDish(d.id, d.name)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                  Chưa có món ăn nào trong thực đơn quán này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
