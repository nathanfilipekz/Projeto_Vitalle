'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="h-20 bg-white border-b border-[#E4D5C3] flex items-center justify-between px-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-[#406B5B]">{title}</h1>
        {subtitle && <p className="text-sm text-[#406B5B]/60 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
          <input
            type="text"
            placeholder="Buscar paciente, consulta..."
            className="pl-10 pr-4 py-2.5 w-72 bg-[#E4D5C3]/30 border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 focus:border-[#406B5B]/30"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-[#406B5B]/60 hover:bg-[#E4D5C3]/30 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#B89D83] rounded-full border-2 border-white" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-3 pl-4 border-l border-[#E4D5C3]">
          <div className="w-9 h-9 bg-[#406B5B] rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'V'}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-[#406B5B]">{user?.name || 'Dr. Exemplo'}</p>
            <p className="text-xs text-[#406B5B]/50">Médico</p>
          </div>
        </div>
      </div>
    </header>
  );
}
