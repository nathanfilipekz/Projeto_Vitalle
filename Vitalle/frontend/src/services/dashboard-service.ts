import { supabase } from '@/lib/supabase';
import { endOfDay, format, startOfDay, startOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AppointmentRow } from './appointments-service';

export interface DashboardStats {
  consultasHoje: number;
  consultasHojeDeltaLabel: string;
  pacientesAtivos: number;
  pacientesAtivosDeltaLabel: string;
  confirmadas: number;
  confirmadasPct: number;
  canceladas: number;
  canceladasPct: number;
}

export interface DashboardData {
  stats: DashboardStats;
  todayAppointments: AppointmentRow[];
}

async function countAppointmentsToday(tenantId: string, start: Date, end: Date): Promise<number> {
  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .not('status', 'in', '("CANCELED","NO_SHOW")')
    .gte('date_time', start.toISOString())
    .lte('date_time', end.toISOString());
  if (error) throw new Error(error.message);
  return count || 0;
}

async function countAppointmentsTodayByStatus(
  tenantId: string,
  start: Date,
  end: Date,
  status: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', status)
    .gte('date_time', start.toISOString())
    .lte('date_time', end.toISOString());
  if (error) throw new Error(error.message);
  return count || 0;
}

async function countActivePatients(tenantId: string): Promise<number> {
  const { count, error } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .is('deleted_at', null);
  if (error) throw new Error(error.message);
  return count || 0;
}

async function countPatientsCreatedSince(tenantId: string, since: Date): Promise<number> {
  const { count, error } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', since.toISOString());
  if (error) throw new Error(error.message);
  return count || 0;
}

async function listTodayAppointments(tenantId: string, start: Date, end: Date): Promise<AppointmentRow[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients ( id, name )')
    .eq('tenant_id', tenantId)
    .gte('date_time', start.toISOString())
    .lte('date_time', end.toISOString())
    .order('date_time', { ascending: true })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data || []) as AppointmentRow[];
}

export async function fetchDashboardData(tenantId: string): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayStart = startOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const yesterdayEnd = endOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const monthStart = startOfMonth(now);

  const [
    totalToday,
    confirmedToday,
    canceledToday,
    totalYesterday,
    activePatients,
    patientsThisMonth,
    todayAppointments,
  ] = await Promise.all([
    countAppointmentsToday(tenantId, todayStart, todayEnd),
    countAppointmentsTodayByStatus(tenantId, todayStart, todayEnd, 'CONFIRMED'),
    countAppointmentsTodayByStatus(tenantId, todayStart, todayEnd, 'CANCELED'),
    countAppointmentsToday(tenantId, yesterdayStart, yesterdayEnd),
    countActivePatients(tenantId),
    countPatientsCreatedSince(tenantId, monthStart),
    listTodayAppointments(tenantId, todayStart, todayEnd),
  ]);

  const deltaToday = totalToday - totalYesterday;
  const consultasHojeDeltaLabel =
    deltaToday === 0 ? 'Igual ao dia anterior' : `${deltaToday > 0 ? '+' : ''}${deltaToday} vs ontem`;

  const pacientesAtivosDeltaLabel = `+${patientsThisMonth} este mês`;

  // totalToday exclui CANCELED/NO_SHOW — usa como base para % confirmadas
  // canceladasPct usa base = totalToday + canceledToday para refletir o universo real do dia
  const baseTotal = totalToday + canceledToday;
  const confirmadasPct = totalToday > 0 ? Math.round((confirmedToday / totalToday) * 100) : 0;
  const canceladasPct  = baseTotal > 0  ? Math.round((canceledToday  / baseTotal)  * 100) : 0;

  return {
    stats: {
      consultasHoje: totalToday,
      consultasHojeDeltaLabel,
      pacientesAtivos: activePatients,
      pacientesAtivosDeltaLabel,
      confirmadas: confirmedToday,
      confirmadasPct,
      canceladas: canceledToday,
      canceladasPct,
    },
    todayAppointments,
  };
}

/* =====================================================================
 * Vendas por dia (gráfico de linhas) — últimos 7 dias.
 * Fonte: tabela public.payments
 *   - vendas: SUM(amount) WHERE status = 'APPROVED'
 *   - consultas: COUNT(appointments) por dia (status != CANCELED)
 * ===================================================================== */

export interface SalesByDayPoint {
  day: string;          // rótulo curto (ex.: "Qua 13/05")
  dateIso: string;      // yyyy-MM-dd
  vendas: number;       // BRL (number)
  consultas: number;    // unidades
}

export async function fetchSalesByDay(tenantId: string, days = 7): Promise<SalesByDayPoint[]> {
  const today = new Date();
  const startDate = startOfDay(subDays(today, days - 1));
  const endDate = endOfDay(today);

  const [paymentsRes, apptsRes] = await Promise.all([
    supabase
      .from('payments')
      .select('amount, paid_at, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'APPROVED')
      .gte('paid_at', startDate.toISOString())
      .lte('paid_at', endDate.toISOString()),
    supabase
      .from('appointments')
      .select('date_time, status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .not('status', 'in', '("CANCELED","NO_SHOW")')
      .gte('date_time', startDate.toISOString())
      .lte('date_time', endDate.toISOString()),
  ]);

  if (paymentsRes.error) throw new Error(paymentsRes.error.message);
  if (apptsRes.error) throw new Error(apptsRes.error.message);

  // Preenche todos os dias do range (mesmo zerados) para o gráfico
  // não ter "buracos".
  const out: SalesByDayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = subDays(today, days - 1 - i);
    const dateIso = format(d, 'yyyy-MM-dd');
    out.push({
      day: format(d, 'EEE dd/MM', { locale: ptBR }),
      dateIso,
      vendas: 0,
      consultas: 0,
    });
  }
  const byIso = new Map(out.map((p) => [p.dateIso, p]));

  for (const p of paymentsRes.data || []) {
    if (!p.paid_at) continue;
    const key = format(new Date(p.paid_at), 'yyyy-MM-dd');
    const pt = byIso.get(key);
    if (pt) pt.vendas += Number(p.amount || 0);
  }
  for (const a of apptsRes.data || []) {
    if (!a.date_time) continue;
    const key = format(new Date(a.date_time), 'yyyy-MM-dd');
    const pt = byIso.get(key);
    if (pt) pt.consultas += 1;
  }
  return out;
}

/* =====================================================================
 * TOP 10 procedimentos (gráfico de barras horizontais) — mês corrente.
 * Fonte: appointments.type (group by, count desc, limit 10).
 *
 * Observação: o schema não tem uma tabela "products" dedicada. Usamos
 * appointments.type como melhor proxy para "serviço mais executado".
 * Quando o backend ganhar a entidade Product/Service, basta substituir
 * a fonte aqui.
 * ===================================================================== */

export interface TopProcedurePoint {
  name: string;
  vendas: number; // unidades
}

export async function fetchTopProcedures(tenantId: string): Promise<TopProcedurePoint[]> {
  const monthStart = startOfMonth(new Date());

  const { data, error } = await supabase
    .from('appointments')
    .select('type')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .not('status', 'in', '("CANCELED","NO_SHOW")')
    .gte('date_time', monthStart.toISOString())
    .not('type', 'is', null);

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of data || []) {
    const t = (row.type || '').trim();
    if (!t) continue;
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, vendas]) => ({ name, vendas }))
    .sort((a, b) => b.vendas - a.vendas)
    .slice(0, 10);
}
