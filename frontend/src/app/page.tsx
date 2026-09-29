'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import HomePage from '@/components/home/HomePage';
import PlacesTab from '@/components/places/PlacesTab';
import FoodTab from '@/components/food/FoodTab';
import ToursTab from '@/components/tours/ToursTab';

import { useRouter, useSearchParams } from 'next/navigation';

const RealMap = dynamic(() => import('@/components/map/Map'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-[#f0f4f8] animate-pulse flex items-center justify-center text-blue-500 font-bold">
      Đang tải bản đồ...
    </div>
  ) 
});

function MainApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'home';
  const [isNavigating, setIsNavigating] = useState(false);

  const setCurrentTab = (tab: string) => {
    router.push(`/?tab=${tab}`, { scroll: false });
  };

  const goToMap = () => {
    setCurrentTab('map');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f0f4f8] relative">

      {/* ============================================================ */}
      {/* THANH TRÊN (Header) - Nổi trên bản đồ (Ẩn khi đang dẫn đường)*/}
      {/* ============================================================ */}
      {!isNavigating && (
        <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
          <div className="flex items-center justify-between px-4 py-3 pointer-events-auto">
            
            {/* Logo + Tên app (Bấm vào để về Trang chủ) */}
            <div 
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg border border-white/60 cursor-pointer hover:scale-102 active:scale-98 transition"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-md relative">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-gray-900 leading-none tracking-tight">Saigon Whispers</h1>
                <p className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">Thì Thầm Sài Gòn</p>
              </div>
            </div>

            {/* Nút 3 gạch (Hamburger Menu) */}
            <button className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-lg border border-white/60 text-gray-700 hover:bg-white transition cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VÙNG NỘI DUNG CHÍNH (Trang chủ hoặc Bản đồ)                   */}
      {/* ============================================================ */}
      <div className="flex-1 w-full relative overflow-hidden">
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
          <RealMap isActive={currentTab === 'map'} onNavChange={setIsNavigating} />
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
      {/* NÚT TỰ ĐỘNG PHÁT (Chỉ hiện khi ở tab Bản đồ và không dẫn đường)*/}
      {/* ============================================================ */}
      {currentTab === 'map' && !isNavigating && (
        <div className="absolute right-4 top-16 lg:top-4 lg:right-20 z-40 flex items-center">
          <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-3.5 py-2 lg:px-4 lg:py-2.5 rounded-2xl shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-blue-400/30 backdrop-blur-sm cursor-pointer">
            <div className="w-6 h-6 lg:w-7 lg:h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 ml-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-[11px] lg:text-xs font-bold leading-none">Tự động phát</p>
              <p className="text-[8px] lg:text-[9px] text-blue-100 leading-none mt-0.5">Khi đến gần</p>
            </div>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* THANH ĐIỀU HƯỚNG DESKTOP (Ẩn khi đang dẫn đường)            */}
      {/* ============================================================ */}
      {!isNavigating && (
        <div className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 py-3 px-2 gap-1.5">
          {/* Tab 1: Trang chủ */}
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'home'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Trang chủ"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
            <span className="text-[10px] font-bold">Trang chủ</span>
          </button>

          {/* Tab 2: Địa điểm */}
          <button
            onClick={() => setCurrentTab('places')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'places'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Địa điểm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-[10px] font-bold">Địa điểm</span>
          </button>

          {/* Tab 3: Bản đồ */}
          <button
            onClick={() => setCurrentTab('map')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'map'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Bản đồ"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            <span className="text-[10px] font-bold">Bản đồ</span>
          </button>

          {/* Tab 4: Ẩm thực */}
          <button
            onClick={() => setCurrentTab('food')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'food'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Ẩm thực"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="text-[10px] font-bold">Ẩm thực</span>
          </button>

          {/* Tab 5: Tuyến */}
          <button
            onClick={() => setCurrentTab('tours')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition cursor-pointer ${
              currentTab === 'tours'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Tuyến"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            <span className="text-[10px] font-bold">Tuyến</span>
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
                <span className="text-[10px]">Trang chủ</span>
              </button>

              {/* Tab 2: Địa điểm */}
              <button
                onClick={() => setCurrentTab('places')}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 transition cursor-pointer ${
                  currentTab === 'places' ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[10px]">Địa điểm</span>
              </button>

              {/* Tab 3: Bản đồ (Nút nhô ở giữa, căn chuẩn trục giữa) */}
              <div className="flex flex-col items-center justify-end relative h-12 pb-1">
                <button
                  onClick={() => setCurrentTab('map')}
                  className={`absolute -top-[30px] w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    currentTab === 'map'
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-blue-500/30'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white'
                  }`}
                  title="Bản đồ"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
                <span className={`text-[10px] font-bold ${currentTab === 'map' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Bản đồ
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
                <span className="text-[10px]">Ẩm thực</span>
              </button>

              {/* Tab 5: Tuyến */}
              <button
                onClick={() => setCurrentTab('tours')}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 transition cursor-pointer ${
                  currentTab === 'tours' ? 'text-indigo-600 font-bold' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                <span className="text-[10px]">Tuyến</span>
              </button>
            </div>
          </div>
        </div>
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
