'use client';

import React, { useState, useEffect } from 'react';
import { fetchPois, createTour } from '@/services/api';
import { PoiSummary, CreateTourInput } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserManualTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTourCreated?: () => void;
}

export default function UserManualTourModal({ isOpen, onClose, onTourCreated }: UserManualTourModalProps) {
  const { tk } = useLanguage();
  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [loadingPois, setLoadingPois] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tourData, setTourData] = useState<CreateTourInput>({
    name: '',
    description: '',
    theme: 'FOOD',
    thumbnailUrl: '',
    isPublic: true,
    creatorName: 'Du khách tự tạo',
    stops: [
      {
        poiId: 1,
        stopOrder: 1,
        estimatedDurationMinutes: 45,
        recommendedDishOrActivity: 'Thưởng thức món đặc sản',
        note: 'Trạm khởi hành',
      },
      {
        poiId: 2,
        stopOrder: 2,
        estimatedDurationMinutes: 30,
        recommendedDishOrActivity: 'Tham quan & check-in',
        note: 'Trạm dừng kế tiếp',
      },
    ],
  });

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const loadPois = async () => {
      setLoadingPois(true);
      setErrorMsg(null);
      setSuccess(false);
      try {
        const data = await fetchPois();
        if (isMounted) {
          setPois(data);
          if (data.length > 0) {
            setTourData((prev) => ({
              ...prev,
              stops: [
                {
                  poiId: data[0].id,
                  stopOrder: 1,
                  estimatedDurationMinutes: 45,
                  recommendedDishOrActivity: 'Thưởng thức món đặc sản',
                  note: 'Trạm khởi hành',
                },
                {
                  poiId: data[1]?.id || data[0].id,
                  stopOrder: 2,
                  estimatedDurationMinutes: 30,
                  recommendedDishOrActivity: 'Tham quan & check-in',
                  note: 'Trạm dừng kế tiếp',
                },
              ],
            }));
          }
        }
      } catch (err: any) {
        console.error('Lỗi tải danh sách POI:', err);
      } finally {
        if (isMounted) setLoadingPois(false);
      }
    };
    loadPois();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddStop = () => {
    const nextOrder = tourData.stops.length + 1;
    const availablePoi = pois.find((p) => !tourData.stops.some((s) => s.poiId === p.id)) || pois[0];
    setTourData((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          poiId: availablePoi?.id || 1,
          stopOrder: nextOrder,
          estimatedDurationMinutes: 30,
          recommendedDishOrActivity: 'Tham quan & thưởng thức',
          note: '',
        },
      ],
    }));
  };

  const handleRemoveStop = (index: number) => {
    if (tourData.stops.length <= 1) {
      alert('Tuyến tour cần có ít nhất 1 điểm dừng!');
      return;
    }
    const updated = tourData.stops
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, stopOrder: idx + 1 }));
    setTourData((prev) => ({ ...prev, stops: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourData.name.trim()) {
      setErrorMsg('Vui lòng nhập tên tuyến tour!');
      return;
    }
    if (tourData.stops.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 điểm dừng cho tour!');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createTour(tourData);
      setSuccess(true);
      if (onTourCreated) onTourCreated();
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo tuyến tour');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              ✍️
            </div>
            <div>
              <h3 className="text-base font-black">{tk('manual_tour_title')}</h3>
              <p className="text-xs text-purple-100">{tk('manual_tour_subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Tên tour & Chủ đề */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-slate-700 font-bold block mb-1">Tên Tuyến Tour *</label>
              <input
                type="text"
                required
                value={tourData.name}
                onChange={(e) => setTourData({ ...tourData, name: e.target.value })}
                placeholder="Ví dụ: Foodtour Ốc Đêm & Cà Phê Hoài Niệm..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold shadow-2xs focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Chủ Đề (Theme)</label>
              <select
                value={tourData.theme || 'FOOD'}
                onChange={(e) => setTourData({ ...tourData, theme: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold shadow-2xs focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="FOOD">🍲 Ẩm Thực (FOOD)</option>
                <option value="HISTORICAL">🏛️ Di Tích Lịch Sử (HISTORICAL)</option>
                <option value="RELIGIOUS">⛩️ Chùa & Tôn Giáo (RELIGIOUS)</option>
                <option value="LANDMARK">🌉 Cảnh Quan Check-in (LANDMARK)</option>
                <option value="MIXED">✨ Tuyến Tổng Hợp (MIXED)</option>
              </select>
            </div>
          </div>

          {/* Mô tả lộ trình */}
          <div>
            <label className="text-slate-700 font-bold block mb-1">Mô Tả Lộ Trình</label>
            <textarea
              rows={2}
              value={tourData.description || ''}
              onChange={(e) => setTourData({ ...tourData, description: e.target.value })}
              placeholder="Chia sẻ lý do bạn thích lộ trình này hoặc những trải nghiệm đáng nhớ..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 shadow-2xs focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Quyền hiển thị: Công khai vs Riêng tư */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block">Quyền riêng tư tuyến tour:</label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {tourData.isPublic
                  ? '🌐 Công khai: Tất cả du khách đều có thể xem và đi theo tuyến tour này'
                  : '🔒 Riêng tư: Chỉ một mình bạn nhìn thấy và sử dụng tuyến tour này'}
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-white p-1 border border-purple-200 shadow-2xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTourData({ ...tourData, isPublic: true })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  tourData.isPublic ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🌐</span>
                <span>Công khai</span>
              </button>
              <button
                type="button"
                onClick={() => setTourData({ ...tourData, isPublic: false })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  !tourData.isPublic ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🔒</span>
                <span>Riêng tư</span>
              </button>
            </div>
          </div>

          {/* DANH SÁCH CÁC ĐIỂM DỪNG (STOPS) */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📍</span>
                  <span>Các Điểm Dừng Chân ({tourData.stops.length} Trạm) *</span>
                </h4>
                <p className="text-[11px] text-slate-500">Thứ tự các điểm du khách sẽ lần lượt ghé thăm</p>
              </div>
              <button
                type="button"
                onClick={handleAddStop}
                disabled={loadingPois}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <span>+</span>
                <span>Thêm Điểm Dừng</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {tourData.stops.map((stop, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="bg-indigo-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full">
                      Trạm #{idx + 1}
                    </span>
                    {tourData.stops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold transition cursor-pointer"
                        title="Xóa trạm dừng này"
                      >
                        ✕ Xóa trạm
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Chọn POI */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Chọn Quán / Điểm Đến *</label>
                      <select
                        value={stop.poiId}
                        onChange={(e) => {
                          const newId = Number(e.target.value);
                          const updated = [...tourData.stops];
                          updated[idx].poiId = newId;
                          setTourData({ ...tourData, stops: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-semibold shadow-2xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                      >
                        {pois.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.id} - {p.name} ({p.categoryName || 'Quán ăn/Di tích'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Thời gian dừng */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Thời Gian Dừng (phút)</label>
                      <input
                        type="number"
                        min={5}
                        max={240}
                        value={stop.estimatedDurationMinutes || 30}
                        onChange={(e) => {
                          const updated = [...tourData.stops];
                          updated[idx].estimatedDurationMinutes = Number(e.target.value);
                          setTourData({ ...tourData, stops: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-semibold shadow-2xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Gợi ý món / hoạt động */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Gợi ý món ngon hoặc trải nghiệm tại trạm..."
                        value={stop.recommendedDishOrActivity || ''}
                        onChange={(e) => {
                          const updated = [...tourData.stops];
                          updated[idx].recommendedDishOrActivity = e.target.value;
                          setTourData({ ...tourData, stops: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-[11px] shadow-2xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Ghi chú di chuyển / lưu ý đặc biệt..."
                        value={stop.note || ''}
                        onChange={(e) => {
                          const updated = [...tourData.stops];
                          updated[idx].note = e.target.value;
                          setTourData({ ...tourData, stops: updated });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-[11px] shadow-2xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback & Actions */}
          {success ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
              <span>✅</span>
              <span>Đã tạo tuyến tour của bạn thành công! Đang tải lại...</span>
            </div>
          ) : (
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
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>💾</span>
                <span>{submitting ? 'Đang lưu tuyến tour...' : 'Tạo Tuyến Tour Của Tôi'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

