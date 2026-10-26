'use client';

import React, { useState, useEffect } from 'react';
import { PoiSummary, TourSummary, HealthStatus } from '@/types';
import { fetchPois, fetchTours, checkHealth } from '@/services/api';
import PoiDetailModal from '@/components/poi/PoiDetailModal';
import AiAssistantModal from '@/components/ai/AiAssistantModal';
import CustomTourModal from '@/components/tours/CustomTourModal';

interface HomePageProps {
  onOpenMap: (poiId?: string | number) => void;
}

export default function HomePage({ onOpenMap }: HomePageProps) {
  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [tours, setTours] = useState<TourSummary[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCustomTourOpen, setIsCustomTourOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [hData, pData, tData] = await Promise.all([
          checkHealth(),
          fetchPois().catch(() => []),
          fetchTours().catch(() => []),
        ]);
        if (isMounted) {
          setHealth(hData);
          setPois(pData);
          setTours(tData);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu trang chủ:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F8FAFC] pb-28 lg:pb-12">
      {/* ─── 1. HERO BANNER ────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white pt-16 pb-12 px-4 sm:px-8 overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-blue-100 border border-white/20">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'UP' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              Backend: {health?.status === 'UP' ? 'Đã kết nối PostGIS 17' : 'Đang kết nối...'}
            </span>
            <span className="text-xs text-white/80 font-medium">Quận 4 • TP. Hồ Chí Minh</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-2">
            Thì Thầm Sài Gòn <span className="text-cyan-200">✨</span>
          </h1>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl leading-relaxed mb-6">
            Lắng nghe từng câu chuyện di tích, khám phá từng con hẻm ẩm thực với thuyết minh âm thanh tự động qua GPS.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenMap()}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-black/10 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Mở Bản Đồ Khám Phá</span>
            </button>

            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-3 rounded-2xl shadow-lg font-bold text-xs transition active:scale-95 cursor-pointer"
            >
              <span>✨</span>
              <span>Gợi ý món ăn AI theo ngân sách</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-6 relative z-20 space-y-8">
        {/* ─── 2. QUICK SHORTCUTS ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onOpenMap()}
            className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex items-center gap-3 hover:border-blue-200 transition cursor-pointer hover:shadow-lg"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl shrink-0">
              🗺️
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900">Bản đồ GPS</h3>
              <p className="text-[10px] text-gray-500">Chỉ đường thời gian thực</p>
            </div>
          </div>

          <div
            onClick={() => setIsCustomTourOpen(true)}
            className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex items-center gap-3 hover:border-indigo-200 transition cursor-pointer hover:shadow-lg"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-xl shrink-0">
              🧭
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900">Tour tự động</h3>
              <p className="text-[10px] text-gray-500">Tối ưu theo thời gian</p>
            </div>
          </div>

          <div
            onClick={() => setIsAiModalOpen(true)}
            className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex items-center gap-3 hover:border-purple-200 transition cursor-pointer hover:shadow-lg"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-xl shrink-0">
              ✨
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900">Trợ lý AI</h3>
              <p className="text-[10px] text-gray-500">Hỏi đáp & gợi ý món</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex items-center gap-3 hover:border-emerald-200 transition cursor-pointer hover:shadow-lg">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-xl shrink-0">
              🎧
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900">Audio Guide</h3>
              <p className="text-[10px] text-gray-500">Tự phát ở bán kính 30m</p>
            </div>
          </div>
        </div>

        {/* ─── 3. ĐỊA ĐIỂM NỔI BẬT TRÊN BẢN ĐỒ ──────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Địa Điểm Nổi Bật ({pois.length})</h2>
              <p className="text-xs text-gray-500">Dữ liệu thực tế từ cơ sở dữ liệu PostGIS</p>
            </div>
            <button
              onClick={() => onOpenMap()}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem trên bản đồ</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-slate-400 text-xs">Đang tải danh sách địa điểm...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pois.slice(0, 4).map((poi) => (
                <div
                  key={poi.id}
                  onClick={() => setSelectedPoiId(poi.id)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3 bg-slate-100">
                      {poi.thumbnailUrl ? (
                        <img src={poi.thumbnailUrl} alt={poi.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl bg-blue-50 text-blue-500">📍</div>
                      )}
                      <span className="absolute top-2 left-2 text-[9px] bg-black/60 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded-full uppercase">
                        {poi.categoryName}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition truncate mb-1">
                      {poi.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-3">{poi.address}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-blue-600">
                      {poi.priceRangeMin ? `${poi.priceRangeMin.toLocaleString()}đ` : 'Miễn phí'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition">
                      Chi tiết →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 4. TUYẾN DU LỊCH ĐỀ XUẤT ───────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tuyến Tham Quan Đề Xuất</h2>
              <p className="text-xs text-gray-500">Các tour mẫu được lập trình sẵn</p>
            </div>
            <button
              onClick={() => setIsCustomTourOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>+ Tự tạo lộ trình</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🗺️</span>
                    <span className="text-[9px] bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full font-bold uppercase">
                      {tour.theme}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm leading-tight mb-1 truncate">{tour.name}</h3>
                  <p className="text-[11px] text-white/90 leading-snug line-clamp-2">{tour.description}</p>
                </div>

                <div className="p-3.5 bg-white flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                    <span>📍 {tour.stopCount} điểm</span>
                    <span>⏱️ {tour.estimatedDurationMinutes}p</span>
                    <span>📏 {(tour.totalDistanceMeters / 1000).toFixed(1)}km</span>
                  </div>

                  <button
                    onClick={() => onOpenMap()}
                    className="w-full bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-xs py-2 rounded-xl transition text-center cursor-pointer"
                  >
                    Bắt đầu hành trình
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 5. BANNER GIỚI THIỆU ─────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="max-w-md text-center sm:text-left">
            <span className="text-xs uppercase tracking-wider font-bold text-cyan-400 mb-1 inline-block">Hệ thống du lịch thông minh</span>
            <h3 className="text-xl sm:text-2xl font-extrabold leading-snug mb-2">
              Sẵn sàng khám phá Quận 4 cùng trợ lý âm thanh?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bật GPS và tai nghe, ứng dụng sẽ tự động phát những câu chuyện lịch sử thú vị ngay khi bạn đến gần địa điểm trong bán kính 30m.
            </p>
          </div>

          <button
            onClick={() => onOpenMap()}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-lg transition active:scale-95 shrink-0 cursor-pointer"
          >
            Trải nghiệm trên bản đồ ➔
          </button>
        </div>
      </div>

      {/* POI DETAIL MODAL */}
      {selectedPoiId && (
        <PoiDetailModal
          poiId={selectedPoiId}
          onClose={() => setSelectedPoiId(null)}
          onNavigate={() => onOpenMap(selectedPoiId)}
        />
      )}

      {/* AI ASSISTANT MODAL */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSelectPoi={(id) => {
          setSelectedPoiId(id);
          setIsAiModalOpen(false);
        }}
      />

      {/* CUSTOM TOUR MODAL */}
      <CustomTourModal
        isOpen={isCustomTourOpen}
        onClose={() => setIsCustomTourOpen(false)}
        onSelectPoi={(id) => {
          setSelectedPoiId(id);
          setIsCustomTourOpen(false);
        }}
      />
    </div>
  );
}
