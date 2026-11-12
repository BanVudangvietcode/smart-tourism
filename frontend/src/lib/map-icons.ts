import L from 'leaflet';

// Icon địa điểm POI
export const createPoiIcon = (colorClass: string, emoji: string) => {
  const isHexOrRgb = colorClass && (colorClass.startsWith('#') || colorClass.startsWith('rgb'));
  const bgStyle = isHexOrRgb ? `style="background-color: ${colorClass};"` : '';
  const cls = isHexOrRgb ? '' : (colorClass || 'bg-blue-600');

  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `<div class="flex flex-col items-center cursor-pointer">
      <div class="w-8 h-8 rounded-full ${cls} flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.25)] border-2 border-white text-sm z-10 relative hover:scale-110 transition-transform" ${bgStyle}>
        ${emoji || '📍'}
      </div>
      <div class="w-2.5 h-2.5 ${cls} rotate-45 -mt-1.5 border-r-2 border-b-2 border-white shadow-xs z-0 relative" ${bgStyle}></div>
    </div>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

// Icon định vị user (kèm vệt sáng đèn pin xoay theo la bàn)
export const createUserLocationIcon = (headingDeg: number) => L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="relative flex items-center justify-center w-32 h-32 transition-transform duration-300 ease-out" style="transform:rotate(${headingDeg}deg)"><div class="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-28 h-32 origin-bottom" style="background:radial-gradient(circle at 50% 100%,rgba(59,130,246,0.4) 0%,transparent 65%);clip-path:polygon(15% 0,85% 0,50% 100%)"></div><div class="absolute w-5 h-5 bg-blue-600 border-[3px] border-white rounded-full shadow-[0_0_15px_rgba(37,99,235,0.7)]"></div></div>`,
  iconSize: [128, 128], iconAnchor: [64, 64],
});

// Icon đích đến (cờ đỏ)
export const createDestinationIcon = () => L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div class="flex flex-col items-center"><div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg border-2 border-white text-white text-sm font-bold z-10">🏁</div><div class="w-2.5 h-2.5 bg-red-600 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white shadow-sm z-0"></div></div>`,
  iconSize: [32, 40], iconAnchor: [16, 40],
});

// Icon điểm dừng trên tuyến tour (đánh số thứ tự 1, 2, 3...)
export const createTourStopIcon = (stopOrder: number, isCurrent = false) => {
  const bgClass = isCurrent
    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 ring-4 ring-orange-300 scale-110 shadow-[0_4px_16px_rgba(249,115,22,0.6)]'
    : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-[0_4px_12px_rgba(79,70,229,0.4)]';
  const tipColor = isCurrent ? '#f97316' : '#9333ea';

  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `<div class="flex flex-col items-center cursor-pointer transition-transform hover:scale-115">
      <div class="w-9 h-9 rounded-full ${bgClass} flex items-center justify-center border-2 border-white text-white font-black text-xs z-10 relative">
        ${stopOrder}
      </div>
      <div class="w-2.5 h-2.5 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white z-0 relative" style="background-color: ${tipColor};"></div>
    </div>`,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
};


