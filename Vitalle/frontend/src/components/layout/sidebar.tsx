'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  ClipboardList,
  TrendingUp,
  DollarSign,
  Settings,
  LogOut,
  MessageSquare,
  Building2,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Pacientes', href: '/pacientes', icon: Users },
  { name: 'Anamnese', href: '/anamnese', icon: ClipboardList },
  { name: 'Prontuário', href: '/prontuario', icon: FileText },
  { name: 'Evolução', href: '/evolucao', icon: TrendingUp },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-[#E4D5C3] flex flex-col">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-[#E4D5C3]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#406B5B] rounded-full flex items-center justify-center">
            <span className="text-white font-heading text-base font-bold">V</span>
          </div>
          <span className="font-heading text-xl text-[#406B5B] font-semibold tracking-wide">
            VITALLE
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#406B5B] text-white shadow-sm'
                  : 'text-[#406B5B]/70 hover:bg-[#91AE9E]/10 hover:text-[#406B5B]'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-[#E4D5C3]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 bg-[#91AE9E]/30 rounded-full flex items-center justify-center">
            <span className="text-[#406B5B] font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#406B5B] truncate">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-[#406B5B]/50 truncate">{user?.role || 'DOCTOR'}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-[#406B5B]/50 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
