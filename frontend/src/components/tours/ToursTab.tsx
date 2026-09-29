'use client';

import React from 'react';

interface ToursTabProps {
  onOpenMap: (poiId?: string) => void;
}

interface TourStep {
  title: string;
  desc: string;
  duration: string;
  poiId: string;
  address?: string;
}

interface TourItem {
  id: string;
  title: string;
  tagline: string;
  category: string;
  image: string;
  totalTime: string;
  distance: string;
  estimatedCost: string;
  suitableFor: string;
  steps: TourStep[];
}

export default function ToursTab({ onOpenMap }: ToursTabProps) {
  const toursList: TourItem[] = [
    {
      id: 'tour-heritage',
      title: 'Dấu ấn Di sản & Ký ức Sài Gòn',
      tagline: 'Khám phá các công trình thế kỷ bên bờ sông Sài Gòn và kiến trúc thuộc địa.',
      category: 'Lịch sử & Kiến trúc',
      image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
      totalTime: 'Khoảng 2.5 giờ',
      distance: '2.4 km',
      estimatedCost: 'Miễn phí (vé bảo tàng 30.000đ)',
      suitableFor: 'Đi bộ hoặc xe máy, gia đình, người yêu lịch sử',
      steps: [
        {
          title: 'Bến Nhà Rồng (Bảo tàng Hồ Chí Minh)',
          desc: 'Công trình xây dựng năm 1863 mang dấu ấn kiến trúc Đông Dương, nơi lưu giữ tư liệu về hành trình tìm đường cứu nước.',
          duration: '60 phút',
          poiId: 'ben-nha-rong',
          address: '01 Nguyễn Tất Thành, Phường 12',
        },
        {
          title: 'Cầu Mống lịch sử',
          desc: 'Cây cầu đi bộ bằng thép cổ nhất thành phố nối Quận 1 và Quận 4, xây dựng cuối thế kỷ 19 bởi kỹ sư Gustave Eiffel.',
          duration: '30 phút',
          poiId: 'cau-mong',
          address: 'Bến Vân Đồn, giáp Kênh Bến Nghé',
        },
        {
          title: 'Nhà thờ Xóm Chiếu',
          desc: 'Ngôi thánh đường cổ kính giữa khu dân cư lâu đời của Quận 4 với kiến trúc thanh bình và cổ kính.',
          duration: '45 phút',
          poiId: 'xom-chieu',
          address: 'Nguyễn Tất Thành, Phường 13',
        },
      ],
    },
    {
      id: 'tour-food-trail',
      title: 'Hành trình Ẩm thực Đường phố Chiều Tối',
      tagline: 'Oanh tạc các món ăn vặt trứ danh từ Chợ Xóm Chiếu đến Phố Ốc Vĩnh Khánh.',
      category: 'Ẩm thực & Đời sống',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      totalTime: 'Khoảng 3 giờ',
      distance: '1.8 km',
      estimatedCost: '100.000đ - 200.000đ / người',
      suitableFor: 'Nhóm bạn, các tín đồ ẩm thực đường phố',
      steps: [
        {
          title: 'Khu ẩm thực Chợ Xóm Chiếu (Chợ 200)',
          desc: 'Khởi động buổi xế chiều với món phá lấu bò nước dừa nóng hổi và tô mì ốc hến chua cay đậm vị.',
          duration: '45 phút',
          poiId: 'cho-200',
          address: 'Hẻm 200 Xóm Chiếu',
        },
        {
          title: 'Phố Ốc Vĩnh Khánh',
          desc: 'Thưởng thức hải sản tươi sống và không khí ẩm thực đêm nhộn nhịp đặc trưng bậc nhất thành phố.',
          duration: '90 phút',
          poiId: 'vinh-khanh',
          address: 'Trục đường Vĩnh Khánh',
        },
        {
          title: 'Tráng miệng chè & ngắm phố đêm',
          desc: 'Kết thúc chuyến dạo chơi với chén chè thanh mát hoặc ly nước mía sầu riêng mát lạnh.',
          duration: '30 phút',
          poiId: 'cho-200',
          address: 'Khu ẩm thực đêm Xóm Chiếu',
        },
      ],
    },
    {
      id: 'tour-sunset-walk',
      title: 'Tản bộ Chiều Hoàng hôn Ven Kênh Bến Nghé',
      tagline: 'Đón gió sông trong lành và ngắm nhìn toàn cảnh trung tâm thành phố lên đèn.',
      category: 'Thư giãn & Dạo mát',
      image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
      totalTime: 'Khoảng 1.5 giờ',
      distance: '3.0 km',
      estimatedCost: 'Chi phí tự do (cà phê bờ sông)',
      suitableFor: 'Cặp đôi, đi dạo một mình, chụp ảnh phong cảnh',
      steps: [
        {
          title: 'Công viên ven sông Bến Vân Đồn',
          desc: 'Đi dạo dưới hàng cây xanh mát dọc kênh Bến Nghé, ngắm các tòa cao ốc trung tâm phía bờ Quận 1.',
          duration: '45 phút',
          poiId: 'ben-van-don',
          address: 'Tuyến Bến Vân Đồn',
        },
        {
          title: 'Ngắm hoàng hôn từ Cầu Mống',
          desc: 'Thời khắc thành phố lên đèn phản chiếu trên mặt nước là góc ảnh check-in được yêu thích nhất.',
          duration: '45 phút',
          poiId: 'cau-mong',
          address: 'Cầu Mống nối Q1 - Q4',
        },
      ],
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 pb-28 lg:pb-12 pt-16">
      {/* ─── Clean Header ────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Lịch trình được tuyển chọn
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tuyến Tour Khám Phá Quận 4
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Các lộ trình tham quan được sắp xếp logic theo thứ tự địa lý, giúp bạn tối ưu thời gian di chuyển và trải nghiệm trọn vẹn nét văn hóa bản địa.
          </p>
        </div>
      </div>

      {/* ─── Danh sách Tour ──────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {toursList.map((tour, index) => (
          <div
            key={tour.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 overflow-hidden"
          >
            {/* Tour Header Banner with Real Photo */}
            <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-slate-900">
              <img
                src={tour.image}
                alt={tour.title}
                className="w-full h-full object-cover opacity-85 hover:scale-102 transition duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent pointer-events-none" />

              {/* Tag & Index Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="bg-white/95 backdrop-blur-xs text-slate-900 text-xs font-semibold px-3 py-1 rounded-md shadow-xs">
                  {tour.category}
                </span>
                <span className="bg-black/40 backdrop-blur-xs text-white text-xs font-medium px-2.5 py-1 rounded-md">
                  Lộ trình #{index + 1}
                </span>
              </div>

              {/* Title & Tagline in banner */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {tour.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 line-clamp-1">
                  {tour.tagline}
                </p>
              </div>
            </div>

            {/* Tour Overview Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 bg-slate-50/70 border-b border-slate-100 text-xs text-slate-600">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Thời gian</span>
                <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{tour.totalTime}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Quãng đường</span>
                <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{tour.distance}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Dự trù chi phí</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">{tour.estimatedCost}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Phù hợp</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">{tour.suitableFor}</span>
              </div>
            </div>

            {/* Tour Steps Timeline */}
            <div className="p-6 sm:p-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                Các điểm dừng trên tuyến ({tour.steps.length} điểm)
              </h3>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {tour.steps.map((step, sIdx) => (
                  <div key={sIdx} className="relative flex items-start gap-4">
                    {/* Circle Node */}
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 z-10 shadow-xs">
                      {sIdx + 1}
                    </div>

                    {/* Step Card */}
                    <div className="flex-1 bg-white border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-bold text-slate-900 text-sm">
                          {step.title}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded self-start sm:self-auto">
                          Dừng chân {step.duration}
                        </span>
                      </div>

                      {step.address && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {step.address}
                        </p>
                      )}

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {step.desc}
                      </p>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => onOpenMap(step.poiId)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Xem vị trí này</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Nhấn bắt đầu để mở bản đồ và tự động định vị chặng dừng đầu tiên.
                </p>
                <button
                  onClick={() => onOpenMap(tour.steps[0].poiId)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Bắt đầu lộ trình</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
