'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const RealMap = dynamic(() => import('../components/Map'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full bg-blue-50 animate-pulse flex items-center justify-center text-blue-500 font-bold rounded-2xl">Đang tải bản đồ...</div> 
});

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F4F7F9] font-sans text-gray-800 pb-24">
      {/* 1. TOP NAVIGATION */}
      <nav className="bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white relative shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] font-bold text-black">Q4</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Quận 4 Explore</h1>
            <p className="text-[11px] text-gray-500">Khám phá · Ẩm thực · Trải nghiệm</p>
          </div>
        </div>

        {/* Center Menu */}
        <div className="hidden lg:flex items-center gap-6">
          <a href="#" className="flex items-center gap-2 text-blue-600 font-semibold border-b-2 border-blue-600 pb-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
            Trang chủ
          </a>
          <a href="#" className="flex items-center gap-2 text-gray-600 font-medium hover:text-blue-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            Bản đồ
          </a>
          <a href="#" className="flex items-center gap-2 text-gray-600 font-medium hover:text-blue-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Địa điểm
          </a>
          <a href="#" className="flex items-center gap-2 text-gray-600 font-medium hover:text-blue-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Ẩm thực
          </a>
          <a href="#" className="flex items-center gap-2 text-gray-600 font-medium hover:text-blue-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            Tuyến du lịch
          </a>
          <a href="#" className="flex items-center gap-2 text-gray-600 font-medium hover:text-blue-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Hướng dẫn
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 border border-gray-200 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-gray-50">
            <span>🌐</span> Tiếng Việt <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Đang offline
            <div className="w-1.5 h-1.5 bg-white rounded-full ml-1 animate-pulse"></div>
          </div>
          {/* NÚT ĐĂNG NHẬP MỚI */}
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-colors shadow-blue-600/20">
            Đăng nhập
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <div className="relative w-full h-[400px] bg-gray-900 flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 opacity-40 bg-cover bg-center" 
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=2000&auto=format&fit=crop")' }}
        ></div>
        
        <div className="relative z-10 w-full max-w-[1500px] mx-auto px-6 flex justify-between items-center">
          {/* Left Hero Content */}
          <div className="text-white max-w-2xl">
            <h2 className="text-2xl font-medium mb-1">Chào bạn! 👋</h2>
            <h1 className="text-5xl font-extrabold mb-4 leading-tight">
              Tôi là trợ lý du lịch <span className="text-yellow-400">Quận 4</span>
            </h1>
            <p className="text-lg text-gray-200 mb-8 max-w-xl">
              Tự động phát thuyết minh khi bạn đến gần địa điểm, & hỗ trợ đa ngôn ngữ, ngay cả khi không có internet.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                </div>
                <span className="text-sm font-medium">Tự động phát<br/><span className="text-[10px] text-gray-300 font-normal">khi đến gần (≈ 30m)</span></span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                </div>
                <span className="text-sm font-medium">Hoạt động<br/><span className="text-[10px] text-gray-300 font-normal">ngoại tuyến (Offline)</span></span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </div>
                <span className="text-sm font-medium">Quét mã QR<br/><span className="text-[10px] text-gray-300 font-normal">tại trạm xe buýt</span></span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">🌐</span>
                </div>
                <span className="text-sm font-medium">Đa ngôn ngữ<br/><span className="text-[10px] text-gray-300 font-normal">(6 ngôn ngữ)</span></span>
              </div>
            </div>
            <p className="mt-6 font-serif italic text-2xl opacity-90 text-yellow-300">Khám phá Quận 4 - Gần hơn, dễ dàng hơn!</p>
          </div>

          {/* Right Hero Card */}
          <div className="bg-white rounded-3xl p-6 w-[340px] shadow-2xl relative overflow-hidden">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-emerald-600 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Bắt đầu hành trình</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Hệ thống sẽ tự động phát thuyết minh khi bạn đến gần các địa điểm.</p>
              </div>
            </div>
            
            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-6 transition-colors shadow-lg shadow-emerald-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Bật tự động phát
            </button>

            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 font-medium mb-1.5 uppercase">CHỌN NGÔN NGỮ CỦA BẠN</p>
                <button className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 font-medium"><span className="text-base">🇻🇳</span> Tiếng Việt</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              <div className="w-1/3 border-l border-gray-100 pl-4">
                <p className="text-[10px] text-gray-500 font-medium mb-1.5 uppercase">KIỂM TRA OFFLINE</p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-2 rounded-xl">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Đã tải
                  <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <div className="max-w-[1500px] mx-auto w-full px-6 py-8 flex gap-6">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-[260px] shrink-0 flex flex-col gap-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col gap-1">
            <a href="#" className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl font-bold">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
              Trang chủ
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              Bản đồ
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Địa điểm nổi bật
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Ẩm thực
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Tuyến du lịch
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Trạm xe buýt (QR)
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Cài đặt
            </a>
          </div>

          <div className="mt-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 opacity-10">
              <svg width="120" height="120" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L2 12h3v8h14v-8h3L12 2zm0 2.8l5 5V18H7v-8.2l5-5z"/></svg>
            </div>
            <h4 className="font-bold text-gray-900 text-base">Quận 4</h4>
            <p className="text-sm text-gray-500">TP. Hồ Chí Minh</p>
          </div>
        </aside>

        {/* CENTER COLUMN (Map + Places) */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button className="flex items-center gap-2 bg-blue-500 text-white px-6 py-1.5 rounded-md text-sm font-semibold shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                Bản đồ
              </button>
              <button className="flex items-center gap-2 text-gray-600 px-6 py-1.5 rounded-md text-sm font-medium hover:bg-gray-200 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                Danh sách
              </button>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full text-emerald-700 text-xs font-bold border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Đang ở Quận 4
            </div>
          </div>

          <div className="flex gap-6 flex-1 h-[600px]">
            {/* Map Area */}
            <div className="flex-1 bg-blue-50 rounded-2xl border border-blue-100 relative overflow-hidden flex flex-col shadow-inner">
              
              <RealMap />

              {/* Map Legend (Overlay) */}
              <div className="absolute bottom-4 right-4 flex bg-white/90 backdrop-blur rounded-full px-3 py-2 shadow-md gap-3 text-[11px] font-medium border border-gray-100 pointer-events-none z-[1000]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Địa điểm</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Ẩm thực</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Trạm xe buýt</span>
              </div>
            </div>

            {/* POI List Area */}
            <div className="w-[340px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                  Địa điểm gần bạn
                </h3>
                <a href="#" className="text-sm font-medium text-blue-600 hover:underline">Xem tất cả</a>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                {/* POI Item 1 */}
                <div className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0 overflow-hidden shadow-sm">
                    <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=200&auto=format&fit=crop" alt="Food" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Bánh mì Huỳnh Hoa</h4>
                    <div className="flex items-center gap-2 mt-1 mb-1.5 text-[11px] font-bold">
                      <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">≈ 12m</span>
                      <span className="text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">Ẩm thực</span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">Bánh mì ngon nổi tiếng, hương vị đậm đà, đông khách.</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  </button>
                </div>

                {/* POI Item 2 */}
                <div className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors border-t border-gray-100 pt-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0 overflow-hidden shadow-sm">
                    <img src="https://images.unsplash.com/photo-1541888049615-62985160ebbf?q=80&w=200&auto=format&fit=crop" alt="Market" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Chợ 200</h4>
                    <div className="flex items-center gap-2 mt-1 mb-1.5 text-[11px] font-bold">
                      <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">≈ 18m</span>
                      <span className="text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">Chợ - Ẩm thực</span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">Khu chợ sầm uất với nhiều món ăn đặc sản và hàng hóa địa phương.</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  </button>
                </div>

                {/* POI Item 3 */}
                <div className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors border-t border-gray-100 pt-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0 overflow-hidden shadow-sm">
                    <img src="https://images.unsplash.com/photo-1548625361-ec85cb805a8d?q=80&w=200&auto=format&fit=crop" alt="Church" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Nhà thờ Xóm Chiếu</h4>
                    <div className="flex items-center gap-2 mt-1 mb-1.5 text-[11px] font-bold">
                      <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">≈ 28m</span>
                      <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Di tích - Tôn giáo</span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">Nhà thờ cổ kính, mang đậm dấu ấn lịch sử Quận 4.</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  </button>
                </div>

                {/* POI Item 4 */}
                <div className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors border-t border-gray-100 pt-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0 overflow-hidden shadow-sm">
                    <img src="https://images.unsplash.com/photo-1506461883276-594c397e4368?q=80&w=200&auto=format&fit=crop" alt="River" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Bến Vân Đồn</h4>
                    <div className="flex items-center gap-2 mt-1 mb-1.5 text-[11px] font-bold">
                      <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">≈ 35m</span>
                      <span className="text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded">Danh thắng</span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">Không gian ven sông thoáng mát, phù hợp để dạo bộ, chụp ảnh.</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[300px] shrink-0 flex flex-col gap-6">
          {/* Bus QR Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Trạm xe buýt & QR</h4>
                <p className="text-[10px] text-gray-500">Quét mã QR để nghe thuyết minh</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">Khánh Hội</h5>
                    <p className="text-[10px] text-gray-500">Tuyến: 01, 02, 52, 56</p>
                  </div>
                </div>
                <div className="w-6 h-6 border border-gray-300 rounded overflow-hidden p-0.5">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-gray-800"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-2 3h2v2h-2v-2zm-1-3h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm2 2h2v2h-2v-2z" /></svg>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">Vĩnh Hội</h5>
                    <p className="text-[10px] text-gray-500">Tuyến: 01, 08, 56</p>
                  </div>
                </div>
                <div className="w-6 h-6 border border-gray-300 rounded overflow-hidden p-0.5">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-gray-800"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-2 3h2v2h-2v-2zm-1-3h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm2 2h2v2h-2v-2z" /></svg>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">Xóm Chiếu</h5>
                    <p className="text-[10px] text-gray-500">Tuyến: 04, 18, 45</p>
                  </div>
                </div>
                <div className="w-6 h-6 border border-gray-300 rounded overflow-hidden p-0.5">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-gray-800"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-2 3h2v2h-2v-2zm-1-3h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm2 2h2v2h-2v-2z" /></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Languages Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="text-lg leading-none">🌐</span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm">Tùy chọn ngôn ngữ</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center border-2 border-blue-500 rounded-xl p-3 bg-blue-50/50">
                <span className="text-2xl mb-1 drop-shadow-sm">🇻🇳</span>
                <span className="text-[11px] font-bold text-blue-700">Tiếng Việt</span>
              </button>
              <button className="flex flex-col items-center justify-center border border-gray-100 rounded-xl p-3 hover:bg-gray-50">
                <span className="text-2xl mb-1 drop-shadow-sm">🇬🇧</span>
                <span className="text-[11px] font-bold text-gray-600">English</span>
              </button>
              <button className="flex flex-col items-center justify-center border border-gray-100 rounded-xl p-3 hover:bg-gray-50">
                <span className="text-2xl mb-1 drop-shadow-sm">🇨🇳</span>
                <span className="text-[11px] font-bold text-gray-600">中文</span>
              </button>
              <button className="flex flex-col items-center justify-center border border-gray-100 rounded-xl p-3 hover:bg-gray-50">
                <span className="text-2xl mb-1 drop-shadow-sm">🇰🇷</span>
                <span className="text-[11px] font-bold text-gray-600">한국어</span>
              </button>
              <button className="flex flex-col items-center justify-center border border-gray-100 rounded-xl p-3 hover:bg-gray-50">
                <span className="text-2xl mb-1 drop-shadow-sm">🇯🇵</span>
                <span className="text-[11px] font-bold text-gray-600">日本語</span>
              </button>
              <button className="flex flex-col items-center justify-center border border-gray-100 rounded-xl p-3 hover:bg-gray-50">
                <span className="text-2xl mb-1 drop-shadow-sm">🇫🇷</span>
                <span className="text-[11px] font-bold text-gray-600">Français</span>
              </button>
            </div>
          </div>

          {/* Offline Status Footer */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 mt-auto">
            <div className="flex items-center gap-2 mb-2 text-emerald-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
              <h4 className="font-bold text-sm">Bạn đang offline</h4>
            </div>
            <p className="text-[11px] text-emerald-600/80 mb-3 leading-relaxed">
              Đã tải sẵn bản đồ Quận 4.<br/>
              Vẫn có thể sử dụng đầy đủ tính năng.
            </p>
            <a href="#" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              Quản lý dữ liệu offline <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
        </aside>
      </div>

      {/* 4. BOTTOM PLAYER */}
      <div className="fixed bottom-0 left-0 right-0 h-[88px] bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] z-50 px-6 flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-[300px]">
          <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden shrink-0 shadow-sm relative">
            <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=200&auto=format&fit=crop" alt="Playing" className="w-full h-full object-cover" />
            <div className="absolute inset-0 border border-black/5 rounded-full"></div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Đang phát:</p>
            <h4 className="font-bold text-gray-900 text-sm truncate w-48">Bánh mì Huỳnh Hoa</h4>
            <p className="text-[11px] text-gray-500 truncate w-48 mt-0.5">Ẩm thực · Cách bạn khoảng 12m</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 max-w-2xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-6 mb-2 text-gray-800">
            <button className="hover:text-blue-600 transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
            <button className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-md hover:scale-105 transform">
              <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button className="hover:text-blue-600 transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
          </div>
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] font-medium text-gray-500">0:15</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden relative cursor-pointer">
              <div className="absolute top-0 left-0 h-full bg-blue-600 w-[20%] rounded-full"></div>
            </div>
            <span className="text-[10px] font-medium text-gray-500">1:20</span>
          </div>
        </div>

        {/* Extra Actions */}
        <div className="w-[300px] flex items-center justify-end gap-5 text-gray-500">
          <button className="hover:text-gray-800 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg></button>
          <button className="hover:text-gray-800 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <button className="hover:text-gray-800 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg></button>
        </div>
      </div>
    </div>
  );
}
