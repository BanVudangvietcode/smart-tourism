'use client';

import React from 'react';
import { PoiSummary } from '@/types';

interface OcrScannerProps {
  pois: PoiSummary[];
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

export default function OcrScanner({
  pois,
  ocrPoiId,
  setOcrPoiId,
  ocrFile,
  setOcrFile,
  ocrLoading,
  ocrItems,
  setOcrItems,
  onScanMenuOcr,
  onSaveOcrDishes,
}: OcrScannerProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-purple-50/70 border border-purple-200">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-sm">
            ✨
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold text-purple-950 truncate">
              Gemini 1.5 Flash Menu OCR Scanner
            </h4>
            <p className="text-[11px] text-purple-800 leading-snug mt-0.5">
              Chụp ảnh thực đơn hoặc menu giấy → AI tự động bóc tách tên món, giá tiền, danh mục → Duyệt 1 chạm vào database.
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 mt-1 md:mt-0">
          <select
            value={ocrPoiId}
            onChange={(e) => setOcrPoiId(Number(e.target.value))}
            className="w-full md:w-64 bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-purple-900 font-semibold focus:outline-none focus:border-purple-500 shadow-xs truncate cursor-pointer"
          >
            {pois.map((p) => (
              <option key={p.id} value={p.id}>
                Quán: {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload and Scan Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-3 text-center cursor-pointer transition bg-slate-50/50">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <span className="text-xs text-slate-600 font-medium truncate block">
            {ocrFile ? `📁 ${ocrFile.name}` : '📷 Bấm để chọn ảnh thực đơn hoặc kéo thả...'}
          </span>
        </label>

        <button
          type="button"
          onClick={onScanMenuOcr}
          disabled={ocrLoading || !ocrFile}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
        >
          {ocrLoading ? <span className="animate-spin">🔄</span> : '✨'}
          <span>{ocrLoading ? 'AI Đang Quét...' : 'Quét Menu Bằng AI'}</span>
        </button>

        {ocrItems.length > 0 && (
          <button
            type="button"
            onClick={onSaveOcrDishes}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <span>💾</span>
            <span>Lưu {ocrItems.filter((i) => i.selected).length} Món Vào Quán</span>
          </button>
        )}
      </div>

      {/* Scanned Dishes Table */}
      {ocrItems.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center whitespace-nowrap">Duyệt</th>
                <th className="p-3 whitespace-nowrap min-w-[200px]">Tên món ăn & Mô tả AI</th>
                <th className="p-3 whitespace-nowrap">Danh mục</th>
                <th className="p-3 whitespace-nowrap">Đơn giá (VNĐ)</th>
                <th className="p-3 whitespace-nowrap">Món đặc trưng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {ocrItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-purple-50/30 transition">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => {
                        const next = [...ocrItems];
                        next[idx].selected = e.target.checked;
                        setOcrItems(next);
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const next = [...ocrItems];
                        next[idx].name = e.target.value;
                        setOcrItems(next);
                      }}
                      className="bg-transparent border-b border-dashed border-slate-300 focus:border-purple-500 focus:outline-none w-full font-bold"
                    />
                    {item.description && (
                      <p className="text-[10px] text-slate-500 font-normal italic mt-0.5 max-w-sm truncate">
                        {item.description}
                      </p>
                    )}
                    {item.allergens && item.allergens !== 'Không' && (
                      <span className="inline-block text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded mt-1 font-semibold">
                        ⚠️ {item.allergens}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.categoryName || 'Món chính'}
                      onChange={(e) => {
                        const next = [...ocrItems];
                        next[idx].categoryName = e.target.value;
                        setOcrItems(next);
                      }}
                      className="bg-transparent border-b border-dashed border-slate-300 focus:border-purple-500 focus:outline-none text-slate-600"
                    />
                  </td>
                  <td className="p-3 text-emerald-600 font-bold">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const next = [...ocrItems];
                        next[idx].price = Number(e.target.value);
                        setOcrItems(next);
                      }}
                      className="bg-transparent border-b border-dashed border-slate-300 focus:border-purple-500 focus:outline-none w-28 text-emerald-600 font-bold"
                    />
                    <span>đ</span>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...ocrItems];
                        next[idx].isSignature = !next[idx].isSignature;
                        setOcrItems(next);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        item.isSignature
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.isSignature ? '⭐ Signature' : 'Thường'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-slate-400 text-xs">
          Tải lên ảnh menu để kích hoạt quy trình trích xuất tự động qua Gemini 1.5 Flash.
        </div>
      )}
    </div>
  );
}
