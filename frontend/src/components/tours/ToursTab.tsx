'use client';

import React from 'react';

interface ToursTabProps {
  onOpenMap: (poiId?: string) => void;
}

interface TourStep {
  name: string;
  desc: string;
  timeSpent: string;
  poiId: string;
}

interface TourItem {
  id: string;
  title: string;
  tagline: string;
  desc: string;
  badge: string;
  color: string;
  accentBg: string;
  totalTime: string;
  distance: string;
  cost: string;
  emoji: string;
  steps: TourStep[];
}

export default function ToursTab({ onOpenMap }: ToursTabProps) {
  const toursList: TourItem[] = [
    {
      id: 'tour-history',
      title: 'Hành trình Di Sản & Ký Ức Sài Gòn',
      tagline: 'Từ thương cảng thế kỷ 19 đến dấu ấn lịch sử hào hùng',
      desc: 'Tour đi bộ hoặc xe máy qua các công trình trăm tuổi, tìm hiểu về ngày Bác Hồ ra đi tìm đường cứu nước và kiến trúc tôn giáo độc đáo.',
      badge: 'Lịch sử & Văn hóa',
      color: 'from-amber-600 to-rose-600',
      accentBg: 'bg-amber-50 text-amber-700 border-amber-200',
      totalTime: '2 - 3 giờ',
      distance: '2.5 km',
      cost: 'Miễn phí / Vé bảo tàng 30k',
      emoji: '🏛️',
      steps: [
        {
          name: 'Bến Nhà Rồng (Bảo tàng Hồ Chí Minh)',
          desc: 'Chiêm ngưỡng kiến trúc Pháp cổ kính bên sông Sài Gòn và tìm hiểu dấu ấn lịch sử năm 1911.',
          timeSpent: '60 phút',
          poiId: 'ben-nha-rong',
        },
        {
          name: 'Cầu Mống lịch sử',
          desc: 'Cây cầu thép mạ xanh cổ kính do kỹ sư người Pháp thiết kế, nối liền Quận 1 và Quận 4.',
          timeSpent: '30 phút',
          poiId: 'cau-mong',
        },
        {
          name: 'Nhà thờ Xóm Chiếu',
          desc: 'Trung tâm sinh hoạt tôn giáo lâu đời của người dân bản xứ với nét đẹp uy nghiêm trầm mặc.',
          timeSpent: '45 phút',
          poiId: 'xom-chieu',
        },
      ],
    },
    {
      id: 'tour-food',
      title: 'Food Tour "Ăn sập Quận 4" về đêm',
      tagline: 'Thiên đường ẩm thực đường phố: Phá lấu, Mì hến & Phố Ốc',
      desc: 'Tuyến tour ẩm thực được thiết kế cho các tín đồ mê ăn vặt từ xế chiều tới đêm muộn, thưởng thức đủ các món đặc sản trứ danh.',
      badge: 'Ẩm thực & Trải nghiệm',
      color: 'from-rose-500 to-orange-600',
      accentBg: 'bg-rose-50 text-rose-700 border-rose-200',
      totalTime: '3 giờ',
      distance: '1.8 km',
      cost: '100.000đ - 250.000đ / người',
      emoji: '🍲',
      steps: [
        {
          name: 'Khu ẩm thực Chợ Xóm Chiếu (Chợ 200)',
          desc: 'Khởi động với phá lấu bò nóng hổi chấm bánh mì và tô mì ốc hến chua cay đậm vị.',
          timeSpent: '45 phút',
          poiId: 'cho-200',
        },
        {
          name: 'Phố Ốc Vĩnh Khánh xuyên đêm',
          desc: 'Ngập tràn tiếng xèo xèo của chảo ốc mỡ hành tỏi ớt, nhâm nhi các món hải sản tươi sống.',
          timeSpent: '90 phút',
          poiId: 'vinh-khanh',
        },
        {
          name: 'Tráng miệng Chè Hà Ký & Nước mía sầu riêng',
          desc: 'Giải nhiệt với bát chè thanh mát hoặc ly nước mía thơm béo trước khi kết thúc tour.',
          timeSpent: '30 phút',
          poiId: 'cho-200',
        },
      ],
    },
    {
      id: 'tour-sunset',
      title: 'Ngắm Hoàng Hôn Ven Kênh Bến Nghé',
      tagline: 'Lộng gió chiều tà, ngắm nhìn skyline Quận 1 lung linh',
      desc: 'Tuyến đi dạo hoặc đạp xe thư giãn nhất Quận 4, hít thở gió sông trong lành và ngắm thành phố lên đèn.',
      badge: 'Thư giãn & Check-in',
      color: 'from-blue-600 to-teal-500',
      accentBg: 'bg-blue-50 text-blue-700 border-blue-200',
      totalTime: '1.5 giờ',
      distance: '3.2 km',
      cost: 'Chi phí cà phê (30k - 50k)',
      emoji: '🌅',
      steps: [
        {
          name: 'Dạo mát Bến Vân Đồn',
          desc: 'Tuyến đường ven sông rợp bóng cây xanh nhìn thẳng sang tháp tài chính Bitexco.',
          timeSpent: '40 phút',
          poiId: 'ben-van-don',
        },
        {
          name: 'Check-in đón hoàng hôn trên Cầu Mống',
          desc: 'Điểm chụp ảnh sống ảo "quốc dân" của giới trẻ Sài Gòn mỗi buổi chiều tà.',
          timeSpent: '35 phút',
          poiId: 'cau-mong',
        },
      ],
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F8FAFC] pb-28 lg:pb-12 pt-16">
      {/* ─── Hero Section ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white px-4 sm:px-8 py-8 shadow-sm relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-2">
            <span>🗺️</span> Lịch trình gợi ý có sẵn
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Tuyến Tour Khám Phá Quận 4
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            Lịch trình được tối ưu hóa theo thứ tự vị trí địa lý, giúp bạn tiết kiệm thời gian di chuyển và trải nghiệm trọn vẹn nhất.
          </p>
        </div>
      </div>

      {/* ─── Danh sách các Tour ───────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-8">
        {toursList.map((tour, tourIndex) => (
          <div
            key={tour.id}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition duration-300 overflow-hidden"
          >
            {/* Header của Tour */}
            <div className={`p-6 sm:p-7 bg-gradient-to-r ${tour.color} text-white relative`}>
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/20">
                  {tour.badge}
                </span>
                <span className="text-xs font-bold text-white/90">Tour #{tourIndex + 1}</span>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl sm:text-4xl">{tour.emoji}</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black leading-tight">{tour.title}</h2>
                  <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">{tour.tagline}</p>
                </div>
              </div>

              {/* Thông số nhanh */}
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/15 text-center text-xs">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2">
                  <p className="text-[10px] text-white/70">Thời gian</p>
                  <p className="font-extrabold text-sm mt-0.5">{tour.totalTime}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2">
                  <p className="text-[10px] text-white/70">Quãng đường</p>
                  <p className="font-extrabold text-sm mt-0.5">{tour.distance}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2">
                  <p className="text-[10px] text-white/70">Chi phí dự kiến</p>
                  <p className="font-extrabold text-xs sm:text-sm mt-0.5 truncate">{tour.cost}</p>
                </div>
              </div>
            </div>

            {/* Thân thẻ: Danh sách các chặng dừng */}
            <div className="p-6 sm:p-7">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-5">
                Lịch trình chi tiết từng điểm dừng
              </h3>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200">
                {tour.steps.map((step, sIdx) => (
                  <div key={sIdx} className="relative flex items-start gap-4">
                    {/* Số thứ tự tròn */}
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 z-10 shadow-md shadow-blue-500/30">
                      {sIdx + 1}
                    </div>

                    {/* Nội dung điểm đến */}
                    <div className="flex-1 bg-gray-50 hover:bg-blue-50/50 rounded-2xl p-4 border border-gray-100 transition">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm">{step.name}</h4>
                        <span className="text-[11px] font-semibold text-blue-600 bg-white px-2 py-0.5 rounded-lg border border-blue-100">
                          ⏱️ {step.timeSpent}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>

                      <div className="mt-2.5 flex justify-end">
                        <button
                          onClick={() => onOpenMap(step.poiId)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Xem vị trí này trên bản đồ</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nút bấm Khám phá Tour */}
              <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between gap-4">
                <p className="text-xs text-gray-400 hidden sm:block">
                  Bản đồ sẽ tự động định vị điểm dừng đầu tiên
                </p>
                <button
                  onClick={() => onOpenMap(tour.steps[0].poiId)}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer ml-auto"
                >
                  <span>🚀</span>
                  <span>Bắt đầu khám phá tour này</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
