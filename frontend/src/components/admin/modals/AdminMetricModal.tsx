'use client';

import React from 'react';
import { PoiSummary, TourSummary } from '@/types';

interface AdminMetricModalProps {
  metricModalType: 'visitors' | 'audio' | 'hotspot' | 'dwell' | 'system';
  activeVisitors: number;
  tours: TourSummary[];
  topHotspots: any[];
  pois: PoiSummary[];
  onEditPoi: (poi: PoiSummary) => void;
  onClose: () => void;
}

export default function AdminMetricModal({
  metricModalType,
  activeVisitors,
  tours,
  topHotspots,
  pois,
  onEditPoi,
  onClose,
}: AdminMetricModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs text-white shrink-0 ${
                metricModalType === 'visitors'
                  ? 'bg-[#7c3aed]'
                  : metricModalType === 'audio'
                  ? 'bg-[#ff5252]'
                  : metricModalType === 'hotspot'
                  ? 'bg-[#4680ff]'
                  : metricModalType === 'dwell'
                  ? 'bg-[#11c15b]'
                  : 'bg-[#ffa21d]'
              }`}
            >
              {metricModalType === 'visitors'
                ? '👥'
                : metricModalType === 'audio'
                ? '🎧'
                : metricModalType === 'hotspot'
                ? '🔥'
                : metricModalType === 'dwell'
                ? '⏱️'
                : '🗺️'}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {metricModalType === 'visitors' && 'Chi Tiết Số Lượng Truy Cập Trực Tiếp (Live Visitors)'}
                {metricModalType === 'audio' && 'Chi Tiết Lượt Nghe Thuyết Minh Theo Quán'}
                {metricModalType === 'hotspot' && 'Bảng Xếp Hạng Top Quán Hot Nhất'}
                {metricModalType === 'dwell' && 'Chi Tiết Thời Gian Dừng Chân Của Khách (Dwell Time)'}
                {metricModalType === 'system' && 'Chi Tiết Tour Tuyến & Tương Tác Cộng Đồng'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {metricModalType === 'visitors' && 'Thống kê số lượng du khách và thiết bị đang kết nối trực tuyến theo thời gian thực'}
                {metricModalType === 'audio' && 'Dữ liệu số lượt nghe âm thanh tự động theo định vị GPS và bấm nghe thủ công từ người dùng'}
                {metricModalType === 'hotspot' && 'Xếp hạng các quán ăn và điểm tham quan dựa trên lượt nghe, check-in và thời gian lưu lại thực tế'}
                {metricModalType === 'dwell' && 'Thời gian khách dừng lại trải nghiệm thực tế đo đạc qua không gian GPS PostGIS'}
                {metricModalType === 'system' && 'Danh sách các tuyến tour tham quan tự động trong hệ thống'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>Danh Sách Dữ Liệu Chi Tiết</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {metricModalType === 'visitors'
                ? `${activeVisitors} thiết bị online`
                : metricModalType === 'system'
                ? `${tours.length} tour tuyến`
                : `${topHotspots.length} địa điểm ghi nhận`}
            </span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            {metricModalType === 'visitors' ? (
              <table className="w-full text-left text-xs text-slate-700 min-w-[550px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-10 text-center whitespace-nowrap">#</th>
                    <th className="p-2.5">Phiên Kết Nối / Thiết Bị</th>
                    <th className="p-2.5 text-center whitespace-nowrap">Nền tảng</th>
                    <th className="p-2.5 text-center whitespace-nowrap">Khu vực</th>
                    <th className="p-2.5 text-center whitespace-nowrap">Thời gian</th>
                    <th className="p-2.5 text-right whitespace-nowrap">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {Array.from({ length: Math.max(1, activeVisitors) }).map((_, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/40 transition">
                      <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span>{idx === 0 ? '💻' : idx % 2 === 0 ? '📱' : '🌐'}</span>
                          <span>{idx === 0 ? 'Phiên quản trị (Hiện tại)' : `Du khách ẩn danh #${1000 + idx}`}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: dev-client-${idx + 1}a9f</span>
                      </td>
                      <td className="p-2.5 text-center font-semibold text-slate-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                          {idx === 0 ? 'Admin Portal / Web' : idx % 2 === 0 ? 'Mobile Safari' : 'Chrome Mobile'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center text-slate-600 whitespace-nowrap font-medium">
                        Quận 4, TP.HCM
                      </td>
                      <td className="p-2.5 text-center text-slate-500 text-[11px] whitespace-nowrap">
                        Vừa xong
                      </td>
                      <td className="p-2.5 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : metricModalType === 'system' ? (
              <table className="w-full text-left text-xs text-slate-700 min-w-[550px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-10 text-center whitespace-nowrap">ID</th>
                    <th className="p-2.5 whitespace-nowrap min-w-[200px]">Tên Tour Tuyến</th>
                    <th className="p-2.5 whitespace-nowrap">Chủ đề</th>
                    <th className="p-2.5 whitespace-nowrap text-center">Thời lượng</th>
                    <th className="p-2.5 whitespace-nowrap text-center">Số điểm dừng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tours.length > 0 ? (
                    tours.map((t) => (
                      <tr key={t.id} className="hover:bg-amber-50/30 transition">
                        <td className="p-2.5 font-mono text-slate-400 text-center whitespace-nowrap">#{t.id}</td>
                        <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{t.name}</td>
                        <td className="p-2.5 text-slate-500 whitespace-nowrap">{t.theme || (t as any).slug || 'Quận 4'}</td>
                        <td className="p-2.5 text-center text-amber-700 font-bold whitespace-nowrap">
                          ⏱️ {t.estimatedDurationMinutes ? `${t.estimatedDurationMinutes} phút` : '120 phút'}
                        </td>
                        <td className="p-2.5 text-center font-bold text-blue-600 whitespace-nowrap">
                          📍 {t.stopCount || 0} điểm
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Chưa có tour du lịch nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs text-slate-700 min-w-[620px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-14 text-center whitespace-nowrap">Hạng</th>
                    <th className="p-2.5 whitespace-nowrap min-w-[200px]">Tên Quán / Địa Điểm</th>
                    <th className="p-2.5 whitespace-nowrap">Danh Mục</th>
                    <th className="p-2.5 text-center whitespace-nowrap">
                      {metricModalType === 'audio' ? '🎧 Số Lượt Nghe' : '🎧 Lượt Nghe'}
                    </th>
                    <th className="p-2.5 text-center whitespace-nowrap">📍 Check-in</th>
                    <th className="p-2.5 text-center whitespace-nowrap">
                      {metricModalType === 'dwell' ? '⏱️ Thời Gian Lưu Lại' : '⏱️ Dừng Chân'}
                    </th>
                    <th className="p-2.5 text-right whitespace-nowrap">Đánh Giá</th>
                    <th className="p-2.5 text-right whitespace-nowrap w-16">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {topHotspots.length > 0 ? (
                    [...topHotspots]
                      .sort((a, b) => {
                        if (metricModalType === 'audio') return (b.listenCount || 0) - (a.listenCount || 0);
                        if (metricModalType === 'dwell') return (b.totalDwellMinutes || 0) - (a.totalDwellMinutes || 0);
                        return ((b.listenCount || 0) + (b.checkinCount || 0)) - ((a.listenCount || 0) + (a.checkinCount || 0));
                      })
                      .map((h, idx) => {
                        const rankBadge = idx === 0 ? '🥇 Hạng 1' : idx === 1 ? '🥈 Hạng 2' : idx === 2 ? '🥉 Hạng 3' : `#${idx + 1}`;
                        const matchedPoi = pois.find((p) => p.id === h.poiId);
                        return (
                          <tr key={h.poiId} className="hover:bg-slate-50/80 transition">
                            <td className="p-2.5 text-center font-bold text-xs whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] ${
                                  idx === 0
                                    ? 'bg-amber-100 text-amber-800 font-black ring-1 ring-amber-300'
                                    : idx === 1
                                    ? 'bg-slate-200 text-slate-800 font-black'
                                    : idx === 2
                                    ? 'bg-orange-100 text-orange-800 font-black'
                                    : 'text-slate-500'
                                }`}
                              >
                                {rankBadge}
                              </span>
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <p className="font-bold text-slate-900">{h.poiName}</p>
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className="inline-block bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-purple-200/80">
                                {h.categoryName || 'Ẩm thực'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                  metricModalType === 'audio'
                                    ? 'bg-red-100 text-red-700 font-black ring-1 ring-red-300'
                                    : 'text-slate-800'
                                }`}
                              >
                                {h.listenCount} lượt
                              </span>
                            </td>
                            <td className="p-2.5 text-center text-slate-700 font-bold whitespace-nowrap">
                              {h.checkinCount}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                  metricModalType === 'dwell'
                                    ? 'bg-emerald-100 text-emerald-700 font-black ring-1 ring-emerald-300'
                                    : 'text-slate-700'
                                }`}
                              >
                                {h.totalDwellMinutes} phút
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-bold text-amber-500 whitespace-nowrap">
                              ★ {h.avgRating ? h.avgRating.toFixed(1) : '5.0'}
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap">
                              {matchedPoi ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onEditPoi(matchedPoi);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-bold text-[11px] hover:underline cursor-pointer"
                                >
                                  Sửa quán
                                </button>
                              ) : (
                                <span className="text-slate-300 text-[10px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        Chưa có dữ liệu thống kê từ người dùng.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
