'use client';

import React from 'react';
import { POI_LIST } from '@/lib/map-data';

interface HomePageProps {
  onOpenMap: (poiId?: string) => void;
}

export default function HomePage({ onOpenMap }: HomePageProps) {
  // Danh sách các tuyến tham quan gợi ý
  const tours = [
    {
      id: 'tour-1',
      title: 'Hành trình di sản Quận 4',
      desc: 'Khám phá dấu ấn lịch sử từ Bến Nhà Rồng qua các công trình tôn giáo lâu đời.',
      stops: '4 điểm dừng',
      time: '45 phút',
      distance: '2.5 km',
      badge: 'Di sản & Lịch sử',
      color: 'from-amber-500 to-orange-600',
      icon: '🏛️',
    },
    {
      id: 'tour-2',
      title: 'Food Tour Xóm Chiếu về đêm',
      desc: 'Oanh tạc thiên đường ẩm thực đường phố: mì ốc hến, phá lấu, bánh tráng, chè...',
      stops: '6 điểm ẩm thực',
      time: '1.5 giờ',
      distance: '1.8 km',
      badge: 'Ẩm thực đường phố',
      color: 'from-rose-500 to-red-600',
      icon: '🍜',
    },
    {
      id: 'tour-3',
      title: 'Hoàng hôn lộng gió Bến Vân Đồn',
      desc: 'Đi dạo ngắm cảnh dọc bờ sông Bến Nghé, ngắm cầu Mống và toàn cảnh skyline Quận 1.',
      stops: '3 điểm ngắm cảnh',
      time: '40 phút',
      distance: '3.0 km',
      badge: 'Thư giãn & Check-in',
      color: 'from-emerald-500 to-teal-600',
      icon: '🌅',
    },
  ];

  // Danh mục ẩm thực tiêu biểu
  const foodHighlights = [
    { name: 'Phố Ốc Vĩnh Khánh', desc: 'Thủ phủ ốc đêm nhộn nhịp, hải sản tươi ngon thơm nức', tag: 'Ốc & Hải sản', rating: '4.8 ★', emoji: '🐚' },
    { name: 'Mì Ốc Hến Dì Lan', desc: 'Nước dùng chua cay đậm đà, ốc hến tươi giòn khó cưỡng', tag: 'Ăn vặt', rating: '4.7 ★', emoji: '🍜' },
    { name: 'Bánh Mì Huỳnh Hoa', desc: 'Bánh mì đầy ắp pate, chả lụa, bơ béo ngậy trứ danh Sài Gòn', tag: 'Bánh mì', rating: '4.9 ★', emoji: '🥪' },
    { name: 'Phá Lấu Bò Cô Oanh', desc: 'Nước cốt dừa thơm béo, chấm bánh mì giòn rụm', tag: 'Đặc sản', rating: '4.6 ★', emoji: '🍲' },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F8FAFC] pb-28 lg:pb-12">
      {/* ─── 1. HERO BANNER ────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white pt-16 pb-12 px-4 sm:px-8 overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-blue-100 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sài Gòn • 31°C Nắng đẹp
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

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 text-xs font-semibold">
              <span className="text-lg">🎧</span>
              <span>Audio Guide GPS tự động</span>
            </div>
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

          <div className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex items-center gap-3 hover:border-blue-200 transition cursor-pointer hover:shadow-lg">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-xl shrink-0">
              🎙️
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900">Tự động phát</h3>
              <p className="text-[10px] text-gray-500">Khi đến bán kính 30m</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex items-center gap-3 hover:border-blue-200 transition cursor-pointer hover:shadow-lg">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">
              📷
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900">Quét mã QR</h3>
              <p className="text-[10px] text-gray-500">Tại trạm & địa danh</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex items-center gap-3 hover:border-blue-200 transition cursor-pointer hover:shadow-lg">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-xl shrink-0">
              📥
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900">Chế độ Offline</h3>
              <p className="text-[10px] text-gray-500">Không cần mạng 4G</p>
            </div>
          </div>
        </div>

        {/* ─── 3. ĐỊA ĐIỂM NỔI BẬT TRÊN BẢN ĐỒ ──────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Địa Điểm Nổi Bật</h2>
              <p className="text-xs text-gray-500">Các điểm đến được yêu thích nhất tại Quận 4</p>
            </div>
            <button
              onClick={() => onOpenMap()}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POI_LIST.map((poi) => (
              <div
                key={poi.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-2xl">
                      {poi.emoji}
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                      {poi.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 mb-1">{poi.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">{poi.desc}</p>
                </div>

                <button
                  onClick={() => onOpenMap(poi.id)}
                  className="w-full bg-slate-50 hover:bg-blue-600 hover:text-white text-gray-700 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>Chỉ đường trên map</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 4. TUYẾN DU LỊCH GỢI Ý ───────────────────────────────── */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Tuyến Tham Quan Đề Xuất</h2>
            <p className="text-xs text-gray-500">Lộ trình được thiết kế tối ưu hóa thời gian và trải nghiệm</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className={`p-4 bg-gradient-to-r ${tour.color} text-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{tour.icon}</span>
                    <span className="text-[10px] bg-black/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                      {tour.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-base leading-tight mb-1">{tour.title}</h3>
                  <p className="text-xs text-white/90 leading-snug line-clamp-2">{tour.desc}</p>
                </div>

                <div className="p-4 bg-white flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                    <span>📍 {tour.stops}</span>
                    <span>⏱️ {tour.time}</span>
                    <span>📏 {tour.distance}</span>
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

        {/* ─── 5. ẨM THỰC ĐẶC SẮC ──────────────────────────────────── */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Thiên Đường Ăn Vặt & Ẩm Thực</h2>
            <p className="text-xs text-gray-500">Hương vị đường phố đậm chất Sài Gòn tại Quận 4</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {foodHighlights.map((food, i) => (
              <div
                key={i}
                className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 hover:border-slate-200 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl shrink-0">
                    {food.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-xs text-gray-900 truncate">{food.name}</h4>
                      <span className="text-[10px] font-bold text-amber-500 shrink-0">{food.rating}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{food.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenMap()}
                  className="shrink-0 p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-600 transition cursor-pointer"
                  title="Xem trên bản đồ"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 6. BANNER GIỚI THIỆU TÍNH NĂNG SMART TOURISM ─────────── */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="max-w-md text-center sm:text-left">
            <span className="text-xs uppercase tracking-wider font-bold text-cyan-400 mb-1 inline-block">Hệ thống du lịch thông minh</span>
            <h3 className="text-xl sm:text-2xl font-extrabold leading-snug mb-2">
              Sẵn sàng khám phá Quận 4 cùng trợ lý âm thanh?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bật GPS và tai nghe, ứng dụng sẽ tự động thì thầm những câu chuyện lịch sử thú vị ngay khi bạn đến gần địa điểm.
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
    </div>
  );
}

