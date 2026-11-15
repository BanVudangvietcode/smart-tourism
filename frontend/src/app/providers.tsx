'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import LoginModal from '@/components/auth/LoginModal';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
        <LoginModal />
      </AuthProvider>
    </LanguageProvider>
  );
}
