'use client';

import React from 'react';

interface KpiCardsProps {
  activeVisitors: number;
  audioStats: {
    totalListens: number;
    avgListenSeconds: number;
    autoTriggeredListens?: number;
  };
  topHotspots: Array<{ poiName: string; listenCount: number }>;
  dwellStats: {
    totalDwellMinutes: number;
    avgDwellMinutes: number;
    totalDwellEvents?: number;
  };
  systemOverview: {
    totalTours: number;
    totalCheckins: number;
    totalReviews: number;
  };
  onSelectMetric: (type: 'visitors' | 'audio' | 'dwell' | 'system') => void;
}

export default function KpiCards({
  activeVisitors,
  audioStats,
  topHotspots,
  dwellStats,
  systemOverview,
  onSelectMetric,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* CARD 0: PURPLE / INDIGO (Số Truy Cập Hiện Tại - Live Visitors) */}
      <div
        onClick={() => onSelectMetric('visitors')}
        className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
        title="Bấm để xem danh sách lưu lượng truy cập trực tiếp và thiết bị đang kết nối"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Số Truy Cập Hiện Tại</span>
              <span className="text-[11px] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">↗</span>
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <h3 className="text-2xl sm:text-3xl font-black">{activeVisitors}</h3>
              <span className="text-xs text-white/80 font-bold">khách</span>
            </div>
            <p className="text-[11px] font-semibold text-white/90 mt-1 flex items-center gap-1">
              <span className="text-emerald-300 font-bold">● Trực tiếp</span>
              <span className="text-white/70">(Real-time)</span>
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
            👥
          </div>
        </div>
        <div className="mt-3.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
          <span>Web &amp; Di Động</span>
          <span className="underline group-hover:text-white font-bold">Xem chi tiết →</span>
        </div>
      </div>

      {/* CARD 1: RED / CORAL (Total Listens) */}
      <div
        onClick={() => onSelectMetric('audio')}
        className="bg-[#ff5252] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
        title="Bấm để xem danh sách chi tiết lượt nghe âm thanh thuyết minh"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <span>Lượt Nghe Thuyết Minh</span>
              <span className="text-[11px] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">↗</span>
            </p>
            <h3 className="text-2xl sm:text-3xl font-black mt-1">{audioStats.totalListens}</h3>
            <p className="text-[11px] font-semibold text-white/90 mt-1">
              TB: {audioStats.avgListenSeconds}s / lượt nghe
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
            🎧
          </div>
        </div>
        <div className="mt-3.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
          <span>GPS tự động: <b>{audioStats.autoTriggeredListens || 0}</b></span>
          <span className="underline group-hover:text-white font-bold">Xem chi tiết →</span>
        </div>
      </div>

      {/* CARD 2: BLUE (Top Hotspot) */}
      <div
        onClick={() => onSelectMetric('audio')}
        className="bg-[#2d7df6] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
        title="Bấm để xem danh sách các điểm nóng du lịch nghe nhiều nhất"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-1">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <span>Điểm Nóng Ẩm Thực</span>
              <span className="text-[11px] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">↗</span>
            </p>
            <h3 className="text-lg sm:text-xl font-black mt-1 truncate">
              {topHotspots[0]?.poiName || 'Quán Ốc Vũ'}
            </h3>
            <p className="text-[11px] font-semibold text-white/90 mt-1 flex items-center gap-1">
              <span>Được lắng nghe nhiều nhất</span>
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
            🔥
          </div>
        </div>
        <div className="mt-3.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
          <span>{topHotspots[0]?.listenCount || 0} lượt nghe</span>
          <span className="underline group-hover:text-white font-bold">Xem bảng xếp hạng →</span>
        </div>
      </div>

      {/* CARD 3: GREEN (Dwell Time) */}
      <div
        onClick={() => onSelectMetric('dwell')}
        className="bg-[#11c15b] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
        title="Bấm để xem chi tiết thời gian khách lưu lại tại các quán"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <span>Thời Gian Dừng Chân</span>
              <span className="text-[11px] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">↗</span>
            </p>
            <h3 className="text-2xl sm:text-3xl font-black mt-1">{dwellStats.totalDwellMinutes} phút</h3>
            <p className="text-[11px] font-semibold text-white/90 mt-1">
              TB: {dwellStats.avgDwellMinutes} phút / lượt khách
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
            ⏱️
          </div>
        </div>
        <div className="mt-3.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
          <span>{dwellStats.totalDwellEvents || 0} phiên dừng chân</span>
          <span className="underline group-hover:text-white font-bold">Xem chi tiết →</span>
        </div>
      </div>

      {/* CARD 4: ORANGE / AMBER (Tours & Checkins) */}
      <div
        onClick={() => onSelectMetric('system')}
        className="bg-[#ffa21d] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
        title="Bấm để xem danh sách Tour và tương tác cộng đồng"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <span>Tổng Tour & Check-in</span>
              <span className="text-[11px] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">↗</span>
            </p>
            <h3 className="text-2xl sm:text-3xl font-black mt-1">{systemOverview.totalTours} Tour</h3>
            <p className="text-[11px] font-semibold text-white/90 mt-1">
              {systemOverview.totalCheckins} lượt check-in thực tế
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
            🗺️
          </div>
        </div>
        <div className="mt-3.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
          <span>{systemOverview.totalReviews} đánh giá</span>
          <span className="underline group-hover:text-white font-bold">Xem chi tiết →</span>
        </div>
      </div>
    </div>
  );
}
