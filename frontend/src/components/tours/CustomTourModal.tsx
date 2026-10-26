'use client';

import React, { useState } from 'react';
import { generateCustomTour, createTour } from '@/services/api';
import { CustomPlanResponse } from '@/types';

interface CustomTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPoi?: (poiId: number) => void;
  onTourCreated?: () => void;
}

export default function CustomTourModal({ isOpen, onClose, onSelectPoi, onTourCreated }: CustomTourModalProps) {
  const [minutes, setMinutes] = useState<number>(90);
  const [budget, setBudget] = useState<number>(200000);
  const [tourName, setTourName] = useState<string>('Tour khám phá nhanh Quận 4');
  const [loading, setLoading] = useState(false);
  const [savingTour, setSavingTour] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPublicTour, setIsPublicTour] = useState(true);
  const [plan, setPlan] = useState<CustomPlanResponse | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await generateCustomTour({
        availableMinutes: minutes,
        startLat: 10.7612, // Tâm Quận 4
        startLng: 106.7025,
        maxBudget: budget,
        tourName,
        saveAsTour: false,
      });
      setPlan(res);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo lộ trình');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTour = async () => {
    if (!plan || plan.stops.length === 0) return;
    setSavingTour(true);
    try {
      const stopRequests = plan.stops.map((s, idx) => ({
        poiId: s.poi?.id || s.poiId || 1,
        stopOrder: s.stopOrder || idx + 1,
        estimatedDurationMinutes: s.estimatedDurationMinutes || s.suggestedDurationMinutes || 30,
        recommendedDishOrActivity: s.recommendedDishOrActivity || s.notes || 'Tham quan điểm dừng',
        note: s.note || s.notes || '',
      }));
      const cost = plan.estimatedCost ?? plan.totalEstimatedCost ?? 100000;
      await createTour({
        name: tourName || plan.tourName || `Tour Cá Nhân Hóa (${minutes} phút)`,
        description: `Lộ trình tham quan tối ưu tự động bằng AI & PostGIS dựa trên quỹ thời gian ${minutes} phút tại Quận 4.`,
        theme: plan.theme || 'FOOD',
        estimatedDurationMinutes: plan.totalDurationMinutes,
        estimatedCost: cost,
        totalDistanceMeters: plan.totalDistanceMeters,
        isPublic: isPublicTour,
        creatorName: 'Du khách tự tạo',
        stops: stopRequests,
      });
      setSaveSuccess(true);
      if (onTourCreated) onTourCreated();
      setTimeout(() => {
        onClose();
        setSaveSuccess(false);
      }, 1500);
    } catch (err: any) {
      alert(`Lỗi khi lưu tour: ${err.message}`);
    } finally {
      setSavingTour(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🧭
            </div>
            <div>
              <h3 className="text-base font-black">Thiết Kế Tuyến Tour Theo Ý Bạn</h3>
              <p className="text-xs text-blue-100">Thuật toán PostGIS tự tối ưu đường đi & thời gian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Controls */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Quỹ thời gian bạn rảnh:</label>
                <span className="text-xs font-black text-blue-600">{minutes} phút ({Math.floor(minutes / 60)}h{minutes % 60 ? ` ${minutes % 60}p` : ''})</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 150].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(m)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      minutes === m
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m} phút
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Ngân sách tối đa:</label>
                <span className="text-xs font-black text-blue-600">{budget.toLocaleString()} VNĐ</span>
              </div>
              <input
                type="range"
                min="50000"
                max="500000"
                step="25000"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Hệ thống đang lập lộ trình...' : '🚀 Lập Tuyến Tham Quan Ngay'}
            </button>
          </div>

          {/* Result Itinerary */}
          {plan && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl">
                <h4 className="text-xs font-black text-blue-900">{tourName || plan.tourName || 'Lộ trình tối ưu riêng cho bạn'}</h4>
                <div className="flex items-center gap-4 mt-1.5 text-[11px] font-semibold text-blue-800">
                  <span>⏱️ Tổng: <b>{plan.totalDurationMinutes} phút</b></span>
                  <span>📏 Cự ly: <b>{((plan.totalDistanceMeters || 0) / 1000).toFixed(1)} km</b></span>
                  <span>💰 Chi phí: <b>{(plan.estimatedCost ?? plan.totalEstimatedCost ?? 0).toLocaleString()}đ</b></span>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Các điểm dừng tối ưu ({plan.stops.length})
                </h5>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                  {plan.stops.map((stop, index) => {
                    const poiId = stop.poi?.id || stop.poiId;
                    const poiName = stop.poi?.name || stop.poiName || `Điểm dừng #${index + 1}`;
                    const address = stop.poi?.address || stop.address || 'Quận 4, TP. Hồ Chí Minh';
                    const duration = stop.estimatedDurationMinutes || stop.suggestedDurationMinutes || 30;
                    const dish = stop.recommendedDishOrActivity;
                    const note = stop.note || stop.notes;

                    return (
                      <div key={poiId || index} className="relative bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="absolute -left-[27px] top-3 w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center ring-4 ring-white">
                          {stop.stopOrder || index + 1}
                        </div>

                        <div className="flex items-center justify-between">
                          <h6 className="text-xs font-extrabold text-slate-900">{poiName}</h6>
                          <span className="text-[10px] text-blue-600 font-bold">~{duration} phút</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{address}</p>
                        {dish && (
                          <p className="text-[10px] text-indigo-700 font-semibold bg-indigo-50/80 px-2 py-0.5 rounded-md mt-1 border border-indigo-100">
                            🍲 {dish}
                          </p>
                        )}
                        {note && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">
                            💡 {note}
                          </p>
                        )}

                        {onSelectPoi && poiId && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPoi(poiId);
                              onClose();
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:underline mt-1.5 inline-block cursor-pointer"
                          >
                            Xem chi tiết điểm dừng →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Public vs Private Selector */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">Quyền riêng tư tuyến tour:</label>
                    <span className="text-[10px] text-slate-500">
                      {isPublicTour ? 'Mọi người đều có thể thấy và đi theo tour này' : 'Chỉ mình bạn thấy trong danh sách tour'}
                    </span>
                  </div>
                  <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5 border border-slate-300 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPublicTour(true)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        isPublicTour ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      🌐 Công khai
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublicTour(false)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        !isPublicTour ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      🔒 Riêng tư
                    </button>
                  </div>
                </div>

                {/* Button Save As Tour */}
                <div className="pt-2">
                  {saveSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs p-3 rounded-xl text-center flex items-center justify-center gap-1.5 animate-fadeIn">
                      <span>✅</span>
                      <span>Đã lưu tuyến tour vào hệ thống thành công!</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveTour}
                      disabled={savingTour}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs py-3 rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>💾</span>
                      <span>{savingTour ? 'Đang lưu vào hệ thống...' : 'Lưu Lộ Trình Này Thành Tour Của Tôi'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

