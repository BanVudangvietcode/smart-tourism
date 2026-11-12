export const PIN_EMOJIS = [
  '🍲', '🍢', '🍜', '☕', '🍺', '🏛️', '⛩️', '⛪', '🌉', '📸', '📍', '⭐', '🔥', '🥢', '🍧'
];

export const PIN_COLORS = [
  { label: 'Cam (Ốc / Hải sản)', value: '#ea580c' },
  { label: 'Đỏ (Di tích / Lịch sử)', value: '#e11d48' },
  { label: 'Vàng (Ăn vặt)', value: '#f59e0b' },
  { label: 'Đỏ tươi (Món nước)', value: '#ef4444' },
  { label: 'Nâu (Cà phê)', value: '#78350f' },
  { label: 'Tím (Chùa / Tôn giáo)', value: '#8b5cf6' },
  { label: 'Xanh dương (Cầu / Cảnh quan)', value: '#0ea5e9' },
  { label: 'Xanh lục (Check-in)', value: '#10b981' },
];

export const inferPoiTypeFromCategory = (catName?: string, catSlug?: string): string => {
  const text = `${catSlug || ''} ${catName || ''}`.toLowerCase();
  if (text.includes('di-tich') || text.includes('lich-su') || text.includes('lịch sử') || text.includes('bảo tàng')) return 'HISTORICAL';
  if (text.includes('chua') || text.includes('chùa') || text.includes('ton-giao') || text.includes('tôn giáo') || text.includes('thờ')) return 'RELIGIOUS';
  if (text.includes('cau') || text.includes('cầu') || text.includes('cong-vien') || text.includes('công viên') || text.includes('canh-quan')) return 'SCENIC';
  if (text.includes('check-in') || text.includes('checkin') || text.includes('song') || text.includes('sông')) return 'CHECKIN';
  return 'FOOD';
};
