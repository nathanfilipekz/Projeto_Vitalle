'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from '@/components/layout/header';
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { SalesLineChart } from '@/components/dashboard/sales-line-chart';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { NewAppointmentModal } from '@/components/dashboard/new-appointment-modal';
import { NewPatientModal } from '@/components/dashboard/new-patient-modal';
import { EditAppointmentModal } from '@/components/dashboard/edit-appointment-modal';
import { useAuthStore } from '@/store/auth-store';
import {
  fetchDashboardData,
  type DashboardData,
} from '@/services/dashboard-service';
import type { AppointmentRow } from '@/services/appointments-service';

// Paleta alinhada à da Agenda (vide src/app/(dashboard)/agenda/page.tsx)
// para que o status escolhido na Agenda apareça com a mesma cor aqui
// na lista "Consultas de Hoje" do Dashboard.
const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-[#406B5B] text-white',
  SCHEDULED: 'bg-[#91AE9E] text-white',
  CANCELED: 'bg-red-400 text-white',
  RESCHEDULED: 'bg-[#B89D83] text-white',
  COMPLETED: 'bg-gray-400 text-white',
  NO_SHOW: 'bg-gray-300 text-gray-800',
};

const statusLabels: Record<string, string> = {
  CONFIRMED: 'Confirmado',
  SCHEDULED: 'Agendado',
  CANCELED: 'Cancelado',
  RESCHEDULED: 'Reagendado',
  COMPLETED: 'Concluído',
  NO_SHOW: 'Faltou',
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAppointment, setOpenAppointment] = useState(false);
  const [openPatient, setOpenPatient] = useState(false);
  const [editing, setEditing] = useState<AppointmentRow | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData(user.tenantId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Mantém o Dashboard sincronizado com a Agenda: sempre que a aba do
  // Dashboard volta a ficar visível (por ex., usuário muda status na
  // Agenda e clica de volta no Dashboard) refaz a leitura no Supabase.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [refresh]);

  const stats = data?.stats;
  const cards = [
    {
      label: 'Consultas Hoje',
      value: stats ? String(stats.consultasHoje) : '0',
      icon: Calendar,
      change: stats?.consultasHojeDeltaLabel || '...',
      color: 'bg-[#406B5B]',
    },
    {
      label: 'Pacientes Ativos',
      value: stats ? String(stats.pacientesAtivos) : '0',
      icon: Users,
      change: stats?.pacientesAtivosDeltaLabel || '...',
      color: 'bg-[#91AE9E]',
    },
    {
      label: 'Confirmadas',
      value: stats ? String(stats.confirmadas) : '0',
      icon: CheckCircle2,
      change: stats ? `${stats.confirmadasPct}%` : '0%',
      color: 'bg-[#B89D83]',
    },
    {
      label: 'Canceladas',
      value: stats ? String(stats.canceladas) : '0',
      icon: XCircle,
      change: stats ? `${stats.canceladasPct}%` : '0%',
      color: 'bg-red-400',
    },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="Visão geral do seu consultório" />

      <div className="p-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-[#E4D5C3]/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#406B5B]/60 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-[#406B5B] mt-2">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}
                  </p>
                  <p className="text-xs text-[#91AE9E] mt-1 font-medium">{stat.change}</p>
                </div>
                <div
                  className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <SalesLineChart />
          <TopProductsChart />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4D5C3]/50 shadow-sm">
            <div className="p-6 border-b border-[#E4D5C3]/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-heading font-semibold text-[#406B5B]">
                  Consultas de Hoje
                </h2>
                <Link
                  href="/agenda"
                  className="text-sm text-[#91AE9E] hover:text-[#406B5B] font-medium transition-colors"
                >
                  Ver agenda completa
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-[#406B5B]/60">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Carregando consultas...
              </div>
            ) : data && data.todayAppointments.length === 0 ? (
              <div className="py-16 text-center text-sm text-[#406B5B]/60">
                Nenhuma consulta agendada para hoje.
              </div>
            ) : (
              <div className="divide-y divide-[#E4D5C3]/30">
                {data?.todayAppointments.map((apt) => {
                  const dt = new Date(apt.date_time);
                  return (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => setEditing(apt)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#E4D5C3]/10 transition-colors text-left"
                      title="Clique para editar a consulta ou trocar o status"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono font-semibold text-[#406B5B] w-14">
                          {format(dt, 'HH:mm', { locale: ptBR })}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-[#406B5B]">
                            {apt.patients?.name || 'Paciente'}
                          </p>
                          <p className="text-xs text-[#406B5B]/50">{apt.type || '-'}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[apt.status]}`}
                      >
                        {statusLabels[apt.status]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E4D5C3]/50 shadow-sm">
              <h2 className="text-lg font-heading font-semibold text-[#406B5B] mb-4">
                Ações Rápidas
              </h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setOpenAppointment(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#406B5B]/5 hover:bg-[#406B5B]/10 transition-colors group text-left"
                >
                  <Calendar className="w-5 h-5 text-[#406B5B] group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-[#406B5B]">Nova Consulta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenPatient(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#91AE9E]/10 hover:bg-[#91AE9E]/20 transition-colors group text-left"
                >
                  <Users className="w-5 h-5 text-[#406B5B] group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-[#406B5B]">Novo Paciente</span>
                </button>
              </div>
            </div>

            <div className="bg-[#91AE9E]/10 rounded-2xl p-6 border border-[#91AE9E]/30">
              <h2 className="text-lg font-heading font-semibold text-[#406B5B] mb-4">Lembretes</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-[#B89D83] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#406B5B]">3 pacientes sem retorno há 90 dias</p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-[#91AE9E] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#406B5B]">5 aniversariantes do mês</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NewAppointmentModal
        open={openAppointment}
        onClose={() => setOpenAppointment(false)}
        onCreated={() => refresh()}
      />
      <NewPatientModal
        open={openPatient}
        onClose={() => setOpenPatient(false)}
        onCreated={() => refresh()}
      />
      <EditAppointmentModal
        open={!!editing}
        appointment={editing}
        onClose={() => setEditing(null)}
        onUpdated={() => refresh()}
      />
    </div>
  );
}
