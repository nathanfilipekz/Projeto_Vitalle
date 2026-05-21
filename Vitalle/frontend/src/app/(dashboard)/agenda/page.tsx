'use client';

import { Header } from '@/components/layout/header';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Loader2,
  CalendarX,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth-store';
import {
  listAppointmentsInRange,
  type AppointmentRow,
} from '@/services/appointments-service';
import { NewAppointmentModal } from '@/components/dashboard/new-appointment-modal';
import { EditAppointmentModal } from '@/components/dashboard/edit-appointment-modal';

type ViewMode = 'day' | 'week' | 'month';

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-[#406B5B] border-[#406B5B]',
  SCHEDULED: 'bg-[#91AE9E] border-[#91AE9E]',
  CANCELED: 'bg-red-400 border-red-400',
  RESCHEDULED: 'bg-[#B89D83] border-[#B89D83]',
  COMPLETED: 'bg-gray-400 border-gray-400',
  NO_SHOW: 'bg-gray-300 border-gray-300',
};

function rangeFor(mode: ViewMode, current: Date): { start: Date; end: Date } {
  if (mode === 'day') return { start: startOfDay(current), end: endOfDay(current) };
  if (mode === 'week')
    return { start: startOfWeek(current, { weekStartsOn: 1 }), end: endOfWeek(current, { weekStartsOn: 1 }) };
  return { start: startOfMonth(current), end: endOfMonth(current) };
}

function formatRangeLabel(mode: ViewMode, current: Date): string {
  const { start, end } = rangeFor(mode, current);
  if (mode === 'day') {
    return format(current, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }
  if (mode === 'week') {
    return `${format(start, 'dd MMM', { locale: ptBR })} - ${format(end, 'dd MMM yyyy', { locale: ptBR })}`;
  }
  return format(current, "MMMM 'de' yyyy", { locale: ptBR });
}

export default function AgendaPage() {
  const user = useAuthStore((s) => s.user);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<AppointmentRow | null>(null);

  const range = useMemo(() => rangeFor(viewMode, currentDate), [viewMode, currentDate]);

  const fetchData = useCallback(async () => {
    if (!user?.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listAppointmentsInRange(
        user.tenantId,
        range.start.toISOString(),
        // listAppointmentsInRange usa < endIso, então passamos start do dia seguinte
        new Date(range.end.getTime() + 1).toISOString(),
      );
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, range.start, range.end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNavigate = (direction: 1 | -1) => {
    setCurrentDate((d) => {
      if (viewMode === 'day') return addDays(d, direction);
      if (viewMode === 'week') return addWeeks(d, direction);
      return addMonths(d, direction);
    });
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleCreated = (apt: AppointmentRow) => {
    setAppointments((prev) => {
      // Só insere visualmente se cair na janela atual.
      const aptDate = new Date(apt.date_time);
      if (aptDate >= range.start && aptDate <= range.end) {
        return [...prev, apt].sort(
          (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime(),
        );
      }
      return prev;
    });
    // Recarrega para garantir sincronia
    fetchData();
  };

  return (
    <div>
      <Header title="Agenda" subtitle="Gerencie seus horários e consultas" />

      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-xl border border-[#E4D5C3] p-1">
              <button
                onClick={() => handleNavigate(-1)}
                className="p-2 rounded-lg hover:bg-[#E4D5C3]/30 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4 text-[#406B5B]" />
              </button>
              <span className="px-3 text-sm font-medium text-[#406B5B] capitalize min-w-[220px] text-center">
                {formatRangeLabel(viewMode, currentDate)}
              </span>
              <button
                onClick={() => handleNavigate(1)}
                className="p-2 rounded-lg hover:bg-[#E4D5C3]/30 transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="w-4 h-4 text-[#406B5B]" />
              </button>
            </div>

            <button
              onClick={handleToday}
              className="px-4 py-2.5 text-sm font-medium text-[#406B5B] bg-[#E4D5C3]/30 hover:bg-[#E4D5C3]/50 rounded-xl transition-colors"
            >
              Hoje
            </button>

            <input
              type="date"
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setCurrentDate(new Date(`${v}T12:00:00`));
              }}
              className="px-3 py-2 text-sm bg-white border border-[#E4D5C3] rounded-xl text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-xl border border-[#E4D5C3] p-1">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    viewMode === mode
                      ? 'bg-[#406B5B] text-white'
                      : 'text-[#406B5B]/60 hover:text-[#406B5B]'
                  }`}
                >
                  {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setOpenNew(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#406B5B] text-white rounded-xl hover:bg-[#406B5B]/90 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Consulta
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E4D5C3]/50 shadow-sm overflow-hidden min-h-[420px]">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-[#406B5B]/60">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando agenda...</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#406B5B]/50">
              <CalendarX className="w-10 h-10" />
              <p className="text-sm">
                Nenhuma consulta neste{' '}
                {viewMode === 'day' ? 'dia' : viewMode === 'week' ? 'período (semana)' : 'mês'}.
              </p>
            </div>
          ) : (
            <AppointmentsList
              appointments={appointments}
              viewMode={viewMode}
              currentDate={currentDate}
              onSelect={setEditing}
            />
          )}
        </div>

        <div className="mt-4 flex items-center flex-wrap gap-6">
          <Legend color="bg-[#406B5B]" label="Confirmado" />
          <Legend color="bg-[#91AE9E]" label="Agendado" />
          <Legend color="bg-[#B89D83]" label="Reagendado" />
          <Legend color="bg-red-400" label="Cancelado" />
        </div>
      </div>

      <NewAppointmentModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreated={handleCreated}
        defaultDate={format(currentDate, 'yyyy-MM-dd')}
      />

      <EditAppointmentModal
        open={!!editing}
        appointment={editing}
        onClose={() => setEditing(null)}
        onUpdated={() => fetchData()}
      />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-xs text-[#406B5B]/60">{label}</span>
    </div>
  );
}

function AppointmentsList({
  appointments,
  viewMode,
  currentDate,
  onSelect,
}: {
  appointments: AppointmentRow[];
  viewMode: ViewMode;
  currentDate: Date;
  onSelect: (apt: AppointmentRow) => void;
}) {
  if (viewMode === 'day') {
    return (
      <ul className="divide-y divide-[#E4D5C3]/30">
        {appointments.map((apt) => (
          <AppointmentItem key={apt.id} apt={apt} showDate={false} onClick={() => onSelect(apt)} />
        ))}
      </ul>
    );
  }

  // Semana ou mês: agrupar por dia
  const groups = new Map<string, AppointmentRow[]>();
  for (const apt of appointments) {
    const key = format(new Date(apt.date_time), 'yyyy-MM-dd');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(apt);
  }

  const sortedKeys = Array.from(groups.keys()).sort();
  return (
    <div className="divide-y divide-[#E4D5C3]/30">
      {sortedKeys.map((key) => {
        const day = new Date(`${key}T12:00:00`);
        const items = groups.get(key)!;
        const isToday = isSameDay(day, new Date());
        const isFocus = isSameDay(day, currentDate);
        return (
          <section key={key}>
            <header
              className={`px-6 py-3 text-xs font-semibold uppercase tracking-wide flex items-center gap-2 ${
                isToday
                  ? 'bg-[#406B5B]/10 text-[#406B5B]'
                  : isFocus
                    ? 'bg-[#E4D5C3]/30 text-[#406B5B]'
                    : 'bg-[#E4D5C3]/10 text-[#406B5B]/60'
              }`}
            >
              {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              {isToday && (
                <span className="px-2 py-0.5 rounded-full bg-[#406B5B] text-white text-[10px] normal-case">
                  Hoje
                </span>
              )}
            </header>
            <ul className="divide-y divide-[#E4D5C3]/30">
              {items.map((apt) => (
                <AppointmentItem key={apt.id} apt={apt} showDate={false} onClick={() => onSelect(apt)} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

const statusBadgeLabels: Record<string, string> = {
  CONFIRMED: 'Confirmado',
  SCHEDULED: 'Agendado',
  CANCELED: 'Cancelado',
  RESCHEDULED: 'Reagendado',
  COMPLETED: 'Concluído',
  NO_SHOW: 'Faltou',
};

function AppointmentItem({
  apt,
  showDate,
  onClick,
}: {
  apt: AppointmentRow;
  showDate: boolean;
  onClick: () => void;
}) {
  const dt = new Date(apt.date_time);
  const time = format(dt, 'HH:mm');
  const patientName = apt.patients?.name || 'Paciente';
  const color = statusColors[apt.status] || statusColors.SCHEDULED;

  return (
    <li className="flex min-h-[56px]">
      <div className="w-24 flex-shrink-0 flex flex-col items-end justify-center pr-4 border-r border-[#E4D5C3]/30">
        <span className="text-sm font-mono font-semibold text-[#406B5B]">{time}</span>
        {showDate && (
          <span className="text-[11px] text-[#406B5B]/50">
            {format(dt, 'dd/MM', { locale: ptBR })}
          </span>
        )}
      </div>
      <div className="flex-1 p-3">
        <button
          type="button"
          onClick={onClick}
          className={`p-3 rounded-xl text-white ${color} w-full text-left hover:opacity-90 transition-opacity`}
          title="Clique para editar / alterar status"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{patientName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-semibold">
                {statusBadgeLabels[apt.status]}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{apt.duration}min</span>
              </div>
            </div>
          </div>
          {apt.type && <p className="text-xs opacity-80 mt-1">{apt.type}</p>}
        </button>
      </div>
    </li>
  );
}
