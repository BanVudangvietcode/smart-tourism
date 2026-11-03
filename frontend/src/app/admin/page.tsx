'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
const LocationPickerMap = dynamic(() => import('@/components/map/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs border border-slate-200 gap-2 animate-pulse">
      <span className="text-xl">🗺️</span>
      <span>Đang tải bản đồ định vị...</span>
    </div>
  ),
});

export const PIN_EMOJIS = ['🍲', '🍢', '🍜', '☕', '🍺', '🏛️', '⛩️', '⛪', '🌉', '📸', '📍', '⭐', '🔥', '🥢', '🍧'];

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
import {
  fetchPois,
  fetchPoiDetail,
  fetchPoiMenu,
  fetchTours,
  fetchTourDetail,
  createTour,
  deleteTour,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchPoiTypes,
  createPoiType,
  updatePoiType,
  deletePoiType,
  getDashboardSummary,
  getHeatmap,
  adminCreatePoi,
  adminUpdatePoi,
  adminDeletePoi,
  adminUploadPoiAudio,
  adminScanMenuOcr,
  adminCreateDish,
  adminUpdateDish,
  adminDeleteDish,
  adminBatchImportMenu,
  adminEvictCache,
} from '@/services/api';
import { PoiSummary, PoiDetail, TourSummary, TourDetail, Category, PoiTypeItem, CreateTourInput } from '@/types';

// Hàm suy luận tự động phân loại hệ thống (POI Type) từ danh mục để người dùng không cần chọn thủ công
const inferPoiTypeFromCategory = (catName?: string, catSlug?: string): string => {
  const text = `${catSlug || ''} ${catName || ''}`.toLowerCase();
  if (text.includes('di-tich') || text.includes('lich-su') || text.includes('lịch sử') || text.includes('bảo tàng')) return 'HISTORICAL';
  if (text.includes('chua') || text.includes('chùa') || text.includes('ton-giao') || text.includes('tôn giáo') || text.includes('thờ')) return 'RELIGIOUS';
  if (text.includes('canh-quan') || text.includes('cảnh quan') || text.includes('checkin') || text.includes('check-in') || text.includes('cau') || text.includes('cầu')) return 'LANDMARK';
  if (text.includes('mua-sam') || text.includes('mua sắm') || text.includes('cho') || text.includes('chợ')) return 'MUA_SAM';
  return 'FOOD';
};

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  // Sidebar visibility: hidden by default or toggleable via the 3-dots / hamburger button
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active Navigation & View states
  const [activeSidebar, setActiveSidebar] = useState<'dashboard' | 'pois' | 'menu' | 'tours' | 'users' | 'settings'>('dashboard');
  const [bottomTab, setBottomTab] = useState<'ocr' | 'pois' | 'dishes' | 'cache'>('ocr');
  const [globalSearch, setGlobalSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Auth & Admin Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeVisitors, setActiveVisitors] = useState<number>(1);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [tours, setTours] = useState<TourSummary[]>([]);
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [selectedPoiMenu, setSelectedPoiMenu] = useState<any>(null);

  // Cache Evict State
  const [cacheEvicting, setCacheEvicting] = useState(false);
  const [cachePattern, setCachePattern] = useState('poi:*');

  // AI OCR States
  const [ocrPoiId, setOcrPoiId] = useState<number>(1);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrItems, setOcrItems] = useState<any[]>([]);

  // Categories State & Management Modal
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    iconUrl: '🍲',
  });
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Load danh mục từ Backend API (PostgreSQL database)
  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategoriesList(cats || []);
    } catch (err) {
      console.warn('Lỗi kết nối tải danh mục:', err);
    }
  };

  const handleOpenCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      iconUrl: '🍲',
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name,
      iconUrl: cat.iconUrl || '🍲',
    });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      showNotification('error', 'Vui lòng nhập tên danh mục!');
      return;
    }
    setCategoryLoading(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: categoryFormData.name.trim(),
          iconUrl: categoryFormData.iconUrl,
        });
        showNotification('success', `Đã cập nhật danh mục "${categoryFormData.name}"!`);
      } else {
        await createCategory({
          name: categoryFormData.name.trim(),
          iconUrl: categoryFormData.iconUrl,
        });
        showNotification('success', `Đã thêm danh mục mới "${categoryFormData.name}"!`);
      }
      setEditingCategory(null);
      setCategoryFormData({ name: '', iconUrl: '🍲' });
      await loadCategories();
    } catch (err: any) {
      showNotification('error', `Lỗi lưu danh mục: ${err.message}`);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: number, catName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${catName}"?\nCác quán thuộc danh mục này sẽ được gỡ liên kết an toàn.`)) return;
    try {
      await deleteCategory(catId);
      showNotification('success', `Đã xóa danh mục "${catName}"!`);
      await loadCategories();
      if (poiFormData.categoryId === catId) {
        setPoiFormData((prev) => ({ ...prev, categoryId: categoriesList[0]?.id || 1 }));
      }
    } catch (err: any) {
      showNotification('error', `Lỗi xóa danh mục: ${err.message}`);
    }
  };

  // POI Types State & Management Modal
  const [poiTypesList, setPoiTypesList] = useState<PoiTypeItem[]>([]);
  const [showPoiTypeModal, setShowPoiTypeModal] = useState(false);
  const [editingPoiType, setEditingPoiType] = useState<PoiTypeItem | null>(null);
  const [poiTypeFormData, setPoiTypeFormData] = useState({
    code: '',
    name: '',
    icon: '🍲',
    description: '',
  });
  const [poiTypeLoading, setPoiTypeLoading] = useState(false);

  // Load phân loại từ Backend API (PostgreSQL database)
  const loadPoiTypes = async () => {
    try {
      const types = await fetchPoiTypes();
      setPoiTypesList(types || []);
    } catch (err) {
      console.warn('Lỗi kết nối tải phân loại:', err);
    }
  };

  const handleOpenPoiTypeModal = () => {
    setEditingPoiType(null);
    setPoiTypeFormData({
      code: '',
      name: '',
      icon: '🍲',
      description: '',
    });
    setShowPoiTypeModal(true);
  };

  const handleEditPoiType = (pt: PoiTypeItem) => {
    setEditingPoiType(pt);
    setPoiTypeFormData({
      code: pt.code,
      name: pt.name,
      icon: pt.icon || '🍲',
      description: pt.description || '',
    });
  };

  const handleSavePoiType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poiTypeFormData.name.trim()) {
      showNotification('error', 'Vui lòng nhập tên phân loại!');
      return;
    }
    setPoiTypeLoading(true);
    try {
      if (editingPoiType) {
        await updatePoiType(editingPoiType.code, {
          name: poiTypeFormData.name.trim(),
          icon: poiTypeFormData.icon,
          description: poiTypeFormData.description.trim(),
        });
        showNotification('success', `Đã cập nhật phân loại "${poiTypeFormData.name}"!`);
      } else {
        await createPoiType({
          code: '',
          name: poiTypeFormData.name.trim(),
          icon: poiTypeFormData.icon,
          description: poiTypeFormData.description.trim(),
        });
        showNotification('success', `Đã tạo phân loại mới "${poiTypeFormData.name}"!`);
      }
      setEditingPoiType(null);
      setPoiTypeFormData({ code: '', name: '', icon: '🍲', description: '' });
      await loadPoiTypes();
    } catch (err: any) {
      showNotification('error', `Lỗi lưu phân loại: ${err.message}`);
    } finally {
      setPoiTypeLoading(false);
    }
  };

  const handleDeletePoiType = async (code: string, name: string) => {
    if (code === 'FOOD') {
      showNotification('error', 'Không thể xóa phân loại hệ thống mặc định FOOD!');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa phân loại "${name}" (${code})?\nCác quán thuộc phân loại này sẽ tự động chuyển về mặc định FOOD an toàn.`)) return;
    try {
      await deletePoiType(code);
      showNotification('success', `Đã xóa phân loại "${name}"!`);
      await loadPoiTypes();
      if (poiFormData.poiType === code) {
        setPoiFormData((prev) => ({ ...prev, poiType: 'FOOD' }));
      }
    } catch (err: any) {
      showNotification('error', `Lỗi xóa phân loại: ${err.message}`);
    }
  };

  // Stat Card Metric Detail Modal ('audio' | 'hotspot' | 'dwell' | 'system')
  const [metricModalType, setMetricModalType] = useState<'audio' | 'hotspot' | 'dwell' | 'system' | 'visitors' | null>(null);

  // POI Modal States
  const [showPoiModal, setShowPoiModal] = useState(false);
  const [editingPoi, setEditingPoi] = useState<PoiSummary | null>(null);
  const [poiFormData, setPoiFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    district: 'Quận 4',
    ward: 'Phường 4',
    phone: '0901234567',
    openingHours: '15:00 - 23:00',
    priceRangeMin: 30000,
    priceRangeMax: 150000,
    categoryId: 0,
    poiType: '',
    latitude: 10.7612,
    longitude: 106.7025,
    audioScript: '',
    audioTitle: 'Thuyết minh Quận 4',
    pinEmoji: '📍',
    pinColor: '#ea580c',
  });
  const [poiImageFile, setPoiImageFile] = useState<File | null>(null);
  const [poiAudioFile, setPoiAudioFile] = useState<File | null>(null);

  // Mở modal thêm quán mới
  const openCreatePoiModal = () => {
    setEditingPoi(null);
    const firstCat = categoriesList[0];
    const initialPoiType = firstCat ? inferPoiTypeFromCategory(firstCat.name, firstCat.slug) : (poiTypesList[0]?.code || 'FOOD');
    setPoiFormData({
      name: '',
      slug: '',
      description: '',
      address: '',
      district: 'Quận 4',
      ward: 'Phường 4',
      phone: '0901234567',
      openingHours: '15:00 - 23:00',
      priceRangeMin: 30000,
      priceRangeMax: 150000,
      categoryId: firstCat?.id || 0,
      poiType: initialPoiType,
      latitude: 10.7612,
      longitude: 106.7025,
      audioScript: '',
      audioTitle: 'Thuyết minh Quận 4',
      pinEmoji: firstCat?.iconUrl || '📍',
      pinColor: '#ea580c',
    });
    setPoiImageFile(null);
    setPoiAudioFile(null);
    setShowPoiModal(true);
  };

  // Mở modal sửa quán hiện có
  const openEditPoiModal = async (poi: PoiSummary) => {
    setEditingPoi(poi);
    let desc = '';
    let emoji = '📍';
    let color = '#ea580c';
    let catId = (poi as any).categoryId || categoriesList[0]?.id || 0;

    const matchedCat = categoriesList.find(
      (c) => c.id === (poi as any).categoryId || c.name.toLowerCase() === poi.categoryName?.toLowerCase() || poi.categoryName?.includes(c.name)
    );
    if (matchedCat) {
      catId = matchedCat.id;
      if (matchedCat.iconUrl) emoji = matchedCat.iconUrl;
    }

    try {
      const localPins = JSON.parse(localStorage.getItem('smart_tourism_poi_pins') || '{}');
      if (localPins[poi.id]) {
        if (localPins[poi.id].emoji) emoji = localPins[poi.id].emoji;
        if (localPins[poi.id].color) color = localPins[poi.id].color;
      }
    } catch {}

    try {
      const detail = await fetchPoiDetail(poi.id);
      if (detail && detail.description) {
        desc = detail.description;
        const pinMatch = desc.match(/<!--pin:({.*?})-->/);
        if (pinMatch) {
          try {
            const parsed = JSON.parse(pinMatch[1]);
            if (parsed.emoji) emoji = parsed.emoji;
            if (parsed.color) color = parsed.color;
          } catch {}
        }
        desc = desc.replace(/<!--pin:.*?-->/g, '').trim();
      }
    } catch {
      desc = (poi as any).description || '';
    }

    setPoiFormData({
      name: poi.name,
      slug: poi.slug,
      description: desc,
      address: poi.address,
      district: (poi as any).district || 'Quận 4',
      ward: (poi as any).ward || 'Phường 4',
      phone: (poi as any).phone || '0901234567',
      openingHours: (poi as any).openingHours || '15:00 - 23:00',
      priceRangeMin: poi.priceRangeMin || 30000,
      priceRangeMax: poi.priceRangeMax || 150000,
      categoryId: (poi as any).categoryId || catId,
      poiType: poi.poiType || poiTypesList[0]?.code || '',
      latitude: poi.latitude || 10.7612,
      longitude: poi.longitude || 106.7025,
      audioScript: '',
      audioTitle: '',
      pinEmoji: emoji,
      pinColor: color,
    });
    setPoiImageFile(null);
    setPoiAudioFile(null);
    setShowPoiModal(true);
  };

  // Audio Upload Modal
  const [audioPoiId, setAudioPoiId] = useState<number | null>(null);
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [newAudioTitle, setNewAudioTitle] = useState('Thuyết minh chuẩn Sài Gòn');
  const [newAudioScript, setNewAudioScript] = useState('');

  // Dish Modal States
  const [showDishModal, setShowDishModal] = useState(false);
  const [dishFormData, setDishFormData] = useState({
    name: '',
    categoryName: 'Món chính',
    price: 65000,
    isSignature: true,
    description: 'Món ngon đậm đà truyền thống',
    allergens: 'Không',
    imageUrl: '',
  });

  // Tour Modal States & Handlers
  const [showTourModal, setShowTourModal] = useState(false);
  const [tourSubmitting, setTourSubmitting] = useState(false);
  const [activeDetailTour, setActiveDetailTour] = useState<TourDetail | null>(null);
  const [loadingDetailTourId, setLoadingDetailTourId] = useState<number | null>(null);
  const [tourFormData, setTourFormData] = useState<CreateTourInput>({
    name: '',
    description: '',
    theme: 'FOOD',
    thumbnailUrl: '',
    isPublic: true,
    creatorName: 'Ban Quản Trị Smart Tourism',
    stops: [
      {
        poiId: 1,
        stopOrder: 1,
        estimatedDurationMinutes: 45,
        recommendedDishOrActivity: 'Thưởng thức ẩm thực đặc trưng',
        note: 'Trạm khởi hành',
      },
    ],
  });

  const openCreateTourModal = () => {
    const firstPoi = pois[0];
    const secondPoi = pois[1] || firstPoi;
    setTourFormData({
      name: '',
      description: '',
      theme: 'FOOD',
      thumbnailUrl: firstPoi?.thumbnailUrl || '',
      isPublic: true,
      creatorName: 'Ban Quản Trị Smart Tourism',
      stops: [
        {
          poiId: firstPoi?.id || 1,
          stopOrder: 1,
          estimatedDurationMinutes: 45,
          recommendedDishOrActivity: 'Thưởng thức ẩm thực đặc sắc',
          note: 'Trạm dừng đầu tiên',
        },
        {
          poiId: secondPoi?.id || (firstPoi?.id || 1),
          stopOrder: 2,
          estimatedDurationMinutes: 30,
          recommendedDishOrActivity: 'Tham quan & check-in',
          note: 'Trạm dừng tiếp theo',
        },
      ],
    });
    setShowTourModal(true);
  };

  const handleAddTourStop = () => {
    const nextOrder = tourFormData.stops.length + 1;
    const availablePoi = pois.find((p) => !tourFormData.stops.some((s) => s.poiId === p.id)) || pois[0];
    setTourFormData((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          poiId: availablePoi?.id || 1,
          stopOrder: nextOrder,
          estimatedDurationMinutes: 30,
          recommendedDishOrActivity: 'Tham quan & thưởng thức',
          note: '',
        },
      ],
    }));
  };

  const handleRemoveTourStop = (index: number) => {
    if (tourFormData.stops.length <= 1) {
      showNotification('error', 'Tour phải có ít nhất 1 điểm dừng!');
      return;
    }
    const updated = tourFormData.stops
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, stopOrder: idx + 1 }));
    setTourFormData((prev) => ({ ...prev, stops: updated }));
  };

  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourFormData.name.trim()) {
      showNotification('error', 'Vui lòng nhập tên tuyến tour!');
      return;
    }
    if (tourFormData.stops.length === 0) {
      showNotification('error', 'Vui lòng thêm ít nhất 1 điểm dừng cho tour!');
      return;
    }

    setTourSubmitting(true);
    try {
      await createTour(tourFormData);
      showNotification('success', `Đã tạo tuyến tour "${tourFormData.name}" thành công!`);
      setShowTourModal(false);
      const updatedTours = await fetchTours();
      setTours(updatedTours);
    } catch (err: any) {
      showNotification('error', `Lỗi tạo tour: ${err.message}`);
    } finally {
      setTourSubmitting(false);
    }
  };

  const handleDeleteTour = async (tourId: number, tourName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tuyến tour "${tourName}"?\nThao tác này sẽ xóa vĩnh viễn tour và các trạm dừng liên quan.`)) return;
    try {
      await deleteTour(tourId);
      showNotification('success', `Đã xóa tuyến tour "${tourName}"!`);
      const updatedTours = await fetchTours();
      setTours(updatedTours);
    } catch (err: any) {
      showNotification('error', `Lỗi xóa tour: ${err.message}`);
    }
  };

  const handleViewTourDetail = async (tourId: number) => {
    setLoadingDetailTourId(tourId);
    try {
      const detail = await fetchTourDetail(tourId);
      setActiveDetailTour(detail);
    } catch (err: any) {
      showNotification('error', `Lỗi tải chi tiết tour: ${err.message}`);
    } finally {
      setLoadingDetailTourId(null);
    }
  };

  // Auto dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  // Initialize Admin Session & Fetch Data (Chế độ quyền bình thường / không bắt buộc đăng nhập)
  useEffect(() => {
        if (authLoading) return;
    
    if (user?.role !== 'ADMIN') {
        setLoading(false);
        setDashboardData(null);
        setHeatmapData(null);
        return;
    }
    const initData = async () => {
      setLoading(true);
      try {
        // Tải dữ liệu thống kê, heatmap, POIs, tour, categories và poi types
        const [statsRes, heatRes, poiList, tourList, catList, poiTypeList] = await Promise.all([
          getDashboardSummary().catch(() => null),
          getHeatmap().catch(() => null),
          fetchPois().catch(() => []),
          fetchTours().catch(() => []),
          fetchCategories().catch(() => []),
          fetchPoiTypes().catch(() => []),
        ]);

        if (statsRes) setDashboardData(statsRes);
        if (heatRes) setHeatmapData(heatRes);
        setCategoriesList(catList || []);
        setPoiTypesList(poiTypeList || []);
        if (poiList) {
          setPois(poiList);
          if (poiList.length > 0) {
            setSelectedPoiId(poiList[0].id);
            setOcrPoiId(poiList[0].id);
          }
        }
        if (tourList) setTours(tourList);
      } catch (err: any) {
        showNotification('error', `Lỗi kết nối: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [authLoading, user?.role]);

  // Kết nối Server-Sent Events (SSE) theo thời gian thực - PUSH trực tiếp từ server, không cần polling 10s
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/visitors');

      const handleVisitorEvent = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data.activeVisitors === 'number') {
            setActiveVisitors(data.activeVisitors);
          }
        } catch {
          // ignore
        }
      };

      eventSource.addEventListener('visitors', handleVisitorEvent);
      eventSource.onmessage = handleVisitorEvent;

      eventSource.onerror = () => {
        // Trình duyệt tự động kết nối lại theo chuẩn SSE
      };
    } catch (e) {
      console.warn('Không thể khởi tạo EventSource SSE:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Fetch POI Menu when selected POI changes
  useEffect(() => {
    if (!selectedPoiId) return;
    fetchPoiMenu(selectedPoiId)
      .then((data) => setSelectedPoiMenu(data))
      .catch(() => setSelectedPoiMenu(null));
  }, [selectedPoiId]);

  // Quick Cache Evict Action
  const handleQuickCacheEvict = async () => {
    setCacheEvicting(true);
    try {
      await Promise.all([
        adminEvictCache('poi:*'),
        adminEvictCache('menu:*'),
        adminEvictCache('tour:*'),
      ]);
      showNotification('success', '⚡ Đã xóa sạch Redis Cache (poi:*, menu:*, tour:*)!');
    } catch (err: any) {
      showNotification('error', `Lỗi xóa cache: ${err.message}`);
    } finally {
      setCacheEvicting(false);
    }
  };

  // AI OCR Scan
  const handleScanMenuOcr = async (fileToScan?: File) => {
    const targetFile = fileToScan || ocrFile;
    if (!targetFile) {
      showNotification('error', 'Vui lòng chọn ảnh thực đơn để AI quét!');
      return;
    }
    setOcrLoading(true);
    try {
      const res = await adminScanMenuOcr(ocrPoiId, targetFile);
      const dishesList = res?.detectedDishes || res?.dishes || [];
      if (dishesList.length > 0) {
        setOcrItems(
          dishesList.map((d: any, idx: number) => ({
            ...d,
            id: `ocr-${Date.now()}-${idx}`,
            selected: true,
          }))
        );
        showNotification('success', `✨ AI Gemini Flash đã nhận diện ${dishesList.length} món ăn! (${res.poiName || ''})`);
      } else {
        showNotification('info', res?.note || 'Không nhận diện được món ăn nào từ ảnh.');
      }
    } catch (err: any) {
      showNotification('error', `Lỗi quét menu: ${err.message}`);
    } finally {
      setOcrLoading(false);
    }
  };

  // Save selected OCR items to menu
  const handleSaveOcrDishes = async () => {
    const selected = ocrItems.filter((i) => i.selected);
    if (selected.length === 0) {
      showNotification('error', 'Chưa có món nào được chọn để lưu!');
      return;
    }
    try {
      for (const item of selected) {
        await adminCreateDish(ocrPoiId, {
          name: item.name,
          categoryName: item.categoryName || 'Món đặc trưng',
          price: Number(item.price) || 50000,
          isSignature: Boolean(item.isSignature),
          description: item.description || 'Món ăn trích xuất tự động qua AI OCR Gemini Flash',
          allergens: item.allergens || 'Không',
        });
      }
      showNotification('success', `🎉 Đã lưu thành công ${selected.length} món vào thực đơn quán!`);
      setOcrItems([]);
      setOcrFile(null);
      fetchPoiMenu(ocrPoiId).then((data) => setSelectedPoiMenu(data));
    } catch (err: any) {
      showNotification('error', `Lỗi lưu món: ${err.message}`);
    }
  };

  // Save POI (Create or Update)
  const handleSavePoi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanDesc = (poiFormData.description || '').replace(/<!--pin:.*?-->/g, '').trim();
      const fullDesc = `${cleanDesc}\n<!--pin:{"emoji":"${poiFormData.pinEmoji}","color":"${poiFormData.pinColor}"}-->`;

      const formData = new FormData();
      formData.append('name', poiFormData.name);
      formData.append('slug', poiFormData.slug || poiFormData.name.toLowerCase().replace(/\s+/g, '-'));
      formData.append('description', fullDesc);
      formData.append('address', poiFormData.address);
      formData.append('district', poiFormData.district);
      formData.append('ward', poiFormData.ward);
      formData.append('phone', poiFormData.phone);
      formData.append('openingHours', poiFormData.openingHours);
      formData.append('priceRangeMin', poiFormData.priceRangeMin.toString());
      formData.append('priceRangeMax', poiFormData.priceRangeMax.toString());
      formData.append('categoryId', poiFormData.categoryId.toString());
      formData.append('poiType', poiFormData.poiType);
      formData.append('latitude', poiFormData.latitude.toString());
      formData.append('longitude', poiFormData.longitude.toString());
      formData.append('audioScript', poiFormData.audioScript);
      formData.append('audioTitle', poiFormData.audioTitle);

      if (poiImageFile) formData.append('image', poiImageFile);
      if (poiAudioFile) formData.append('audio', poiAudioFile);

      let savedId: number | null = null;
      if (editingPoi) {
        await adminUpdatePoi(editingPoi.id, {
          ...poiFormData,
          description: fullDesc,
        });
        savedId = editingPoi.id;
        showNotification('success', `Đã cập nhật quán: ${poiFormData.name}`);
      } else {
        const res = await adminCreatePoi(formData);
        savedId = res?.id || null;
        showNotification('success', `Đã tạo quán mới: ${poiFormData.name}`);
      }

      // Lưu cài đặt ghim vào localStorage để hiển thị tức thì trên Map
      if (savedId) {
        try {
          const localPins = JSON.parse(localStorage.getItem('smart_tourism_poi_pins') || '{}');
          localPins[savedId] = { emoji: poiFormData.pinEmoji, color: poiFormData.pinColor };
          localStorage.setItem('smart_tourism_poi_pins', JSON.stringify(localPins));
        } catch {}
      }

      setShowPoiModal(false);
      setEditingPoi(null);
      const updated = await fetchPois();
      setPois(updated);
    } catch (err: any) {
      showNotification('error', `Lỗi lưu POI: ${err.message}`);
    }
  };

  // Delete POI
  const handleDeletePoi = async (poiId: number, poiName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa quán "${poiName}"?`)) return;
    try {
      await adminDeletePoi(poiId);
      showNotification('success', `Đã xóa quán "${poiName}"`);
      setPois((prev) => prev.filter((p) => p.id !== poiId));
    } catch (err: any) {
      showNotification('error', `Lỗi xóa: ${err.message}`);
    }
  };

  // Upload Audio for POI
  const handleUploadAudio = async () => {
    if (!audioPoiId || !newAudioFile) {
      showNotification('error', 'Vui lòng chọn file âm thanh MP3!');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('audio', newAudioFile);
      formData.append('title', newAudioTitle);
      formData.append('script', newAudioScript);

      await adminUploadPoiAudio(audioPoiId, formData);
      showNotification('success', 'Đã tải lên audio thuyết minh thành công!');
      setAudioPoiId(null);
      setNewAudioFile(null);
    } catch (err: any) {
      showNotification('error', `Lỗi tải audio: ${err.message}`);
    }
  };

  // Create Single Dish
  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoiId) return;
    try {
      await adminCreateDish(selectedPoiId, dishFormData);
      showNotification('success', `Đã thêm món "${dishFormData.name}" vào thực đơn!`);
      setShowDishModal(false);
      const updatedMenu = await fetchPoiMenu(selectedPoiId);
      setSelectedPoiMenu(updatedMenu);
    } catch (err: any) {
      showNotification('error', `Lỗi thêm món: ${err.message}`);
    }
  };

  // Filter POIs based on search input
  const filteredPois = useMemo(() => {
    if (!globalSearch.trim()) return pois;
    const q = globalSearch.toLowerCase();
    return pois.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q)
    );
  }, [pois, globalSearch]);

  // Extract all dishes from current POI menu
  const currentDishes = useMemo(() => {
    if (!selectedPoiMenu || !selectedPoiMenu.categories) return [];
    return selectedPoiMenu.categories.flatMap((c: any) =>
      c.dishes.map((d: any) => ({ ...d, categoryName: c.categoryName }))
    );
  }, [selectedPoiMenu]);

  // Metrics: Lấy trực tiếp 100% từ Database PostgreSQL, nếu chưa tải xong thì để 0 / mảng rỗng
  const audioStats = dashboardData?.audioStats || {
    totalListens: 0,
    completedListens: 0,
    completionRate: 0,
    totalListenMinutes: 0,
    avgListenSeconds: 0,
    autoTriggeredListens: 0,
    manualTriggeredListens: 0,
  };

  const dwellStats = dashboardData?.dwellStats || {
    totalDwellEvents: 0,
    totalDwellMinutes: 0,
    avgDwellMinutes: 0,
  };

  const topHotspots = dashboardData?.topHotspots || [];

  const systemOverview = dashboardData?.systemOverview || {
    totalTours: 0,
    avgTourDurationMinutes: 0,
    totalCheckins: 0,
    totalReviews: 0,
    totalFavorites: 0,
    activeVisitors: 1,
  };
  // Kiểm tra trạng thái đăng nhập
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }
  
  // Kiểm tra quyền ADMIN
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">
          Bạn không có quyền truy cập
        </h1>
  
        <p>Vui lòng đăng nhập bằng tài khoản quản trị viên.</p>
  
        <Link href="/login">Đăng nhập</Link>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-800 flex flex-col font-sans antialiased">
      {/* ========================================================================= */}
      {/* 1. TOPBAR (Flash Able White Style): Toggle Button | Logo | Search | Cache | Profile */}
      {/* ========================================================================= */}
      <header className="h-16 bg-white border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40 shadow-xs">
        {/* Left Section: Nút 3 chấm / Menu (☰ / ···) + Logo FoodTour Q4 */}
        <div className="flex items-center gap-3">
          {/* NÚT 3 CHẤM / TOGGLE MENU CHÍNH (Bấm để ẩn / hiện thanh menu) */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer border border-slate-200 shadow-xs"
            title="Bấm để ẩn / hiện thanh menu quản trị"
          >
            {isSidebarOpen ? (
              <span className="text-base font-black">✕</span>
            ) : (
              <div className="flex flex-col gap-1 items-center justify-center">
                <span className="w-4 h-0.5 bg-slate-700 rounded-full"></span>
                <span className="w-4 h-0.5 bg-slate-700 rounded-full"></span>
                <span className="w-4 h-0.5 bg-slate-700 rounded-full"></span>
              </div>
            )}
          </button>

          {/* Logo FoodTour Q4 */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-base shadow-sm">
              🍲
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                  FoodTour Q4
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none hidden sm:block">Flash Able Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Center: Search Bar (Flash Able Input Style) */}
        <div className="flex-1 max-w-md mx-2 hidden sm:block">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              suppressHydrationWarning
              autoComplete="off"
              spellCheck={false}
              data-gramm="false"
              data-enable-grammarly="false"
              placeholder="Tìm kiếm quán ăn, món ăn, tour, tọa độ..."
              className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Quick Cache Evict Button | Admin Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Cache Evict Button */}
          <button
            onClick={handleQuickCacheEvict}
            disabled={cacheEvicting}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            title="Xóa nhanh Redis cache cho POIs, Thực đơn và Tour"
          >
            <span className={cacheEvicting ? 'animate-spin' : ''}>⚡</span>
            <span className="hidden md:inline">
              {cacheEvicting ? 'Đang xóa...' : 'Xóa Cache'}
            </span>
          </button>

          {/* User Profile (Chế độ quyền bình thường) */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                👤
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
            <div className="hidden lg:block text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-800 leading-none">Quyền Bình Thường</p>
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-semibold border border-slate-200">
                  Khách
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Không yêu cầu đăng nhập</p>
            </div>
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition text-xs font-bold"
              title="Về ứng dụng du khách"
            >
              🌐
            </Link>
          </div>
        </div>
      </header>

      {/* Global Toast Alert */}
      {toast && (
        <div
          className={`fixed top-18 right-4 z-50 px-4 py-2.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-blue-50 text-blue-800 border-blue-300'
          }`}
        >
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-700 text-xs">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BODY LAYOUT: COLLAPSIBLE SIDEBAR + MAIN CONTENT AREA                   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Backdrop overlay for mobile drawer */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40 transition-opacity"
          />
        )}

        {/* ======================================================================= */}
        {/* COLLAPSIBLE SIDEBAR (Hidden by default, slides out when clicking ☰/···) */}
        {/* ======================================================================= */}
        <aside
          className={`fixed top-16 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header of Sidebar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Menu Quản Trị
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'KPI & Biểu đồ' },
              { id: 'pois', label: 'Quán & POI', icon: '📍', desc: `${pois.length} địa điểm` },
              { id: 'menu', label: 'Thực Đơn', icon: '🍲', desc: 'Món ăn & AI OCR' },
              { id: 'tours', label: 'Tour', icon: '🗺️', desc: `${tours.length} tuyến hành trình` },
              { id: 'users', label: 'Người Dùng', icon: '👤', desc: 'Khách du lịch' },
              { id: 'settings', label: 'Thao Tác', icon: '⚙️', desc: 'Cache & Hạ tầng' },
            ].map((item) => {
              const active = activeSidebar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id as any);
                    setIsSidebarOpen(false); // Auto close on select
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-normal ${
                      active ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* System Status in Sidebar Footer */}
          <div className="p-3.5 m-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Spring Boot:</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 8080 OK
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">PostGIS Engine:</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Redis Cache:</span>
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> 6379 OK
              </span>
            </div>
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* MAIN CONTENT AREA (Takes full width when sidebar is collapsed)          */}
        {/* ======================================================================= */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Quick Breadcrumb / Banner */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {/* Quick toggle indicator */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>☰</span>
                <span className="hidden sm:inline">Mở </span>
                <span>Menu</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-700 capitalize truncate">
                {activeSidebar === 'dashboard' ? 'Tổng Quan Dashboard' : activeSidebar}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden md:inline shrink-0">
              Cập nhật dữ liệu thời gian thực từ PostGIS & Redis
            </span>
          </div>

          {/* ===================================================================== */}
          {/* VIEW: DASHBOARD (Matching Image 2: Flash Able 4 Colorful KPI Cards)   */}
          {/* ===================================================================== */}
          {activeSidebar === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              {/* ───────────────────────────────────────────────────────────────── */}
              {/* 5 COLORFUL KPI CARDS (Live Visitors | Red | Blue | Green | Orange) */}
              {/* ───────────────────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* CARD 0: PURPLE / INDIGO (Số Truy Cập Hiện Tại - Live Visitors) */}
                <div
                  onClick={() => setMetricModalType('visitors')}
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
                  onClick={() => setMetricModalType('audio')}
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
                    <span>GPS tự động: <b>{audioStats.autoTriggeredListens}</b></span>
                    <span className="underline group-hover:text-white font-bold">Xem chi tiết →</span>
                  </div>
                </div>

                {/* CARD 2: BLUE (Top Hotspot / Orders) */}
                <div
                  onClick={() => setMetricModalType('hotspot')}
                  className="bg-[#4680ff] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
                  title="Bấm để xem danh sách bảng xếp hạng Top quán hot nhất"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                        <span>Top Quán Hot</span>
                        <span className="text-[11px] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">↗</span>
                      </p>
                      <h3 className="text-lg sm:text-xl font-black mt-1 truncate">
                        {topHotspots[0]?.poiName || 'Chưa có dữ liệu'}
                      </h3>
                      <p className="text-[11px] font-semibold text-white/90 mt-1 truncate">
                        {topHotspots[0]?.categoryName || '—'}
                      </p>
                    </div>
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                      🔥
                    </div>
                  </div>
                  <div className="mt-3.5 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
                    <span>{topHotspots[0]?.listenCount || 0} lượt nghe</span>
                    <span className="underline group-hover:text-white font-bold">Xem bảng xếp hạng →</span>
                  </div>
                </div>

                {/* CARD 3: GREEN (Dwell Time / Thời gian dừng chân) */}
                <div
                  onClick={() => setMetricModalType('dwell')}
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
                    <span>{dwellStats.totalDwellEvents} phiên dừng chân</span>
                    <span className="underline group-hover:text-white font-bold">Xem chi tiết →</span>
                  </div>
                </div>

                {/* CARD 4: ORANGE / AMBER (Tours & Checkins) */}
                <div
                  onClick={() => setMetricModalType('system')}
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

              {/* ───────────────────────────────────────────────────────────────── */}
              {/* BOTTOM ROW: [📋 Bảng Danh Sách / Form Nhập Liệu / Quy Trình AI OCR] */}
              {/* ───────────────────────────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Bottom Header Tabs */}
                <div className="border-b border-slate-200 bg-slate-50/70 p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📋</span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-800">
                      Khu Vực Thao Tác & Quản Trị Dữ Liệu
                    </h3>
                  </div>

                  {/* Scrollable Tabs on mobile with clean compact pills */}
                  <div className="w-full sm:w-auto overflow-x-auto no-scrollbar -mx-1 px-1">
                    <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl w-max sm:w-auto">
                      <button
                        onClick={() => setBottomTab('ocr')}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          bottomTab === 'ocr'
                            ? 'bg-white text-purple-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>🤖</span>
                        <span className="hidden sm:inline">Quy Trình Duyệt </span>
                        <span>AI OCR</span>
                      </button>
                      <button
                        onClick={() => setBottomTab('pois')}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          bottomTab === 'pois'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>📍</span>
                        <span className="hidden sm:inline">Bảng </span>
                        <span>POI & Audio</span>
                      </button>
                      <button
                        onClick={() => setBottomTab('dishes')}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          bottomTab === 'dishes'
                            ? 'bg-white text-amber-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>🍲</span>
                        <span>Thực Đơn</span>
                      </button>
                      <button
                        onClick={() => setBottomTab('cache')}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          bottomTab === 'cache'
                            ? 'bg-white text-rose-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>⚡</span>
                        <span>Cache</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* TAB 1: AI OCR SCANNER (Gemini 1.5 Flash) */}
                {bottomTab === 'ocr' && (
                  <div className="p-3 sm:p-5 space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-sm">
                          ✨
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-extrabold text-purple-950 truncate">
                            Gemini 1.5 Flash Menu OCR Scanner
                          </h4>
                          <p className="text-[11px] text-purple-800 leading-snug mt-0.5">
                            Chụp ảnh thực đơn hoặc menu giấy → AI tự động bóc tách tên món, giá tiền, danh mục → Duyệt 1 chạm vào database.
                          </p>
                        </div>
                      </div>

                      <div className="w-full md:w-auto shrink-0 mt-1 md:mt-0">
                        <select
                          value={ocrPoiId}
                          onChange={(e) => setOcrPoiId(Number(e.target.value))}
                          className="w-full md:w-64 bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-purple-900 font-semibold focus:outline-none focus:border-purple-500 shadow-xs truncate"
                        >
                          {pois.map((p) => (
                            <option key={p.id} value={p.id}>
                              Quán: {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Upload and Scan Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                      <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-3 text-center cursor-pointer transition bg-slate-50/50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <span className="text-xs text-slate-600 font-medium truncate block">
                          {ocrFile ? `📁 ${ocrFile.name}` : '📷 Bấm để chọn ảnh thực đơn hoặc kéo thả...'}
                        </span>
                      </label>

                      <button
                        onClick={() => handleScanMenuOcr()}
                        disabled={ocrLoading || !ocrFile}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                      >
                        {ocrLoading ? <span className="animate-spin">🔄</span> : '✨'}
                        <span>{ocrLoading ? 'AI Đang Quét...' : 'Quét Menu Bằng AI'}</span>
                      </button>

                      {ocrItems.length > 0 && (
                        <button
                          onClick={handleSaveOcrDishes}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                        >
                          <span>💾</span>
                          <span>Lưu {ocrItems.filter((i) => i.selected).length} Món Vào Quán</span>
                        </button>
                      )}
                    </div>

                    {/* Scanned Dishes Table */}
                    {ocrItems.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="p-3 w-10 text-center whitespace-nowrap">Duyệt</th>
                              <th className="p-3 whitespace-nowrap min-w-[200px]">Tên món ăn & Mô tả AI</th>
                              <th className="p-3 whitespace-nowrap">Danh mục</th>
                              <th className="p-3 whitespace-nowrap">Đơn giá (VNĐ)</th>
                              <th className="p-3 whitespace-nowrap">Món đặc trưng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {ocrItems.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-purple-50/30 transition">
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={item.selected}
                                    onChange={(e) => {
                                      const next = [...ocrItems];
                                      next[idx].selected = e.target.checked;
                                      setOcrItems(next);
                                    }}
                                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                                  />
                                </td>
                                <td className="p-3 font-bold text-slate-900">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => {
                                      const next = [...ocrItems];
                                      next[idx].name = e.target.value;
                                      setOcrItems(next);
                                    }}
                                    className="bg-transparent border-b border-dashed border-slate-300 focus:border-purple-500 focus:outline-none w-full font-bold"
                                  />
                                  {item.description && (
                                    <p className="text-[10px] text-slate-500 font-normal italic mt-0.5 max-w-sm truncate">
                                      {item.description}
                                    </p>
                                  )}
                                  {item.allergens && item.allergens !== 'Không' && (
                                    <span className="inline-block text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded mt-1 font-semibold">
                                      ⚠️ {item.allergens}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={item.categoryName || 'Món chính'}
                                    onChange={(e) => {
                                      const next = [...ocrItems];
                                      next[idx].categoryName = e.target.value;
                                      setOcrItems(next);
                                    }}
                                    className="bg-transparent border-b border-dashed border-slate-300 focus:border-purple-500 focus:outline-none text-slate-600"
                                  />
                                </td>
                                <td className="p-3 text-emerald-600 font-bold">
                                  <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => {
                                      const next = [...ocrItems];
                                      next[idx].price = Number(e.target.value);
                                      setOcrItems(next);
                                    }}
                                    className="bg-transparent border-b border-dashed border-slate-300 focus:border-purple-500 focus:outline-none w-28 text-emerald-600 font-bold"
                                  />
                                  <span>đ</span>
                                </td>
                                <td className="p-3">
                                  <button
                                    onClick={() => {
                                      const next = [...ocrItems];
                                      next[idx].isSignature = !next[idx].isSignature;
                                      setOcrItems(next);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      item.isSignature
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {item.isSignature ? '⭐ Signature' : 'Thường'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Tải lên ảnh menu để kích hoạt quy trình trích xuất tự động qua Gemini 1.5 Flash.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: POI TABLE */}
                {bottomTab === 'pois' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        Hiển thị {filteredPois.length} địa điểm ẩm thực & di tích Quận 4
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleOpenCategoryModal}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold text-xs px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="Thêm, sửa hoặc xóa danh mục điểm đến"
                        >
                          <span>🏷️</span>
                          <span>Quản Lý Danh Mục</span>
                        </button>
                        <button
                          onClick={handleOpenPoiTypeModal}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-xs px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="Thêm, sửa hoặc xóa phân loại hệ thống (POI Types)"
                        >
                          <span>🧭</span>
                          <span>Quản Lý Phân Loại</span>
                        </button>
                        <button
                          onClick={openCreatePoiModal}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>+ Thêm Quán / POI Mới</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs text-slate-700 min-w-[820px]">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="p-3 w-14 text-center whitespace-nowrap">ID</th>
                            <th className="p-3 whitespace-nowrap min-w-[240px]">Tên quán & Địa chỉ</th>
                            <th className="p-3 whitespace-nowrap min-w-[150px]">Danh mục</th>
                            <th className="p-3 whitespace-nowrap">Tọa độ PostGIS</th>
                            <th className="p-3 whitespace-nowrap">Audio Thuyết Minh</th>
                            <th className="p-3 text-right whitespace-nowrap w-28">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredPois.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-mono text-slate-400 text-center whitespace-nowrap">#{p.id}</td>
                              <td className="p-3 min-w-[240px]">
                                <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                                <p className="text-[11px] text-slate-500 truncate max-w-sm">{p.address}</p>
                              </td>
                              <td className="p-3 whitespace-nowrap min-w-[150px]">
                                <span className="inline-block whitespace-nowrap bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-purple-200/80 shadow-2xs">
                                  {p.categoryName || 'Ẩm thực'}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-blue-600 whitespace-nowrap">
                                📍 {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {(p as any).hasAudio || (p as any).audioUrl ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                                    <span>🎧</span> Có MP3
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setAudioPoiId(p.id);
                                      setNewAudioTitle(`Thuyết minh ${p.name}`);
                                    }}
                                    className="text-amber-600 hover:underline text-[11px] font-bold cursor-pointer"
                                  >
                                    + Thêm MP3
                                  </button>
                                )}
                              </td>
                              <td className="p-3 text-right space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setAudioPoiId(p.id);
                                    setNewAudioTitle(`Thuyết minh ${p.name}`);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-bold cursor-pointer"
                                  title="Tải audio MP3"
                                >
                                  Audio
                                </button>
                                <button
                                  onClick={() => openEditPoiModal(p)}
                                  className="text-amber-600 hover:text-amber-800 text-xs font-bold cursor-pointer"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeletePoi(p.id, p.name)}
                                  className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: DISHES TABLE */}
                {bottomTab === 'dishes' && (
                  <div className="p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Chọn quán để quản lý món:</span>
                        <select
                          value={selectedPoiId || ''}
                          onChange={(e) => setSelectedPoiId(Number(e.target.value))}
                          className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold shadow-xs"
                        >
                          {pois.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => setShowDishModal(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>+ Thêm Món Vào Quán</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="p-3 w-14 text-center whitespace-nowrap">ID</th>
                            <th className="p-3 whitespace-nowrap min-w-[200px]">Tên món ăn</th>
                            <th className="p-3 whitespace-nowrap">Nhóm món</th>
                            <th className="p-3 whitespace-nowrap">Giá tiền</th>
                            <th className="p-3 whitespace-nowrap">Đặc trưng</th>
                            <th className="p-3 text-right whitespace-nowrap w-24">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {currentDishes.length > 0 ? (
                            currentDishes.map((d: any) => (
                              <tr key={d.id} className="hover:bg-slate-50 transition">
                                <td className="p-3 font-mono text-slate-400 text-center whitespace-nowrap">#{d.id}</td>
                                <td className="p-3 font-bold text-slate-900 min-w-[200px]">{d.name}</td>
                                <td className="p-3 text-slate-500 whitespace-nowrap">{d.categoryName}</td>
                                <td className="p-3 text-emerald-600 font-bold whitespace-nowrap">{d.price?.toLocaleString()}đ</td>
                                <td className="p-3 whitespace-nowrap">
                                  {d.isSignature && (
                                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                                      ⭐ Món Tủ
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right whitespace-nowrap">
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Xóa món "${d.name}"?`)) return;
                                      await adminDeleteDish(d.id);
                                      showNotification('success', `Đã xóa món ${d.name}`);
                                      if (selectedPoiId) {
                                        fetchPoiMenu(selectedPoiId).then((data) => setSelectedPoiMenu(data));
                                      }
                                    }}
                                    className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                                  >
                                    Xóa
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                                Chưa có món ăn nào trong thực đơn quán này.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 4: REDIS CACHE */}
                {bottomTab === 'cache' && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800">Xóa Cache Theo Pattern</h4>
                        <p className="text-[11px] text-slate-500">
                          Nhập mẫu key Redis cần xóa (ví dụ: `poi:*`, `menu:*`, `tour:*`, `*`):
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={cachePattern}
                            onChange={(e) => setCachePattern(e.target.value)}
                            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono shadow-xs"
                          />
                          <button
                            onClick={async () => {
                              try {
                                await adminEvictCache(cachePattern);
                                showNotification('success', `Đã xóa cache với pattern "${cachePattern}"!`);
                              } catch (err: any) {
                                showNotification('error', `Lỗi: ${err.message}`);
                              }
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs"
                          >
                            Xóa Key
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <h4 className="font-bold text-slate-800">Trạng Thái Bộ Nhớ Đệm Redis</h4>
                        <div className="space-y-1 text-slate-500 text-[11px]">
                          <p>• Host: <b>localhost:6379 (Redis 7)</b></p>
                          <p>• TTL mặc định: <b>24 giờ (86400 giây)</b></p>
                          <p>• Tự động vô hiệu khi có CRUD từ Quản Trị Viên.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW: QUÁN & POI (Dedicated Sidebar Tab)                              */}
          {/* ===================================================================== */}
          {activeSidebar === 'pois' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Quản Lý Điểm Đến & Quán Ăn (POIs)</h2>
                  <p className="text-xs text-slate-500">Hỗ trợ tọa độ PostGIS không gian, audio MP3 thuyết minh tự động</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenCategoryModal}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Thêm, sửa hoặc xóa danh mục điểm đến"
                  >
                    <span>🏷️</span>
                    <span>Quản Lý Danh Mục</span>
                  </button>
                  <button
                    onClick={handleOpenPoiTypeModal}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Thêm, sửa hoặc xóa phân loại hệ thống (POI Types)"
                  >
                    <span>🧭</span>
                    <span>Quản Lý Phân Loại</span>
                  </button>
                  <button
                    onClick={openCreatePoiModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    + Thêm Quán Mới
                  </button>
                </div>
              </div>

              {/* POI Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[880px]">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-14 text-center whitespace-nowrap">ID</th>
                        <th className="p-3 whitespace-nowrap min-w-[240px]">Tên quán & Địa chỉ</th>
                        <th className="p-3 whitespace-nowrap min-w-[150px]">Danh mục</th>
                        <th className="p-3 whitespace-nowrap">Tọa độ PostGIS</th>
                        <th className="p-3 whitespace-nowrap">Giờ mở cửa</th>
                        <th className="p-3 whitespace-nowrap">Thuyết minh</th>
                        <th className="p-3 text-right whitespace-nowrap w-28">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPois.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono text-slate-400 text-center whitespace-nowrap">#{p.id}</td>
                          <td className="p-3 min-w-[240px]">
                            <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                            <p className="text-slate-500 text-[11px] truncate max-w-sm">{p.address}</p>
                          </td>
                          <td className="p-3 whitespace-nowrap min-w-[150px]">
                            <span className="inline-block whitespace-nowrap bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-purple-200/80 shadow-2xs">
                              {p.categoryName || 'Ẩm thực'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-blue-600 text-[11px] whitespace-nowrap">
                            📍 {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">{(p as any).openingHours || '15:00 - 23:00'}</td>
                          <td className="p-3 whitespace-nowrap">
                            {(p as any).hasAudio || (p as any).audioUrl ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-1">🎧 Sẵn sàng</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setAudioPoiId(p.id);
                                  setNewAudioTitle(`Thuyết minh ${p.name}`);
                                }}
                                className="text-amber-600 hover:underline text-[11px] font-bold cursor-pointer"
                              >
                                + Thêm MP3
                              </button>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setAudioPoiId(p.id);
                                setNewAudioTitle(`Thuyết minh ${p.name}`);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs font-bold cursor-pointer"
                              title="Tải audio MP3"
                            >
                              Audio
                            </button>
                            <button
                              onClick={() => openEditPoiModal(p)}
                              className="text-amber-600 hover:text-amber-800 text-xs font-bold cursor-pointer"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeletePoi(p.id, p.name)}
                              className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW: THỰC ĐƠN & AI OCR (Dedicated Sidebar Tab)                       */}
          {/* ===================================================================== */}
          {activeSidebar === 'menu' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Quản Lý Thực Đơn & AI OCR Menu Scanner</h2>
                  <p className="text-xs text-slate-500">Trích xuất tự động qua Gemini 1.5 Flash và quản lý giá món ăn</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex gap-2 border-b border-slate-200 pb-3">
                  <button
                    onClick={() => setBottomTab('ocr')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      bottomTab === 'ocr' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🤖 Quy Trình Duyệt AI OCR
                  </button>
                  <button
                    onClick={() => setBottomTab('dishes')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      bottomTab === 'dishes' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🍲 Danh Sách Món Theo Quán
                  </button>
                </div>

                {bottomTab === 'ocr' ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={ocrPoiId}
                        onChange={(e) => setOcrPoiId(Number(e.target.value))}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold shadow-xs"
                      >
                        {pois.map((p) => (
                          <option key={p.id} value={p.id}>
                            Quán: {p.name}
                          </option>
                        ))}
                      </select>
                      <label className="border border-dashed border-slate-300 rounded-xl px-4 py-2 text-xs cursor-pointer text-slate-600 bg-slate-50 hover:bg-slate-100">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        {ocrFile ? ocrFile.name : 'Chọn ảnh thực đơn'}
                      </label>
                      <button
                        onClick={() => handleScanMenuOcr()}
                        disabled={ocrLoading || !ocrFile}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                      >
                        {ocrLoading ? 'Đang quét...' : 'Quét Menu AI'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <select
                      value={selectedPoiId || ''}
                      onChange={(e) => setSelectedPoiId(Number(e.target.value))}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold shadow-xs"
                    >
                      {pois.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {currentDishes.map((d: any) => (
                        <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <p className="font-bold text-slate-900 text-xs">{d.name}</p>
                          <p className="text-emerald-600 text-xs font-bold mt-1">{d.price?.toLocaleString()}đ</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{d.categoryName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW: TOUR (Dedicated Sidebar Tab)                                    */}
          {/* ===================================================================== */}
          {activeSidebar === 'tours' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>🧭</span>
                    <span>Quản Lý Tuyến Du Lịch (Tours)</span>
                  </h2>
                  <p className="text-xs text-slate-500">Tuyến ẩm thực, di tích lịch sử và văn hóa tâm linh Quận 4</p>
                </div>
                <button
                  type="button"
                  onClick={openCreateTourModal}
                  className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <span>+</span>
                  <span>Tạo Tuyến Tour Mới</span>
                </button>
              </div>

              {tours.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 text-2xl flex items-center justify-center">
                    🧭
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Chưa có tuyến tour du lịch nào</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Hãy bấm nút bên dưới để thiết kế tuyến tour đầu tiên với các trạm dừng ẩm thực và di tích tại Quận 4.
                  </p>
                  <button
                    type="button"
                    onClick={openCreateTourModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    + Tạo Tuyến Tour Mới
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tours.map((t) => (
                    <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            {t.theme || 'Ẩm thực'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-500">⏱️ {t.estimatedDurationMinutes} phút</span>
                            {t.isPublic ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Công khai
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                Nội bộ
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">{t.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{t.description || 'Chưa có mô tả chi tiết cho tuyến tour này.'}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">📍 {t.stopCount || 0} điểm dừng</span>
                          <span className="text-slate-400">•</span>
                          <span className="truncate max-w-[120px]" title={t.creatorName}>👤 {t.creatorName || 'Hệ thống'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewTourDetail(t.id)}
                            disabled={loadingDetailTourId === t.id}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <span>👁️</span>
                            <span>{loadingDetailTourId === t.id ? 'Đang mở...' : 'Xem lộ trình'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTour(t.id, t.name)}
                            className="px-2 py-1 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-xs transition cursor-pointer"
                            title="Xóa tuyến tour"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW: NGƯỜI DÙNG (Dedicated Sidebar Tab)                              */}
          {/* ===================================================================== */}
          {activeSidebar === 'users' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-900">Quản Lý Người Dùng & Phân Quyền</h2>
                <p className="text-xs text-slate-500">Danh sách tài khoản Admin và khách du lịch tương tác hệ thống</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Email</th>
                      <th className="p-3">Vai trò (Role)</th>
                      <th className="p-3">Lượt nghe</th>
                      <th className="p-3">Check-in</th>
                      <th className="p-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">admin@saigonwhispers.vn</td>
                      <td className="p-3">
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200">
                          ROLE_ADMIN
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">23 lượt</td>
                      <td className="p-3 text-slate-500">4 lần</td>
                      <td className="p-3 text-emerald-600 font-bold">🟢 Đang hoạt động</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">traveler@saigonwhispers.vn</td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                          ROLE_USER
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">12 lượt</td>
                      <td className="p-3 text-slate-500">2 lần</td>
                      <td className="p-3 text-emerald-600 font-bold">🟢 Khách du lịch</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW: THAO TÁC & HỆ THỐNG (Dedicated Sidebar Tab)                     */}
          {/* ===================================================================== */}
          {activeSidebar === 'settings' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-900">Thao Tác Hệ Thống & Redis Cache</h2>
                <p className="text-xs text-slate-500">Quản trị bộ nhớ cache, PostGIS spatial indices, và kết nối máy chủ</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Xóa Bộ Nhớ Cache Nhanh</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => adminEvictCache('poi:*').then(() => showNotification('success', 'Đã xóa cache POI!'))}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between"
                    >
                      <span>⚡ Xóa Cache Quán Ăn (`poi:*`)</span>
                      <span className="text-[10px] text-slate-400">Key POIs</span>
                    </button>
                    <button
                      onClick={() => adminEvictCache('menu:*').then(() => showNotification('success', 'Đã xóa cache Thực đơn!'))}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between"
                    >
                      <span>⚡ Xóa Cache Thực Đơn (`menu:*`)</span>
                      <span className="text-[10px] text-slate-400">Key Dishes</span>
                    </button>
                    <button
                      onClick={() => adminEvictCache('*').then(() => showNotification('success', 'Đã xóa toàn bộ Cache Redis!'))}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between"
                    >
                      <span>🔥 Xóa Toàn Bộ Redis Cache (`*`)</span>
                      <span className="text-[10px] text-rose-500">Flush DB</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                  <h3 className="text-sm font-bold text-slate-900">Thông Số Máy Chủ Backend</h3>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Server Engine:</span>
                      <span className="text-slate-900 font-mono">Spring Boot 3.3.4 (Java 17)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Database:</span>
                      <span className="text-slate-900 font-mono">PostgreSQL 16 + PostGIS 3.4</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Spatial Index:</span>
                      <span className="text-emerald-600 font-mono">GIST (geom_point)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Audio Format:</span>
                      <span className="text-slate-900 font-mono">MP3 (206 Partial Content Stream)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS: ADD/EDIT POI MODAL (Light Style)                                  */}
      {/* ========================================================================= */}
      {showPoiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingPoi ? `Sửa Quán: ${editingPoi.name}` : 'Thêm Điểm Đến / Quán Ăn Mới'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Định vị trực tiếp trên bản đồ Quận 4, hỗ trợ lưu trữ tọa độ PostGIS & audio thuyết minh
                </p>
              </div>
              <button
                onClick={() => setShowPoiModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePoi} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Tên quán / Địa điểm *</label>
                <input
                  type="text"
                  required
                  value={poiFormData.name}
                  onChange={(e) => setPoiFormData({ ...poiFormData, name: e.target.value })}
                  placeholder="Ví dụ: Quán Ốc Vũ, Phá Lấu Cô Thảo..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* PHẦN 1: CHỌN DANH MỤC & LOẠI HÌNH POI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-bold flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>Danh mục điểm đến (Category) *</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenCategoryModal}
                      className="px-2 py-0.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Thêm, sửa hoặc xóa danh mục điểm đến"
                    >
                      <span>⚙️</span>
                      <span>Thêm / Sửa / Xóa</span>
                    </button>
                  </div>
                  <select
                    value={poiFormData.categoryId || ''}
                    onChange={(e) => {
                      const newCatId = Number(e.target.value);
                      const cat = categoriesList.find((c) => c.id === newCatId);
                      const inferred = cat ? inferPoiTypeFromCategory(cat.name, cat.slug) : 'FOOD';
                      setPoiFormData((prev) => ({
                        ...prev,
                        categoryId: newCatId,
                        pinEmoji: cat?.iconUrl || prev.pinEmoji,
                        poiType: inferred || prev.poiType,
                      }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {categoriesList.length === 0 ? (
                      <option value="">-- Chưa có danh mục (đang tải...) --</option>
                    ) : (
                      categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.iconUrl || '🏷️'} {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                      <span>🧭</span>
                      <span>Phân loại hệ thống (POI Type)</span>
                      <span className="text-[10px] text-blue-600 font-normal">(Tự động theo danh mục)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenPoiTypeModal}
                      className="px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Quản lý Phân loại hệ thống"
                    >
                      <span>⚙️</span>
                      <span>Thêm / Sửa / Xóa</span>
                    </button>
                  </div>
                  <select
                    value={poiFormData.poiType || ''}
                    onChange={(e) => setPoiFormData({ ...poiFormData, poiType: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {poiTypesList.length === 0 ? (
                      <option value="">-- Chưa có phân loại (đang tải...) --</option>
                    ) : (
                      poiTypesList.map((pt) => (
                        <option key={pt.code} value={pt.code}>
                          {pt.icon || '📍'} {pt.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* PHẦN 2: TÙY CHỌN BIỂU TƯỢNG VÀ MÀU SẮC GHIM BẢN ĐỒ */}
              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold flex items-center gap-1.5">
                    <span>🎨</span>
                    <span>Tùy chỉnh Biểu tượng & Màu sắc Ghim</span>
                  </label>
                  {/* Xem trước Ghim Thực Tế */}
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-medium">Ghim hiển thị:</span>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shadow-xs border border-white"
                      style={{ backgroundColor: poiFormData.pinColor }}
                    >
                      {poiFormData.pinEmoji}
                    </div>
                  </div>
                </div>

                {/* Chọn Icon Emoji */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Biểu tượng ghim:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PIN_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setPoiFormData({ ...poiFormData, pinEmoji: emoji })}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer ${
                          poiFormData.pinEmoji === emoji
                            ? 'bg-blue-600 text-white shadow-md scale-110 ring-2 ring-blue-400'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chọn Màu Ghim */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Màu ghim bản đồ:</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {PIN_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setPoiFormData({ ...poiFormData, pinColor: c.value })}
                        className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition-transform cursor-pointer border-2 ${
                          poiFormData.pinColor === c.value
                            ? 'scale-125 border-slate-900 shadow-md ring-2 ring-white'
                            : 'border-white hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      >
                        {poiFormData.pinColor === c.value && (
                          <span className="text-white text-[10px] font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* BẢN ĐỒ CHỌN TỌA ĐỘ BẰNG CÁCH KÉO GHIM TRỰC TIẾP */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>📍</span>
                    <span>Vị trí trên bản đồ (Kéo ghim hoặc bấm bản đồ để chọn) *</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Tự động đồng bộ PostGIS (Lat/Lng)
                  </span>
                </label>
                <LocationPickerMap
                  latitude={poiFormData.latitude}
                  longitude={poiFormData.longitude}
                  currentPoiName={poiFormData.name}
                  existingPois={pois}
                  pinIcon={poiFormData.pinEmoji}
                  pinColor={poiFormData.pinColor}
                  onChange={(lat, lng, suggestedAddress) => {
                    setPoiFormData((prev) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                      address: suggestedAddress || prev.address,
                    }));
                  }}
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Địa chỉ chính xác *</label>
                <input
                  type="text"
                  required
                  value={poiFormData.address}
                  onChange={(e) => setPoiFormData({ ...poiFormData, address: e.target.value })}
                  placeholder="Ví dụ: 37 Vĩnh Khánh, Phường 9, Quận 4"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Mô tả giới thiệu</label>
                <textarea
                  rows={2}
                  value={poiFormData.description}
                  onChange={(e) => setPoiFormData({ ...poiFormData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-xs focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Giờ mở cửa</label>
                  <input
                    type="text"
                    value={poiFormData.openingHours}
                    onChange={(e) => setPoiFormData({ ...poiFormData, openingHours: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={poiFormData.phone}
                    onChange={(e) => setPoiFormData({ ...poiFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-xs focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPoiModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm"
                >
                  {editingPoi ? 'Cập Nhật' : 'Lưu Điểm Đến'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUẢN LÝ DANH MỤC (THÊM, SỬA, XÓA DANH MỤC ĐIỂM ĐẾN)               */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>🏷️</span>
                  <span>Quản Lý Danh Mục Điểm Đến</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Thêm mới, chỉnh sửa tên, icon hoặc xóa danh mục hiển thị trên bản đồ và bộ lọc du lịch
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Thêm / Sửa Danh mục */}
            <form onSubmit={handleSaveCategory} className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-purple-950 flex items-center gap-1.5">
                  <span>{editingCategory ? '✏️ Chỉnh Sửa Danh Mục' : '➕ Thêm Danh Mục Mới'}</span>
                </h4>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryFormData({ name: '', iconUrl: '🍲' });
                    }}
                    className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                  >
                    Hủy sửa
                  </button>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
                  <span>Tên danh mục *</span>
                  <span className="text-[10px] text-purple-600 font-medium bg-purple-100/70 px-2 py-0.5 rounded-full">
                    Thứ tự: Tự động tăng ⚡
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Ví dụ: Bánh mì & Xôi đêm, Lẩu bò..."
                  className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-slate-900 shadow-2xs focus:border-purple-600 focus:outline-none"
                />
              </div>

              {/* Chọn Biểu Tượng Icon Emoji */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
                  <span>Biểu tượng hiển thị:</span>
                  <span className="text-lg bg-white px-2 py-0.5 rounded-lg border border-purple-200 shadow-2xs">
                    {categoryFormData.iconUrl || '🍲'}
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['🍲', '🍢', '🍜', '☕', '🍺', '🥖', '🥪', '🍨', '🏛️', '⛩️', '⛪', '🌉', '📸', '📍', '⭐', '🔥'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, iconUrl: em })}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                        categoryFormData.iconUrl === em
                          ? 'bg-purple-600 text-white shadow-sm scale-110 ring-2 ring-purple-400'
                          : 'bg-white hover:bg-purple-100 text-slate-700 border border-purple-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={categoryLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{editingCategory ? '💾 Cập Nhật Danh Mục' : '➕ Tạo Danh Mục'}</span>
                </button>
              </div>
            </form>

            {/* Danh sách các danh mục hiện tại */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Danh Sách Danh Mục Hiện Có ({categoriesList.length})</span>
                <span className="text-[10px] text-slate-400">Bấm Sửa hoặc Xóa</span>
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700 min-w-[480px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-12 text-center whitespace-nowrap">Icon</th>
                      <th className="p-2.5 whitespace-nowrap">Tên danh mục</th>
                      <th className="p-2.5 whitespace-nowrap">Slug định danh</th>
                      <th className="p-2.5 w-16 text-center whitespace-nowrap">Thứ tự</th>
                      <th className="p-2.5 text-right whitespace-nowrap w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {categoriesList.map((cat, index) => (
                      <tr key={cat.id} className="hover:bg-purple-50/30 transition">
                        <td className="p-2.5 text-center text-base whitespace-nowrap">
                          {cat.iconUrl || '🏷️'}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{cat.name}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">{cat.slug}</td>
                        <td className="p-2.5 text-center font-mono text-slate-500 font-bold text-[11px] whitespace-nowrap">
                          #{cat.sortOrder ?? (index + 1)}
                        </td>
                        <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEditCategory(cat)}
                            className="text-purple-600 hover:text-purple-800 font-bold text-[11px] hover:underline cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="text-rose-600 hover:text-rose-800 font-bold text-[11px] hover:underline cursor-pointer"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUẢN LÝ PHÂN LOẠI HỆ THỐNG (THÊM, SỬA, XÓA POI TYPES)               */}
      {/* ========================================================================= */}
      {showPoiTypeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>🧭</span>
                  <span>Quản Lý Phân Loại Hệ Thống (POI Type)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Thêm mới, chỉnh sửa tên, icon hoặc xóa phân loại hệ thống (Ẩm thực, Di tích, Chùa, Cảnh quan, Mua sắm...)
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPoiTypeModal(false);
                  setEditingPoiType(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Thêm / Sửa Phân loại */}
            <form onSubmit={handleSavePoiType} className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
                  <span>{editingPoiType ? '✏️ Chỉnh Sửa Phân Loại Hệ Thống' : '➕ Thêm Phân Loại Mới'}</span>
                </h4>
                {editingPoiType && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPoiType(null);
                      setPoiTypeFormData({ code: '', name: '', icon: '🍲', description: '' });
                    }}
                    className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                  >
                    Hủy sửa
                  </button>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
                  <span>Tên phân loại *</span>
                  <span className="text-[10px] text-blue-600 font-medium bg-blue-100/70 px-2 py-0.5 rounded-full">
                    Mã code & Thứ tự: Tự động tạo ⚡
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={poiTypeFormData.name}
                  onChange={(e) => setPoiTypeFormData({ ...poiTypeFormData, name: e.target.value })}
                  placeholder="Ví dụ: Mua Sắm & Đặc Sản, Cà Phê & Đồ Uống..."
                  className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-slate-900 shadow-2xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Mô tả phân loại
                </label>
                <input
                  type="text"
                  value={poiTypeFormData.description}
                  onChange={(e) => setPoiTypeFormData({ ...poiTypeFormData, description: e.target.value })}
                  placeholder="Ví dụ: Chợ dân sinh, quà lưu niệm, đồ thủ công mỹ nghệ..."
                  className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-slate-900 shadow-2xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Chọn Biểu Tượng Icon Emoji */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
                  <span>Biểu tượng hiển thị:</span>
                  <span className="text-lg bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                    {poiTypeFormData.icon || '🍲'}
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['🍲', '🍢', '🍜', '☕', '🍺', '🛍️', '🎭', '🎉', '🏛️', '⛩️', '⛪', '🌉', '📸', '📍', '⭐', '🔥'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setPoiTypeFormData({ ...poiTypeFormData, icon: em })}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                        poiTypeFormData.icon === em
                          ? 'bg-blue-600 text-white shadow-sm scale-110 ring-2 ring-blue-400'
                          : 'bg-white hover:bg-blue-100 text-slate-700 border border-blue-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={poiTypeLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{editingPoiType ? '💾 Cập Nhật Phân Loại' : '➕ Tạo Phân Loại'}</span>
                </button>
              </div>
            </form>

            {/* Danh sách các phân loại hiện tại */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Danh Sách Phân Loại Hệ Thống Hiện Có ({poiTypesList.length})</span>
                <span className="text-[10px] text-slate-400">Bấm Sửa hoặc Xóa</span>
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700 min-w-[550px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-12 text-center whitespace-nowrap">Icon</th>
                      <th className="p-2.5 whitespace-nowrap">Tên phân loại</th>
                      <th className="p-2.5 whitespace-nowrap">Mô tả</th>
                      <th className="p-2.5 w-16 text-center whitespace-nowrap">Thứ tự</th>
                      <th className="p-2.5 text-right whitespace-nowrap w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {poiTypesList.map((pt, index) => (
                      <tr key={pt.code} className="hover:bg-blue-50/30 transition">
                        <td className="p-2.5 text-center text-base whitespace-nowrap">
                          {pt.icon || '📍'}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <p className="font-bold text-slate-900">{pt.name}</p>
                          <p className="font-mono text-[10px] text-slate-400">Mã tự động: {pt.code}</p>
                        </td>
                        <td className="p-2.5 text-slate-500 text-[11px] max-w-[150px] truncate">{pt.description || '—'}</td>
                        <td className="p-2.5 text-center font-mono text-slate-500 font-bold text-[11px] whitespace-nowrap">
                          #{pt.sortOrder ?? (index + 1)}
                        </td>
                        <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEditPoiType(pt)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-[11px] hover:underline cursor-pointer"
                          >
                            Sửa
                          </button>
                          {pt.code !== 'FOOD' ? (
                            <button
                              type="button"
                              onClick={() => handleDeletePoiType(pt.code, pt.name)}
                              className="text-rose-600 hover:text-rose-800 font-bold text-[11px] hover:underline cursor-pointer"
                            >
                              Xóa
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-medium italic">Gốc</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHI TIẾT SỐ LIỆU STAT CARD (LƯỢT NGHE / TOP HOTSPOT / DWELL / TOUR)*/}
      {/* ========================================================================= */}
      {metricModalType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs text-white shrink-0 ${
                  metricModalType === 'visitors' ? 'bg-[#7c3aed]' :
                  metricModalType === 'audio' ? 'bg-[#ff5252]' :
                  metricModalType === 'hotspot' ? 'bg-[#4680ff]' :
                  metricModalType === 'dwell' ? 'bg-[#11c15b]' : 'bg-[#ffa21d]'
                }`}>
                  {metricModalType === 'visitors' ? '👥' :
                   metricModalType === 'audio' ? '🎧' :
                   metricModalType === 'hotspot' ? '🔥' :
                   metricModalType === 'dwell' ? '⏱️' : '🗺️'}
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
                    {metricModalType === 'system' && 'Danh sách các tour du lịch và chỉ số tương tác (Check-in, Đánh giá, Thả tim)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMetricModalType(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* MINI KPI STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {metricModalType === 'visitors' && (
                <>
                  <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-purple-600 font-bold uppercase block">Đang trực tuyến</span>
                    <span className="text-base font-black text-purple-700">{activeVisitors} người</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-purple-600 font-bold uppercase block">Kênh kết nối</span>
                    <span className="text-base font-black text-purple-700">Web & Di Động</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-purple-600 font-bold uppercase block">Chu kỳ làm mới</span>
                    <span className="text-base font-black text-purple-700">10s / lần</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-purple-600 font-bold uppercase block">Trạng thái</span>
                    <span className="text-base font-black text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Hoạt động
                    </span>
                  </div>
                </>
              )}
              {metricModalType === 'audio' && (
                <>
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-red-600 font-bold uppercase block">Tổng lượt nghe</span>
                    <span className="text-base font-black text-red-700">{audioStats.totalListens} lượt</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-red-600 font-bold uppercase block">GPS Tự động</span>
                    <span className="text-base font-black text-red-700">{audioStats.autoTriggeredListens} lượt</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-red-600 font-bold uppercase block">Bấm thủ công</span>
                    <span className="text-base font-black text-red-700">{audioStats.manualTriggeredListens} lượt</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-red-600 font-bold uppercase block">Nghe trọn vẹn</span>
                    <span className="text-base font-black text-red-700">{audioStats.completionRate}%</span>
                  </div>
                </>
              )}
              {metricModalType === 'hotspot' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-blue-600 font-bold uppercase block">Tổng quán đo lường</span>
                    <span className="text-base font-black text-blue-700">{topHotspots.length} địa điểm</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-blue-600 font-bold uppercase block">Quán Hot #1</span>
                    <span className="text-base font-black text-blue-700 truncate block">{topHotspots[0]?.poiName || '—'}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-blue-600 font-bold uppercase block">Tổng lượt nghe</span>
                    <span className="text-base font-black text-blue-700">{audioStats.totalListens}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-blue-600 font-bold uppercase block">Tổng Check-in</span>
                    <span className="text-base font-black text-blue-700">{systemOverview.totalCheckins}</span>
                  </div>
                </>
              )}
              {metricModalType === 'dwell' && (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Tổng thời gian</span>
                    <span className="text-base font-black text-emerald-700">{dwellStats.totalDwellMinutes} phút</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Thời gian TB / khách</span>
                    <span className="text-base font-black text-emerald-700">{dwellStats.avgDwellMinutes} phút</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Phiên dừng chân</span>
                    <span className="text-base font-black text-emerald-700">{dwellStats.totalDwellEvents} lượt</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Độ giữ chân</span>
                    <span className="text-base font-black text-emerald-700">Ổn định</span>
                  </div>
                </>
              )}
              {metricModalType === 'system' && (
                <>
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-amber-600 font-bold uppercase block">Tổng Tour Tuyến</span>
                    <span className="text-base font-black text-amber-700">{systemOverview.totalTours} Tour</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-amber-600 font-bold uppercase block">Lượt Check-in</span>
                    <span className="text-base font-black text-amber-700">{systemOverview.totalCheckins}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-amber-600 font-bold uppercase block">Lượt Đánh giá</span>
                    <span className="text-base font-black text-amber-700">{systemOverview.totalReviews}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-amber-600 font-bold uppercase block">Yêu thích</span>
                    <span className="text-base font-black text-amber-700">{systemOverview.totalFavorites}</span>
                  </div>
                </>
              )}
            </div>

            {/* MAIN CONTENT TABLE */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>
                  {metricModalType === 'visitors' && 'Danh Sách Du Khách & Thiết Bị Đang Kết Nối Trực Tuyến'}
                  {metricModalType === 'audio' && 'Danh Sách Lượt Nghe Thuyết Minh Theo Quán (Xếp Theo Lượt Nghe)'}
                  {metricModalType === 'hotspot' && 'Bảng Xếp Hạng Điểm Đến & Quán Ăn (Top Hotspots)'}
                  {metricModalType === 'dwell' && 'Thời Gian Lưu Lại Của Khách Theo Từng Quán (Xếp Theo Phút Lưu Lại)'}
                  {metricModalType === 'system' && 'Danh Sách Các Tour Tuyến Khám Phá Quận 4'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {metricModalType === 'visitors' ? `${activeVisitors} thiết bị online` : metricModalType === 'system' ? `${tours.length} tour tuyến` : `${topHotspots.length} địa điểm ghi nhận`}
                </span>
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                {metricModalType === 'visitors' ? (
                  /* Table for Active Visitors */
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
                  /* Table for Tours */
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
                            <td className="p-2.5 text-slate-500 whitespace-nowrap">{t.theme || t.slug || 'Quận 4'}</td>
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
                          <td colSpan={5} className="p-6 text-center text-slate-400">Chưa có tour du lịch nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  /* Table for POI Hotspots / Audio Listens / Dwell */
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
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                                    idx === 0 ? 'bg-amber-100 text-amber-800 font-black ring-1 ring-amber-300' :
                                    idx === 1 ? 'bg-slate-200 text-slate-800 font-black' :
                                    idx === 2 ? 'bg-orange-100 text-orange-800 font-black' : 'text-slate-500'
                                  }`}>
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
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                    metricModalType === 'audio' ? 'bg-red-100 text-red-700 font-black ring-1 ring-red-300' : 'text-slate-800'
                                  }`}>
                                    {h.listenCount} lượt
                                  </span>
                                </td>
                                <td className="p-2.5 text-center text-slate-700 font-bold whitespace-nowrap">
                                  {h.checkinCount}
                                </td>
                                <td className="p-2.5 text-center whitespace-nowrap">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                    metricModalType === 'dwell' ? 'bg-emerald-100 text-emerald-700 font-black ring-1 ring-emerald-300' : 'text-slate-700'
                                  }`}>
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
                                        setMetricModalType(null);
                                        openEditPoiModal(matchedPoi);
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
                onClick={() => setMetricModalType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {audioPoiId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-900">Tải Lên File Thuyết Minh MP3</h3>
              <button onClick={() => setAudioPoiId(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Tiêu đề bài thuyết minh</label>
                <input
                  type="text"
                  value={newAudioTitle}
                  onChange={(e) => setNewAudioTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">File âm thanh MP3 *</label>
                <input
                  type="file"
                  accept="audio/mp3,audio/*"
                  onChange={(e) => setNewAudioFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-700 bg-slate-50 border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Lời thuyết minh (Script)</label>
                <textarea
                  rows={3}
                  value={newAudioScript}
                  onChange={(e) => setNewAudioScript(e.target.value)}
                  placeholder="Nhập nội dung lời đọc nếu có..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAudioPoiId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleUploadAudio}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm"
                >
                  Tải Lên MP3
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TẠO TUYẾN TOUR MỚI (CREATE TOUR MODAL)                             */}
      {/* ========================================================================= */}
      {showTourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>🧭</span>
                  <span>Tạo Tuyến Tour Du Lịch Mới</span>
                </h3>
                <p className="text-xs text-slate-500">Thiết kế lộ trình tham quan tuần tự kèm gợi ý món ngon và thuyết minh</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTourModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTour} className="space-y-4 text-xs">
              {/* Tên tour & Chủ đề */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-bold block mb-1">Tên Tuyến Tour *</label>
                  <input
                    type="text"
                    required
                    value={tourFormData.name}
                    onChange={(e) => setTourFormData({ ...tourFormData, name: e.target.value })}
                    placeholder="Ví dụ: Foodtour Đêm Phố Ốc Vĩnh Khánh..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold shadow-2xs focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Chủ Đề (Theme)</label>
                  <select
                    value={tourFormData.theme || 'FOOD'}
                    onChange={(e) => setTourFormData({ ...tourFormData, theme: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold shadow-2xs focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="FOOD">🍲 Ẩm Thực (FOOD)</option>
                    <option value="HISTORICAL">🏛️ Di Tích Lịch Sử (HISTORICAL)</option>
                    <option value="RELIGIOUS">⛩️ Tôn Giáo & Chùa Chiền (RELIGIOUS)</option>
                    <option value="LANDMARK">🌉 Cảnh Quan Check-in (LANDMARK)</option>
                    <option value="MIXED">✨ Tuyến Tổng Hợp (MIXED)</option>
                  </select>
                </div>
              </div>

              {/* Mô tả lộ trình */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Mô Tả Lộ Trình</label>
                <textarea
                  rows={2}
                  value={tourFormData.description || ''}
                  onChange={(e) => setTourFormData({ ...tourFormData, description: e.target.value })}
                  placeholder="Giới thiệu sơ lược về điểm độc đáo, trải nghiệm đáng nhớ của tuyến tour này..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 shadow-2xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Tùy chọn nâng cao: Thumbnail & Hiển thị */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Ảnh đại diện (Thumbnail URL)</label>
                  <input
                    type="text"
                    value={tourFormData.thumbnailUrl || ''}
                    onChange={(e) => setTourFormData({ ...tourFormData, thumbnailUrl: e.target.value })}
                    placeholder="https://... (để trống sẽ lấy ảnh quán đầu tiên)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs shadow-2xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Tên Người Tạo / Đơn Vị</label>
                  <input
                    type="text"
                    value={tourFormData.creatorName || ''}
                    onChange={(e) => setTourFormData({ ...tourFormData, creatorName: e.target.value })}
                    placeholder="Ban Quản Trị Smart Tourism"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs shadow-2xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Chế độ công khai */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tourIsPublic"
                  checked={tourFormData.isPublic ?? true}
                  onChange={(e) => setTourFormData({ ...tourFormData, isPublic: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="tourIsPublic" className="text-slate-700 font-bold cursor-pointer">
                  Công khai tuyến tour này trên ứng dụng cho tất cả du khách
                </label>
              </div>

              {/* DANH SÁCH CÁC ĐIỂM DỪNG (STOPS) */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📍</span>
                      <span>Lộ Trình Các Điểm Dừng ({tourFormData.stops.length} Trạm) *</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Các điểm dừng sẽ được du khách ghé thăm theo thứ tự tuần tự</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTourStop}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>+</span>
                    <span>Thêm Điểm Dừng</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {tourFormData.stops.map((stop, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                          Trạm #{idx + 1}
                        </span>
                        {tourFormData.stops.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTourStop(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold transition cursor-pointer"
                            title="Xóa trạm dừng này"
                          >
                            ✕ Xóa trạm
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Chọn POI */}
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Chọn Quán / Điểm Đến *</label>
                          <select
                            value={stop.poiId}
                            onChange={(e) => {
                              const newId = Number(e.target.value);
                              const updated = [...tourFormData.stops];
                              updated[idx].poiId = newId;
                              setTourFormData({ ...tourFormData, stops: updated });
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-semibold shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
                          >
                            {pois.map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.id} - {p.name} ({p.categoryName || 'Quán'})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Thời gian dừng */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Thời Gian Dừng (phút)</label>
                          <input
                            type="number"
                            min={5}
                            max={240}
                            value={stop.estimatedDurationMinutes || 30}
                            onChange={(e) => {
                              const updated = [...tourFormData.stops];
                              updated[idx].estimatedDurationMinutes = Number(e.target.value);
                              setTourFormData({ ...tourFormData, stops: updated });
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-semibold shadow-2xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Gợi ý món / hoạt động */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Gợi ý món ngon hoặc trải nghiệm tại trạm..."
                            value={stop.recommendedDishOrActivity || ''}
                            onChange={(e) => {
                              const updated = [...tourFormData.stops];
                              updated[idx].recommendedDishOrActivity = e.target.value;
                              setTourFormData({ ...tourFormData, stops: updated });
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-[11px] shadow-2xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Ghi chú di chuyển / lưu ý đặc biệt..."
                            value={stop.note || ''}
                            onChange={(e) => {
                              const updated = [...tourFormData.stops];
                              updated[idx].note = e.target.value;
                              setTourFormData({ ...tourFormData, stops: updated });
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-[11px] shadow-2xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTourModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={tourSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>{tourSubmitting ? 'Đang lưu tuyến tour...' : 'Tạo Tuyến Tour'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XEM CHI TIẾT LỘ TRÌNH TOUR (TOUR DETAIL MODAL)                     */}
      {/* ========================================================================= */}
      {activeDetailTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {activeDetailTour.theme || 'Ẩm thực'}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">{activeDetailTour.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeDetailTour.description || 'Lộ trình khám phá Quận 4'}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailTour(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Thời lượng</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">⏱️ {activeDetailTour.estimatedDurationMinutes} phút</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Cự ly</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">📏 {((activeDetailTour.totalDistanceMeters || 1200) / 1000).toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Chi phí ước tính</p>
                <p className="text-xs font-black text-emerald-600 mt-0.5">💰 {(activeDetailTour.estimatedCost || 150000).toLocaleString()}đ</p>
              </div>
            </div>

            {/* Stops Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Thứ Tự Các Điểm Dừng ({activeDetailTour.stops?.length || 0})
              </h4>

              <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                {activeDetailTour.stops?.map((stop, index) => {
                  const poiName = stop.poi?.name || stop.poiName || `Điểm dừng #${index + 1}`;
                  const address = stop.poi?.address || stop.address || 'Quận 4, TP. Hồ Chí Minh';
                  const duration = stop.estimatedDurationMinutes || stop.suggestedDurationMinutes || 30;
                  const dish = stop.recommendedDishOrActivity;
                  const note = stop.note || stop.notes;

                  return (
                    <div key={stop.stopId || stop.id || index} className="relative bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="absolute -left-[27px] top-3 w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center ring-4 ring-white">
                        {stop.stopOrder || index + 1}
                      </div>

                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900">{poiName}</h5>
                        <span className="text-[10px] text-blue-600 font-bold">~{duration} phút</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">📍 {address}</p>
                      {dish && (
                        <p className="text-[10px] text-indigo-700 font-semibold bg-indigo-50/80 px-2 py-0.5 rounded-md mt-1 border border-indigo-100">
                          🍲 {dish}
                        </p>
                      )}
                      {note && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mt-1.5 border border-amber-200/60">
                          💡 {note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDetailTour(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: ADD DISH MODAL                                                    */}
      {/* ========================================================================= */}
      {showDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-900">Thêm Món Ăn Mới</h3>
              <button onClick={() => setShowDishModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Tên món ăn *</label>
                <input
                  type="text"
                  required
                  value={dishFormData.name}
                  onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })}
                  placeholder="Ví dụ: Ốc hương xào bơ tỏi"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Đơn giá (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={dishFormData.price}
                    onChange={(e) => setDishFormData({ ...dishFormData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Nhóm danh mục</label>
                  <input
                    type="text"
                    value={dishFormData.categoryName}
                    onChange={(e) => setDishFormData({ ...dishFormData, categoryName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSignature"
                  checked={dishFormData.isSignature}
                  onChange={(e) => setDishFormData({ ...dishFormData, isSignature: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <label htmlFor="isSignature" className="text-slate-700 font-bold">
                  Đánh dấu là món đặc trưng (Signature / Món Tủ)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDishModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-sm"
                >
                  Lưu Món
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
