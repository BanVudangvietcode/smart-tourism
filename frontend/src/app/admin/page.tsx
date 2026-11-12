'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  fetchPois,
  fetchPoiDetail,
  fetchPoiMenu,
  fetchTours,
  fetchTourDetail,
  createTour,
  deleteTour,
  fetchCategories,
  fetchPoiTypes,
  getDashboardSummary,
  getHeatmap,
  adminCreatePoi,
  adminUpdatePoi,
  adminDeletePoi,
  adminScanMenuOcr,
  adminCreateDish,
  adminDeleteDish,
  adminEvictCache,
} from '@/services/api';
import { PoiSummary, TourSummary, TourDetail, Category, PoiTypeItem, CreateTourInput } from '@/types';
import { inferPoiTypeFromCategory } from '@/components/admin/constants';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboardView from '@/components/admin/views/AdminDashboardView';
import AdminPoisView from '@/components/admin/views/AdminPoisView';
import AdminMenuView from '@/components/admin/views/AdminMenuView';
import AdminToursView from '@/components/admin/views/AdminToursView';
import AdminUsersView from '@/components/admin/views/AdminUsersView';
import AdminSettingsView from '@/components/admin/views/AdminSettingsView';

import AdminPoiModal from '@/components/admin/modals/AdminPoiModal';
import AdminAudioModal from '@/components/admin/modals/AdminAudioModal';
import AdminCategoryModal from '@/components/admin/modals/AdminCategoryModal';
import AdminPoiTypeModal from '@/components/admin/modals/AdminPoiTypeModal';
import AdminTourModal from '@/components/admin/modals/AdminTourModal';
import AdminTourDetailModal from '@/components/admin/modals/AdminTourDetailModal';
import AdminDishModal from '@/components/admin/modals/AdminDishModal';
import AdminMetricModal from '@/components/admin/modals/AdminMetricModal';

export default function AdminPage() {
  // Navigation & View state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<'dashboard' | 'pois' | 'menu' | 'tours' | 'users' | 'settings'>('dashboard');
  const [bottomTab, setBottomTab] = useState<'ocr' | 'pois' | 'dishes' | 'cache'>('ocr');
  const [globalSearch, setGlobalSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeVisitors, setActiveVisitors] = useState<number>(1);
  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [tours, setTours] = useState<TourSummary[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [poiTypesList, setPoiTypesList] = useState<PoiTypeItem[]>([]);
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [selectedPoiMenu, setSelectedPoiMenu] = useState<any>(null);

  // Cache state
  const [cacheEvicting, setCacheEvicting] = useState(false);
  const [cachePattern, setCachePattern] = useState('poi:*');

  // OCR states
  const [ocrPoiId, setOcrPoiId] = useState<number>(1);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrItems, setOcrItems] = useState<any[]>([]);

  // Modal visibility states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPoiTypeModal, setShowPoiTypeModal] = useState(false);
  const [showPoiModal, setShowPoiModal] = useState(false);
  const [editingPoi, setEditingPoi] = useState<PoiSummary | null>(null);
  const [poiImageFile, setPoiImageFile] = useState<File | null>(null);
  const [poiAudioFile, setPoiAudioFile] = useState<File | null>(null);
  const [poiFormData, setPoiFormData] = useState<any>({
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
    poiType: 'FOOD',
    latitude: 10.7612,
    longitude: 106.7025,
    audioScript: '',
    audioTitle: '',
    pinEmoji: '📍',
    pinColor: '#ea580c',
  });

  const [audioPoiId, setAudioPoiId] = useState<number | null>(null);

  // Dish modal state
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

  // Tour modal states
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
    stops: [],
  });

  // Metric drilldown modal
  const [metricModalType, setMetricModalType] = useState<'visitors' | 'audio' | 'hotspot' | 'dwell' | 'system' | null>(null);

  // Toast notifications
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  // Initial Data Load
  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategoriesList(data || []);
    } catch {}
  };

  const loadPoiTypes = async () => {
    try {
      const data = await fetchPoiTypes();
      setPoiTypesList(data || []);
    } catch {}
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [statsRes, poiList, tourList, catList, poiTypeList] = await Promise.all([
          getDashboardSummary().catch(() => null),
          fetchPois().catch(() => []),
          fetchTours().catch(() => []),
          fetchCategories().catch(() => []),
          fetchPoiTypes().catch(() => []),
        ]);

        if (statsRes) setDashboardData(statsRes);
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
  }, []);

  // Realtime Live Visitors SSE
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
        } catch {}
      };
      eventSource.addEventListener('visitors', handleVisitorEvent);
      eventSource.onmessage = handleVisitorEvent;
    } catch (e) {
      console.warn('Không thể khởi tạo EventSource SSE:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Fetch POI Menu
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

  // POI CRUD
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

  // Dish Handlers
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

  const handleDeleteDish = async (dishId: number, dishName: string) => {
    if (!confirm(`Xóa món "${dishName}"?`)) return;
    try {
      await adminDeleteDish(dishId);
      showNotification('success', `Đã xóa món ${dishName}`);
      if (selectedPoiId) {
        const updated = await fetchPoiMenu(selectedPoiId);
        setSelectedPoiMenu(updated);
      }
    } catch (err: any) {
      showNotification('error', `Lỗi xóa món: ${err.message}`);
    }
  };

  // Tour Handlers
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

  // Filter POIs
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

  // Current POI dishes
  const currentDishes = useMemo(() => {
    if (!selectedPoiMenu || !selectedPoiMenu.categories) return [];
    return selectedPoiMenu.categories.flatMap((c: any) =>
      c.dishes.map((d: any) => ({ ...d, categoryName: c.categoryName }))
    );
  }, [selectedPoiMenu]);

  // Metrics from DB
  const audioStats = dashboardData?.audioStats || {
    totalListens: 0,
    avgListenSeconds: 0,
    autoTriggeredListens: 0,
    activeAudios: 0,
  };
  const dwellStats = dashboardData?.dwellStats || {
    totalDwellMinutes: 0,
    avgDwellMinutes: 0,
    totalDwellEvents: 0,
  };
  const topHotspots = dashboardData?.topHotspots || [];
  const systemOverview = dashboardData?.systemOverview || {
    totalPois: pois.length,
    totalTours: tours.length,
    totalDishes: currentDishes.length,
    totalCheckins: 0,
    totalReviews: 0,
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. TOPBAR */}
      <header className="h-16 bg-white border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40 shadow-xs">
        {/* Left Section: Menu Toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
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

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-2 hidden sm:block">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Tìm kiếm quán ăn, món ăn, tour, tọa độ..."
              className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Quick Cache Evict + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
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

      {/* 2. BODY LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeSidebar={activeSidebar}
          setActiveSidebar={(tab) => setActiveSidebar(tab)}
          poisCount={pois.length}
          toursCount={tours.length}
          onLogout={() => showNotification('info', 'Đã làm mới phiên quản trị!')}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
          {/* Quick Breadcrumb */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                type="button"
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

          {/* Active View Router */}
          {activeSidebar === 'dashboard' && (
            <AdminDashboardView
              activeVisitors={activeVisitors}
              audioStats={audioStats}
              topHotspots={topHotspots}
              dwellStats={dwellStats}
              systemOverview={systemOverview}
              onSelectMetric={(m) => setMetricModalType(m)}
              bottomTab={bottomTab}
              setBottomTab={setBottomTab}
              pois={pois}
              filteredPois={filteredPois}
              ocrPoiId={ocrPoiId}
              setOcrPoiId={setOcrPoiId}
              ocrFile={ocrFile}
              setOcrFile={setOcrFile}
              ocrLoading={ocrLoading}
              ocrItems={ocrItems}
              setOcrItems={setOcrItems}
              onScanMenuOcr={() => handleScanMenuOcr()}
              onSaveOcrDishes={handleSaveOcrDishes}
              onOpenCategoryModal={() => setShowCategoryModal(true)}
              onOpenPoiTypeModal={() => setShowPoiTypeModal(true)}
              onOpenCreatePoiModal={openCreatePoiModal}
              onOpenEditPoiModal={openEditPoiModal}
              onDeletePoi={handleDeletePoi}
              onOpenAudioModal={(id) => setAudioPoiId(id)}
              selectedPoiId={selectedPoiId}
              onSelectPoiId={(id) => setSelectedPoiId(id)}
              dishes={currentDishes}
              onOpenAddDishModal={() => setShowDishModal(true)}
              onDeleteDish={handleDeleteDish}
              cachePattern={cachePattern}
              setCachePattern={setCachePattern}
              onEvictCache={async (pattern) => {
                try {
                  await adminEvictCache(pattern);
                  showNotification('success', `Đã xóa cache với pattern "${pattern}"!`);
                } catch (err: any) {
                  showNotification('error', `Lỗi: ${err.message}`);
                }
              }}
            />
          )}

          {activeSidebar === 'pois' && (
            <AdminPoisView
              filteredPois={filteredPois}
              onOpenCategoryModal={() => setShowCategoryModal(true)}
              onOpenPoiTypeModal={() => setShowPoiTypeModal(true)}
              onOpenCreatePoiModal={openCreatePoiModal}
              onOpenEditPoiModal={openEditPoiModal}
              onDeletePoi={handleDeletePoi}
              onOpenAudioModal={(id) => setAudioPoiId(id)}
            />
          )}

          {activeSidebar === 'menu' && (
            <AdminMenuView
              bottomTab={bottomTab}
              setBottomTab={setBottomTab}
              pois={pois}
              selectedPoiId={selectedPoiId}
              onSelectPoiId={(id) => setSelectedPoiId(id)}
              dishes={currentDishes}
              onOpenAddDishModal={() => setShowDishModal(true)}
              onDeleteDish={handleDeleteDish}
              ocrPoiId={ocrPoiId}
              setOcrPoiId={setOcrPoiId}
              ocrFile={ocrFile}
              setOcrFile={setOcrFile}
              ocrLoading={ocrLoading}
              ocrItems={ocrItems}
              setOcrItems={setOcrItems}
              onScanMenuOcr={() => handleScanMenuOcr()}
              onSaveOcrDishes={handleSaveOcrDishes}
            />
          )}

          {activeSidebar === 'tours' && (
            <AdminToursView
              tours={tours}
              openCreateTourModal={openCreateTourModal}
              handleViewTourDetail={handleViewTourDetail}
              loadingDetailTourId={loadingDetailTourId}
              handleDeleteTour={handleDeleteTour}
            />
          )}

          {activeSidebar === 'users' && <AdminUsersView />}

          {activeSidebar === 'settings' && (
            <AdminSettingsView
              adminEvictCache={adminEvictCache}
              showNotification={showNotification}
            />
          )}
        </main>
      </div>

      {/* 3. MODALS */}
      {showPoiModal && (
        <AdminPoiModal
          editingPoi={editingPoi}
          poiFormData={poiFormData}
          setPoiFormData={setPoiFormData}
          poiImageFile={poiImageFile}
          setPoiImageFile={setPoiImageFile}
          poiAudioFile={poiAudioFile}
          setPoiAudioFile={setPoiAudioFile}
          categoriesList={categoriesList}
          poiTypesList={poiTypesList}
          onOpenCategoryModal={() => setShowCategoryModal(true)}
          onOpenPoiTypeModal={() => setShowPoiTypeModal(true)}
          onClose={() => {
            setShowPoiModal(false);
            setEditingPoi(null);
          }}
          onSave={handleSavePoi}
        />
      )}

      {audioPoiId !== null && (
        <AdminAudioModal
          poiId={audioPoiId}
          poiName={pois.find((p) => p.id === audioPoiId)?.name}
          onClose={() => setAudioPoiId(null)}
          onSuccess={async () => {
            const updated = await fetchPois();
            setPois(updated);
          }}
          showNotification={showNotification}
        />
      )}

      {showCategoryModal && (
        <AdminCategoryModal
          categoriesList={categoriesList}
          onClose={() => setShowCategoryModal(false)}
          onRefresh={loadCategories}
          showNotification={showNotification}
        />
      )}

      {showPoiTypeModal && (
        <AdminPoiTypeModal
          poiTypesList={poiTypesList}
          onClose={() => setShowPoiTypeModal(false)}
          onRefresh={loadPoiTypes}
          showNotification={showNotification}
        />
      )}

      {showTourModal && (
        <AdminTourModal
          pois={pois}
          tourFormData={tourFormData}
          setTourFormData={setTourFormData}
          tourSubmitting={tourSubmitting}
          onClose={() => setShowTourModal(false)}
          onSave={handleSaveTour}
          onAddStop={handleAddTourStop}
          onRemoveStop={handleRemoveTourStop}
        />
      )}

      {activeDetailTour && (
        <AdminTourDetailModal
          tour={activeDetailTour}
          onClose={() => setActiveDetailTour(null)}
        />
      )}

      {showDishModal && (
        <AdminDishModal
          dishFormData={dishFormData}
          setDishFormData={setDishFormData}
          onClose={() => setShowDishModal(false)}
          onSave={handleCreateDish}
        />
      )}

      {metricModalType !== null && (
        <AdminMetricModal
          metricModalType={metricModalType}
          activeVisitors={activeVisitors}
          tours={tours}
          topHotspots={topHotspots}
          pois={pois}
          onEditPoi={openEditPoiModal}
          onClose={() => setMetricModalType(null)}
        />
      )}

      {/* 4. TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white ${
              toast.type === 'success'
                ? 'bg-emerald-600 shadow-emerald-500/20'
                : toast.type === 'error'
                ? 'bg-rose-600 shadow-rose-500/20'
                : 'bg-blue-600 shadow-blue-500/20'
            }`}
          >
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
