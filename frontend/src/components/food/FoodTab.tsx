'use client';

import React, { useState, useMemo } from 'react';

interface FoodTabProps {
  onOpenMap: (poiId?: string) => void;
}

interface FoodItem {
  id: string;
  name: string;
  dish: string;
  address: string;
  price: string;
  time: string;
  rating: number;
  reviewsCount: number;
  category: string;
  image: string;
  desc: string;
  poiId?: string;
  tags: string[];
}

export default function FoodTab({ onOpenMap }: FoodTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const foodList: FoodItem[] = [
    {
      id: 'food-1',
      name: 'Ốc Oanh',
      dish: 'Ốc hương rang muối tuyết & Hải sản tươi sống',
      address: '534 Vĩnh Khánh, Phường 8, Quận 4',
      price: '60.000đ - 180.000đ',
      time: '14:00 - 23:30',
      rating: 4.8,
      reviewsCount: 1420,
      category: 'Hải sản & Ốc',
      image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
      desc: 'Quán ốc nổi tiếng nhất trục đường Vĩnh Khánh. Hải sản phong phú, chế biến đậm vị theo phong cách miền Nam.',
      poiId: 'vinh-khanh',
      tags: ['Đông khách', 'Ăn tối', 'Nhóm bạn'],
    },
    {
      id: 'food-2',
      name: 'Phá Lấu Bò Cô Thảo',
      dish: 'Phá lấu nước cốt dừa kèm bánh mì giòn',
      address: '243/29 Tôn Đản, Phường 15, Quận 4',
      price: '35.000đ - 55.000đ',
      time: '13:30 - 22:00',
      rating: 4.7,
      reviewsCount: 890,
      category: 'Món ăn vặt',
      image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
      desc: 'Món ăn vặt trứ danh của cư dân Quận 4. Nước dùng béo thơm mùi dừa xiêm, chấm kèm nước mắm tắc pha ớt cay nồng.',
      poiId: 'cho-200',
      tags: ['Lâu đời', 'Bình dân'],
    },
    {
      id: 'food-3',
      name: 'Mì Ốc Hến Dì Lan',
      dish: 'Mì gói xào ốc hến & Hủ tiếu chua cay',
      address: '20/23 Ngô Văn Sở, Phường 13, Quận 4',
      price: '30.000đ - 45.000đ',
      time: '07:00 - 19:00',
      rating: 4.6,
      reviewsCount: 650,
      category: 'Món sợi',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
      desc: 'Tô mì tràn ngập ruột ốc giòn và thịt hến tươi ngọt. Vị cay nồng kích thích vị giác đặc trưng khu Xóm Chiếu.',
      poiId: 'cho-200',
      tags: ['Ăn sáng / Trưa', 'Đặc sản'],
    },
    {
      id: 'food-4',
      name: 'Bánh Tráng Cuốn Bà Bắc',
      dish: 'Bánh tráng cuốn bơ sốt me chua ngọt',
      address: '40 Đường số 11, Phường 4, Quận 4',
      price: '20.000đ - 35.000đ',
      time: '10:00 - 21:00',
      rating: 4.9,
      reviewsCount: 520,
      category: 'Món ăn vặt',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      desc: 'Quán ăn vặt quen thuộc của học sinh, sinh viên Quận 4 với nước sốt me bơ độc quyền sánh mịn, đậm đà.',
      poiId: 'cho-200',
      tags: ['Ăn vặt', 'Bình dân'],
    },
    {
      id: 'food-5',
      name: 'Quán Ốc Vũ',
      dish: 'Càng ghẹ rang muối & Sò điệp nướng mỡ hành',
      address: '37 Vĩnh Khánh, Phường 9, Quận 4',
      price: '50.000đ - 150.000đ',
      time: '15:00 - 00:30',
      rating: 4.7,
      reviewsCount: 780,
      category: 'Hải sản & Ốc',
      image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
      desc: 'Không gian mở thoáng đãng, phục vụ nhanh. Phù hợp tụ họp bạn bè thưởng thức ẩm thực đêm Sài Gòn.',
      poiId: 'vinh-khanh',
      tags: ['Về đêm', 'Bia & Nhắm'],
    },
    {
      id: 'food-6',
      name: 'Chè Hà Ký Xóm Chiếu',
      dish: 'Chè mè đen, quy linh cao & sâm bổ lượng',
      address: 'Khu ẩm thực Chợ Xóm Chiếu, Quận 4',
      price: '20.000đ - 35.000đ',
      time: '16:00 - 22:30',
      rating: 4.8,
      reviewsCount: 430,
      category: 'Tráng miệng',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      desc: 'Món chè truyền thống nấu thanh ngọt, mát lành, là điểm dừng chân lý tưởng sau chuyến dạo chơi ẩm thực.',
      poiId: 'cho-200',
      tags: ['Ngọt mát', 'Truyền thống'],
    },
  ];

  const categories = useMemo(() => {
    return [
      { id: 'all', label: 'Tất cả' },
      { id: 'Hải sản & Ốc', label: 'Hải sản & Ốc' },
      { id: 'Món ăn vặt', label: 'Món ăn vặt' },
      { id: 'Món sợi', label: 'Mì & Hủ tiếu' },
      { id: 'Tráng miệng', label: 'Tráng miệng' },
    ];
  }, []);

  const filteredFood = useMemo(() => {
    return foodList.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.dish.toLowerCase().includes(search.toLowerCase()) ||
        item.address.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [search, selectedCategory, foodList]);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 pb-28 lg:pb-12 pt-16">
      {/* ─── Modern Clean Header ──────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Cẩm nang ẩm thực địa phương
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Quán Ăn & Đặc Sản Quận 4
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                Khám phá bản đồ hương vị đậm chất Sài Gòn từ các phố ốc đêm nhộn nhịp đến những quán ăn vặt lâu năm trong ngõ hẻm.
              </p>
            </div>

            {/* Clean minimal Search Bar */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Tìm món ăn, quán ăn, tên đường..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Minimalist Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-6 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Grid danh sách món ăn ────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-semibold text-slate-500">
            {filteredFood.length} địa điểm ẩm thực được tuyển chọn
          </span>
        </div>

        {filteredFood.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <p className="text-sm font-semibold text-slate-800">Không tìm thấy địa điểm phù hợp</p>
            <p className="text-xs text-slate-500 mt-1">Vui lòng thử tìm kiếm theo từ khóa hoặc thể loại khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFood.map((food) => (
              <div
                key={food.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Ảnh đại diện sang xịn */}
                  <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Tag thể loại */}
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-xs">
                      {food.category}
                    </span>

                    {/* Điểm đánh giá */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white">
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md text-xs font-bold">
                        <span className="text-amber-400">★</span>
                        <span>{food.rating}</span>
                        <span className="text-white/60 font-normal text-[10px]">({food.reviewsCount})</span>
                      </div>
                    </div>
                  </div>

                  {/* Chi tiết nội dung */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {food.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">
                      {food.dish}
                    </p>

                    <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                      {food.desc}
                    </p>

                    {/* Tags nhỏ */}
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {food.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Metadata: Giờ & Giá */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>{food.price}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        </svg>
                        <span>{food.time}</span>
                      </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-2">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{food.address}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => onOpenMap(food.poiId)}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-800 bg-white hover:bg-slate-900 text-slate-800 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <span>Xem vị trí & chỉ đường</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
