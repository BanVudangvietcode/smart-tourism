'use client';

import { useEffect, useState } from 'react';
import { checkHealth } from '../lib/api';

export default function Header() {
  const [health, setHealth] = useState<string>('Đang kiểm tra...');

  useEffect(() => {
    checkHealth().then(res => {
      setHealth(res.status === 'ok' ? 'Hệ thống trực tuyến' : 'Ngoại tuyến');
    });
  }, []);

  return (
    <header className="glass-panel sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--brand-accent)] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            Q4
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] tracking-tight">
            Taste of <span className="text-[var(--text-secondary)] font-normal">Quận 4</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 border border-[var(--border-subtle)] rounded-full text-xs font-medium text-[var(--text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <span className={`w-2 h-2 rounded-full ${health.includes('trực tuyến') ? 'bg-[#34C759]' : 'bg-[#FF3B30]'} shadow-sm`}></span>
          <span className="hidden sm:inline">{health}</span>
        </div>
      </div>
    </header>
  );
}

