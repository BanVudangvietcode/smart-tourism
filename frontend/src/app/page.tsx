'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import HomePage from '@/components/home/HomePage';
import PlacesTab from '@/components/places/PlacesTab';
import FoodTab from '@/components/food/FoodTab';
import ToursTab from '@/components/tours/ToursTab';
import UserMenu from '@/components/auth/UserMenu';
import LanguageSelector from '@/components/common/LanguageSelector';
import AiAssistantModal from '@/components/ai/AiAssistantModal';
import FavoritesModal from '@/components/poi/FavoritesModal';
import PoiDetailModal from '@/components/poi/PoiDetailModal';
import { useLanguage } from '@/contexts/LanguageContext';

import { useRouter, useSearchParams } from 'next/navigation';

const RealMap = dynamic(() => import('@/components/map/Map'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-[#f0f4f8] animate-pulse flex items-center justify-center text-blue-500 font-bold">
      Đang tải bản đồ PostGIS...
    </div>
  ) 
});

function MainApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tk } = useLanguage();
  const currentTab = searchParams.get('tab') || 'home';
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPoiId, setTargetPoiId] = useState<string | number | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [selectedPoiDetailId, setSelectedPoiDetailId] = useState<number | null>(null);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  const setCurrentTab = (tab: string) => {
    router.push(`/?tab=${tab}`, { scroll: false });
  };

  const goToMap = (poiId?: string | number) => {
    if (poiId) {
      setTargetPoiId(poiId);
    }
    setCurrentTab('map');
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col overflow-hidden bg-[#f0f4f8]">

      {/* ============================================================ */}
      {/* THANH TRÊN (Header) - Nổi trên bản đồ (Ẩn khi đang dẫn đường)*/}
      {/* ============================================================ */}
      {!isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none pt-safe">
          <div className="flex items-center justify-between px-2.5 sm:px-4 py-2 sm:py-3 pointer-events-auto max-w-7xl mx-auto">
            
            {/* Logo + Tên app (Bấm vào để về Trang chủ) */}
            <div 
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-lg border border-white/60 cursor-pointer hover:scale-102 active:scale-98 transition shrink-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-md relative shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="leading-tight">
                <h1 className="text-xs sm:text-sm font-extrabold text-gray-900 tracking-tight">Saigon Whispers</h1>
                <p className="text-[9px] text-gray-500 font-medium hidden sm:block">{tk('app_subtitle')}</p>
              </div>
            </div>

            {/* Các nút hành động bên phải: Tự phát + Trợ lý AI + UserMenu */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Nút Tự động phát âm thanh (chỉ hiện khi xem Bản đồ) */}
              {currentTab === 'map' && (
                <button
                  onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                  className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-2xl shadow-lg border flex items-center gap-1.5 transition-all hover:scale-102 active:scale-95 cursor-pointer shrink-0 ${
                    autoPlayEnabled
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white border-emerald-400/30'
                      : 'bg-slate-800/90 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title={autoPlayEnabled ? tk('autoplay_title_on') : tk('autoplay_title_off')}
                >
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 ${
                    autoPlayEnabled ? 'bg-white/25' : 'bg-slate-700'
                  }`}>
                    {autoPlayEnabled ? (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse" />
                    ) : (
                      <span className="text-[9px]">⏸</span>
                    )}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-[11px] font-bold leading-none">
                      {autoPlayEnabled ? tk('autoplay_on') : tk('autoplay_off')}
                    </p>
                    <p className={`text-[8px] leading-none mt-0.5 ${autoPlayEnabled ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {autoPlayEnabled ? tk('autoplay_range') : tk('autoplay_tap_on')}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold md:hidden">
                    {autoPlayEnabled ? tk('autoplay_on') : tk('autoplay_off')}
                  </span>
                </button>
              )}

              {/* Nút Trợ lý AI */}
              <button
                onClick={() => setIsAiOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white p-2 sm:px-3.5 sm:py-2 rounded-2xl shadow-lg border border-purple-400/30 flex items-center gap-1.5 font-bold text-xs active:scale-95 transition cursor-pointer shrink-0"
                title={tk('btn_ai_title')}
              >
                <span className="text-sm">✨</span>
                <span className="hidden sm:inline">{tk('btn_ai_assistant')}</span>
              </button>

              {/* Nút Quán yêu thích */}
              <button
                onClick={() => setIsFavoritesOpen(true)}
                className="bg-white/95 backdrop-blur-md hover:bg-rose-50 text-rose-600 p-2 sm:px-3 sm:py-2 rounded-2xl shadow-lg border border-rose-200/60 flex items-center gap-1.5 font-bold text-xs active:scale-95 transition cursor-pointer shrink-0"
                title={tk('label_favorites')}
              >
                <span className="text-sm">❤️</span>
                <span className="hidden sm:inline text-slate-700">{tk('label_favorites')}</span>
              </button>

              <LanguageSelector />
              <UserMenu onOpenFavorites={() => setIsFavoritesOpen(true)} />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VÙNG NỘI DUNG CHÍNH (Trang chủ hoặc Bản đồ)                   */}
      {/* ============================================================ */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {/* VIEW 1: TRANG CHỦ */}
        <div className={`w-full h-full ${currentTab === 'home' ? 'block' : 'hidden'}`}>
          <HomePage onOpenMap={goToMap} />
        </div>

        {/* VIEW 2: ĐỊA ĐIỂM */}
        <div className={`w-full h-full ${currentTab === 'places' ? 'block' : 'hidden'}`}>
          <PlacesTab onOpenMap={goToMap} />
        </div>

        {/* VIEW 3: BẢN ĐỒ TOÀN MÀN HÌNH (Luôn giữ mounted để mượt mà) */}
        <div className={`w-full h-full ${currentTab === 'map' ? 'block' : 'hidden'}`}>
          <RealMap
            isActive={currentTab === 'map'}
            onNavChange={setIsNavigating}
            targetPoiId={targetPoiId}
            autoPlayEnabled={autoPlayEnabled}
            onToggleAutoPlay={() => setAutoPlayEnabled(!autoPlayEnabled)}
          />
        </div>

        {/* VIEW 4: ẨM THỰC */}
        <div className={`w-full h-full ${currentTab === 'food' ? 'block' : 'hidden'}`}>
          <FoodTab onOpenMap={goToMap} />
        </div>

        {/* VIEW 5: TUYẾN TOUR */}
        <div className={`w-full h-full ${currentTab === 'tours' ? 'block' : 'hidden'}`}>
          <ToursTab onOpenMap={goToMap} />
        </div>
      </div>



      {/* ============================================================ */}
      {/* THANH ĐIỀU HƯỚNG DESKTOP (Ẩn khi đang dẫn đường)            */}
      {/* ============================================================ */}
      {!isNavigating && (
        <div className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 py-3 px-2 gap-1.5">
          {/* Tab 1: Trang chủ */}
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'home'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={tk('nav_home')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
            <span className="text-[10px] font-bold">{tk('nav_home')}</span>
          </button>

          {/* Tab 2: Địa điểm */}
          <button
            onClick={() => setCurrentTab('places')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'places'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={tk('nav_places')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-[10px] font-bold">{tk('nav_places')}</span>
          </button>

          {/* Tab 3: Bản đồ */}
          <button
            onClick={() => setCurrentTab('map')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'map'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={tk('nav_map')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            <span className="text-[10px] font-bold">{tk('nav_map')}</span>
          </button>

          {/* Tab 4: Ẩm thực */}
          <button
            onClick={() => setCurrentTab('food')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'food'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={tk('nav_food')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="text-[10px] font-bold">{tk('nav_food')}</span>
          </button>

          {/* Tab 5: Tuyến */}
          <button
            onClick={() => setCurrentTab('tours')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'tours'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={tk('nav_tours')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            <span className="text-[10px] font-bold">{tk('nav_tours')}</span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* THANH ĐIỀU HƯỚNG MOBILE (Ẩn khi đang dẫn đường)              */}
      {/* ============================================================ */}
      {!isNavigating && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="grid grid-cols-5 items-end px-2 pt-2 pb-2 pb-safe">
              {/* Tab 1: Trang chủ */}
              <button
                onClick={() => setCurrentTab('home')}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 transition cursor-pointer ${
                  currentTab === 'home' ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                <span className="text-[10px]">{tk('nav_home')}</span>
              </button>

              {/* Tab 2: Địa điểm */}
              <button
                onClick={() => setCurrentTab('places')}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 transition cursor-pointer ${
                  currentTab === 'places' ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[10px]">{tk('nav_places')}</span>
              </button>

              {/* Tab 3: Bản đồ (Nút nhô ở giữa) */}
              <div className="flex flex-col items-center justify-end relative h-12 pb-1">
                <button
                  onClick={() => setCurrentTab('map')}
                  className={`absolute -top-[30px] w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    currentTab === 'map'
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-blue-500/30'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white'
                  }`}
                  title={tk('nav_map')}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
                <span className={`text-[10px] font-bold ${currentTab === 'map' ? 'text-blue-600' : 'text-gray-500'}`}>
                  {tk('nav_map')}
                </span>
              </div>

              {/* Tab 4: Ẩm thực */}
              <button
                onClick={() => setCurrentTab('food')}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 transition cursor-pointer ${
                  currentTab === 'food' ? 'text-orange-600 font-bold' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span className="text-[10px]">{tk('nav_food')}</span>
              </button>

              {/* Tab 5: Tuyến */}
              <button
                onClick={() => setCurrentTab('tours')}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 transition cursor-pointer ${
                  currentTab === 'tours' ? 'text-indigo-600 font-bold' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                <span className="text-[10px]">{tk('nav_tours')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI ASSISTANT GLOBAL MODAL */}
      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onSelectPoi={goToMap}
      />

      {/* FAVORITES MODAL */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onSelectPoi={(poi) => goToMap(poi.poiId)}
        onOpenPoiDetail={(poiId) => setSelectedPoiDetailId(poiId)}
      />

      {/* POI DETAIL MODAL FROM FAVORITES */}
      {selectedPoiDetailId && (
        <PoiDetailModal
          poiId={selectedPoiDetailId}
          onClose={() => setSelectedPoiDetailId(null)}
          onNavigate={() => goToMap(selectedPoiDetailId)}
        />
      )}

    </div>
  );
}

export default function Home() {
  return (
    <React.Suspense fallback={<div className="h-screen w-screen bg-[#f0f4f8]" />}>
      <MainApp />
    </React.Suspense>
  );
}
