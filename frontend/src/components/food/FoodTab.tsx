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
  rating: string;
  category: string;
  badge?: string;
  emoji: string;
  desc: string;
  poiId?: string;
}

export default function FoodTab({ onOpenMap }: FoodTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const foodList: FoodItem[] = [
    {
      id: 'food-1',
      name: 'Ốc Oanh - Phố Ốc Vĩnh Khánh',
      dish: 'Ốc hương rang muối tuyết, càng ghẹ cháy tỏi',
      address: '534 Vĩnh Khánh, Phường 8, Quận 4',
      price: '50.000đ - 180.000đ',
      time: '14:00 - 24:00',
      rating: '4.8 ★',
      category: 'Ốc & Hải sản',
      badge: 'Nổi tiếng nhất',
      emoji: '🐚',
      desc: 'Quán ốc huyền thoại lâu đời bậc nhất Vĩnh Khánh với nước chấm kẹo chua ngọt và hải sản tươi sống nhảy tanh tách.',
      poiId: 'vinh-khanh',
    },
    {
      id: 'food-2',
      name: 'Phá Lấu Bò Cô Thảo',
      dish: 'Phá lấu nước cốt dừa, phá lấu chiên giòn',
      address: '243/29 Tôn Đản, Phường 15, Quận 4',
      price: '30.000đ - 50.000đ',
      time: '13:30 - 22:00',
      rating: '4.7 ★',
      category: 'Phá lấu & Ăn vặt',
      badge: 'Đặc sản Quận 4',
      emoji: '🍲',
      desc: 'Nước dùng sóng sánh thơm nồng mùi nước cốt dừa, chấm bánh mì giòn tan ăn kèm nước mắm tắc chua ngọt đậm đà.',
      poiId: 'cho-200',
    },
    {
      id: 'food-3',
      name: 'Mì Ốc Hến Dì Lan',
      dish: 'Mì tôm ốc hến, hủ tiếu hến chua cay',
      address: '20/23 Ngô Văn Sở, Phường 13, Quận 4',
      price: '25.000đ - 45.000đ',
      time: '07:00 - 19:00',
      rating: '4.6 ★',
      category: 'Mì & Hủ tiếu',
      badge: 'Ăn vặt thần thánh',
      emoji: '🍜',
      desc: 'Tô mì tràn ngập ruột ốc giòn sần sật và hến tươi, hòa quyện với vị nước lèo chua cay xé lưỡi kiểu Thái.',
      poiId: 'cho-200',
    },
    {
      id: 'food-4',
      name: 'Bánh Tráng Cuốn Bà Bắc',
      dish: 'Bánh tráng cuốn bơ sốt me chua cay',
      address: '40 Đường số 11, Phường 4, Quận 4',
      price: '15.000đ - 35.000đ',
      time: '10:00 - 21:30',
      rating: '4.9 ★',
      category: 'Phá lấu & Ăn vặt',
      badge: 'Bestseller sinh viên',
      emoji: '🌯',
      desc: 'Bánh tráng dẻo cuốn đẫm ruốc khô, trứng cút, hành phi giòn béo ngập trong sốt me bơ ngậy gây thương nhớ.',
      poiId: 'cho-200',
    },
    {
      id: 'food-5',
      name: 'Quán Ốc Vũ Vĩnh Khánh',
      dish: 'Sò điệp nướng trứng cút, ốc móng tay xào rau muống',
      address: '37 Vĩnh Khánh, Phường 9, Quận 4',
      price: '40.000đ - 120.000đ',
      time: '15:00 - 01:00 sáng',
      rating: '4.7 ★',
      category: 'Ốc & Hải sản',
      emoji: '🦪',
      desc: 'Không gian mở nhộn nhịp, mồi nhắm phong phú với giá cả bình dân cho các buổi tụ họp bạn bè thâu đêm.',
      poiId: 'vinh-khanh',
    },
    {
      id: 'food-6',
      name: 'Hủ Tiếu Mực Quê Nhà',
      dish: 'Hủ tiếu mực tươi ngọt nước',
      address: 'Bến Vân Đồn, Quận 4',
      price: '45.000đ - 70.000đ',
      time: '06:30 - 22:00',
      rating: '4.5 ★',
      category: 'Mì & Hủ tiếu',
      emoji: '🦑',
      desc: 'Từng con mực ống dày cơm, giòn ngọt tự nhiên kết hợp nước lèo nấu từ củ cải và tôm khô thanh mát.',
      poiId: 'ben-van-don',
    },
    {
      id: 'food-7',
      name: 'Chè Hà Ký Chợ Xóm Chiếu',
      dish: 'Chè mè đen, chè sâm bổ lượng, quy linh cao',
      address: 'Khu ẩm thực Chợ 200 Xóm Chiếu, Quận 4',
      price: '15.000đ - 30.000đ',
      time: '16:00 - 22:30',
      rating: '4.8 ★',
      category: 'Tráng miệng',
      badge: 'Giải nhiệt đêm hè',
      emoji: '🍨',
      desc: 'Điểm kết thúc ngọt ngào cho chuyến food tour Quận 4 với những chén chè thanh mát chuẩn vị người Hoa.',
      poiId: 'cho-200',
    },
  ];

  const categories = useMemo(() => {
    return ['all', 'Ốc & Hải sản', 'Phá lấu & Ăn vặt', 'Mì & Hủ tiếu', 'Tráng miệng'];
  }, []);

  const filteredFood = useMemo(() => {
    return foodList.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.dish.toLowerCase().includes(search.toLowerCase()) ||
        item.desc.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [search, selectedCategory, foodList]);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F8FAFC] pb-28 lg:pb-12 pt-16">
      {/* ─── Hero Food Banner ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white px-4 sm:px-8 py-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-2">
            <span>🔥</span> Thiên đường ẩm thực đường phố Sài Gòn
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ẩm Thực Quận 4: Ăn Là Ghiền!
          </h1>
          <p className="text-xs sm:text-sm text-orange-100 mt-1 max-w-xl">
            Khám phá phố ốc Vĩnh Khánh nức tiếng, phá lấu xóm Chiếu béo ngậy và hàng trăm món ăn vặt đường phố độc đáo.
          </p>

          {/* Ô tìm kiếm món ăn */}
          <div className="mt-5 max-w-md relative">
            <input
              type="text"
              placeholder="Tìm quán ốc, phá lấu, mì hến, bánh tráng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-lg"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ─── Category Filter Pills ────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-3 sticky top-0 z-20 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              {cat === 'all' ? '🍽️ Tất cả món' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Grid món ăn ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Gợi ý {filteredFood.length} địa chỉ ăn uống đỉnh chóp
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFood.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-lg transition p-4 sm:p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl border border-amber-100 shrink-0 group-hover:scale-110 transition">
                      {food.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-gray-900 text-base leading-tight group-hover:text-orange-600 transition">
                          {food.name}
                        </h3>
                        {food.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            {food.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-orange-600 mt-0.5">
                        {food.dish}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
                    {food.rating}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  {food.desc}
                </p>

                {/* Thông tin phụ: Giờ mở cửa, Giá, Địa chỉ */}
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span>💵</span>
                    <span className="font-semibold text-gray-800">{food.price}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>⏰</span>
                    <span>{food.time}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-gray-500 truncate">
                    <span>📍</span>
                    <span className="truncate">{food.address}</span>
                  </div>
                </div>
              </div>

              {/* Nút chỉ đường */}
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-end">
                <button
                  onClick={() => onOpenMap(food.poiId)}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Chỉ đường tới quán</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
