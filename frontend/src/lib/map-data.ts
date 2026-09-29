import { MapPOI } from '@/types';

// Tọa độ trung tâm Quận 4, TP.HCM
export const D4_CENTER: [number, number] = [10.7613, 106.7056];

// Danh sách địa điểm tham quan trên bản đồ
export const POI_LIST: MapPOI[] = [
  {
    id: 'ben-nha-rong',
    name: 'Bến Nhà Rồng (Bảo tàng Hồ Chí Minh)',
    desc: 'Nơi người thanh niên Nguyễn Tất Thành ra đi tìm đường cứu nước năm 1911.',
    category: 'Di tích lịch sử',
    lat: 10.7682,
    lng: 106.7068,
    color: '#e11d48',
    emoji: '🏛️',
  },
  {
    id: 'vinh-khanh',
    name: 'Thiên đường ẩm thực Vĩnh Khánh',
    desc: 'Phố ốc và hải sản sầm uất bậc nhất Sài Gòn, nhộn nhịp từ chiều đến khuya.',
    category: 'Ẩm thực đường phố',
    lat: 10.7589,
    lng: 106.7012,
    color: '#ea580c',
    emoji: '🍲',
  },
  {
    id: 'cho-200',
    name: 'Chợ Xóm Chiếu (Chợ 200)',
    desc: 'Chợ truyền thống lâu đời với khu ẩm thực đường phố và món ăn vặt phong phú.',
    category: 'Chợ - Ẩm thực',
    lat: 10.7615,
    lng: 106.7075,
    color: '#f59e0b',
    emoji: '🛒',
  },
  {
    id: 'xom-chieu',
    name: 'Nhà thờ Xóm Chiếu',
    desc: 'Công trình tôn giáo và kiến trúc lịch sử đặc sắc tại trung tâm Quận 4.',
    category: 'Di tích tôn giáo',
    lat: 10.759,
    lng: 106.708,
    color: '#8b5cf6',
    emoji: '⛪',
  },
  {
    id: 'cau-mong',
    name: 'Cầu Mống',
    desc: 'Cây cầu thép cổ xưa nối liền Quận 1 và Quận 4, điểm ngắm hoàng hôn lý tưởng.',
    category: 'Cảnh quan - Checkin',
    lat: 10.7695,
    lng: 106.7037,
    color: '#0ea5e9',
    emoji: '🌉',
  },
  {
    id: 'ben-van-don',
    name: 'Bến Vân Đồn',
    desc: 'Tuyến đường ven kênh Bến Nghé thoáng mát với nhiều quán cà phê và điểm dạo mát.',
    category: 'Danh thắng',
    lat: 10.764,
    lng: 106.702,
    color: '#10b981',
    emoji: '🌳',
  },
];

