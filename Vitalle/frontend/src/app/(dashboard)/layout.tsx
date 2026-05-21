'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4D5C3]/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#406B5B] rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white font-heading text-lg font-bold">V</span>
          </div>
          <p className="text-[#406B5B]/60 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4D5C3]/10">
      <Sidebar />
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}
