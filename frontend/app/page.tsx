'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const RealMap = dynamic(() => import('../components/Map'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full bg-[#f0f4f8] animate-pulse flex items-center justify-center text-blue-500 font-bold">Đang tải bản đồ...</div> 
});

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f0f4f8] relative">

      {/* ============================================================ */}
      {/* THANH TRÊN (Header) - Nổi trên bản đồ                        */}
      {/* ============================================================ */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="flex items-center justify-between px-4 py-3 pointer-events-auto">
          
          {/* Logo + Tên app */}
          <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg border border-white/50">
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
          <button className="bg-white/90 backdrop-blur-md p-2.5 rounded-2xl shadow-lg border border-white/50 text-gray-700 hover:bg-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BẢN ĐỒ TOÀN MÀN HÌNH (Lớp chính)                           */}
      {/* ============================================================ */}
      <div className="flex-1 w-full relative">
        <RealMap />
      </div>

      {/* ============================================================ */}
      {/* NÚT TỰ ĐỘNG PHÁT (Floating - Góc phải)                      */}
      {/* ============================================================ */}
      <div className="absolute right-4 bottom-28 lg:bottom-8 z-40 flex flex-col gap-3 items-end">
        {/* Nút Tự động phát */}
        <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 border border-blue-400/30">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-none">Tự động phát</p>
            <p className="text-[9px] text-blue-100 leading-none mt-0.5">Thuyết minh khi đến gần</p>
          </div>
        </button>
      </div>

      {/* ============================================================ */}
      {/* BRANDING - Tên app góc dưới trái (Desktop)                   */}
      {/* ============================================================ */}
      <div className="hidden lg:flex absolute bottom-4 left-4 z-40 bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border border-white/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-800 leading-none">Saigon Whispers</p>
            <p className="text-[9px] text-gray-400 leading-none mt-0.5">Quận 4 • TP.HCM</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* THANH ĐIỀU HƯỚNG DESKTOP (Nổi bên trái)                      */}
      {/* ============================================================ */}
      <div className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 flex-col bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 py-2 px-1.5 gap-1">
        <button className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 transition" title="Trang chủ">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
          <span className="text-[9px] font-bold">Trang chủ</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Bản đồ">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          <span className="text-[9px] font-bold">Bản đồ</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Địa điểm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-[9px] font-bold">Địa điểm</span>
        </button>
        <button className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Ẩm thực">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span className="text-[9px] font-bold">Ẩm thực</span>
        </button>
        <div className="border-t border-gray-200 my-1"></div>
        <button className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Cài đặt">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-[9px] font-bold">Cài đặt</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* THANH ĐIỀU HƯỚNG MOBILE (Dưới màn hình, Tab Bản đồ nhô lên)  */}
      {/* ============================================================ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Tên app nhỏ phía trên thanh nav */}
        <div className="flex justify-center mb-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-white/50">
            <p className="text-[10px] font-bold text-gray-500 tracking-wider">SAIGON WHISPERS</p>
          </div>
        </div>
        
        {/* Thanh điều hướng */}
        <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] relative">
          {/* Nút Bản đồ nhô lên (Center Floating) */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10">
            <button className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white text-white hover:scale-105 active:scale-95 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-end justify-around px-4 pt-2 pb-2 pb-safe">
            {/* Tab 1: Trang chủ */}
            <button className="flex flex-col items-center gap-0.5 py-1 px-3 text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
              <span className="text-[10px] font-bold">Trang chủ</span>
            </button>

            {/* Tab 2: Địa điểm */}
            <button className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-[10px] font-medium">Địa điểm</span>
            </button>

            {/* Tab 3: Bản đồ (GIỮA - Vùng trống cho nút nhô) */}
            <div className="flex flex-col items-center gap-0.5 py-1 px-5">
              <div className="h-5"></div>
              <span className="text-[10px] font-bold text-blue-600">Bản đồ</span>
            </div>

            {/* Tab 4: Ẩm thực */}
            <button className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="text-[10px] font-medium">Ẩm thực</span>
            </button>

            {/* Tab 5: Tuyến */}
            <button className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <span className="text-[10px] font-medium">Tuyến</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
