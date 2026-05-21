import { supabase } from '@/lib/supabase';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CANCELED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface AppointmentRow {
  id: string;
  tenant_id: string;
  doctor_id: string;
  patient_id: string;
  date_time: string;
  duration: number;
  status: AppointmentStatus;
  type: string | null;
  notes: string | null;
  patients?: { id: string; name: string } | null;
}

export interface CreateAppointmentPayload {
  tenantId: string;
  doctorId: string;
  patientName: string;
  dateTimeIso: string;
  duration: number;
  type: string;
  notes?: string;
}

/**
 * Garante que existe um paciente com o nome informado no tenant.
 * Para o MVP single-user usamos só o nome — quando o backend
 * estiver ligado, a criação de paciente vira fluxo dedicado.
 */
async function ensurePatient(tenantId: string, patientName: string): Promise<string> {
  const trimmed = patientName.trim();
  const existing = await supabase
    .from('patients')
    .select('id')
    .eq('tenant_id', tenantId)
    .ilike('name', trimmed)
    .limit(1)
    .maybeSingle();
  if (existing.data?.id) return existing.data.id;

  // Cria paciente novo com CPF placeholder (único por tenant).
  const placeholderCpf = `MVP-${Date.now()}`;
  const insert = await supabase
    .from('patients')
    .insert({
      tenant_id: tenantId,
      name: trimmed,
      cpf: placeholderCpf,
      phone: 'N/A',
    })
    .select('id')
    .single();
  if (insert.error || !insert.data) {
    throw new Error(insert.error?.message || 'Falha ao criar paciente.');
  }
  return insert.data.id;
}

async function resolveDoctorId(tenantId: string): Promise<string> {
  const { data, error } = await supabase
    .from('doctors')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Nenhum médico cadastrado para este tenant.');
  return data.id;
}

/**
 * Verifica se existe alguma consulta do mesmo médico cujo intervalo
 * [date_time, date_time + duration) intercepta o novo intervalo
 * proposto. Cancelados / no-show / soft-deleted são ignorados.
 * Retorna true se há conflito.
 */
export async function hasOverlap(
  tenantId: string,
  doctorId: string,
  dateTimeIso: string,
  duration: number,
): Promise<boolean> {
  const newStart = new Date(dateTimeIso);
  const newEnd = new Date(newStart.getTime() + duration * 60_000);

  // Buscamos consultas do mesmo doctor cujo início é anterior ao fim
  // proposto E cujo fim (date_time + duration) ainda não passou do
  // início proposto. Calculamos o "fim" no client para simplificar.
  const { data, error } = await supabase
    .from('appointments')
    .select('id, date_time, duration, status')
    .eq('tenant_id', tenantId)
    .eq('doctor_id', doctorId)
    .is('deleted_at', null)
    .not('status', 'in', '("CANCELED","NO_SHOW")')
    .lt('date_time', newEnd.toISOString());

  if (error) throw new Error(error.message);

  return (data || []).some((apt) => {
    const start = new Date(apt.date_time);
    const end = new Date(start.getTime() + apt.duration * 60_000);
    return end > newStart; // sobreposição efetiva
  });
}

export async function createAppointment(payload: CreateAppointmentPayload): Promise<AppointmentRow> {
  // 1. Checagem prévia (mensagem amigável antes de tocar no banco).
  const overlap = await hasOverlap(
    payload.tenantId,
    payload.doctorId,
    payload.dateTimeIso,
    payload.duration,
  );
  if (overlap) {
    throw new Error(
      'Já existe uma consulta neste horário para este profissional. Escolha outro horário ou ajuste a duração.',
    );
  }

  const patientId = await ensurePatient(payload.tenantId, payload.patientName);

  const insert = await supabase
    .from('appointments')
    .insert({
      tenant_id: payload.tenantId,
      doctor_id: payload.doctorId,
      patient_id: patientId,
      date_time: payload.dateTimeIso,
      duration: payload.duration,
      type: payload.type,
      notes: payload.notes || null,
      status: 'SCHEDULED' as AppointmentStatus,
    })
    .select('*, patients ( id, name )')
    .single();

  if (insert.error || !insert.data) {
    // Mesmo com a checagem acima, a EXCLUDE constraint do Postgres
    // pode disparar em corridas concorrentes. Traduzimos a mensagem.
    const msg = insert.error?.message || '';
    if (
      msg.includes('appointments_no_overlap_per_doctor') ||
      insert.error?.code === '23P01'
    ) {
      throw new Error(
        'Já existe uma consulta neste horário para este profissional. Escolha outro horário.',
      );
    }
    throw new Error(insert.error?.message || 'Falha ao criar consulta.');
  }
  return insert.data as AppointmentRow;
}

export async function listAppointmentsInRange(
  tenantId: string,
  startIso: string,
  endIso: string,
): Promise<AppointmentRow[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients ( id, name )')
    .eq('tenant_id', tenantId)
    .gte('date_time', startIso)
    .lt('date_time', endIso)
    .order('date_time', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as AppointmentRow[];
}

export interface UpdateAppointmentPayload {
  id: string;
  tenantId: string;
  doctorId: string;
  patientName?: string;
  dateTimeIso?: string;
  duration?: number;
  type?: string;
  notes?: string | null;
  status?: AppointmentStatus;
}

/**
 * Atualiza uma consulta existente. Se houver mudança de horário/duração
 * ou se o status estiver voltando para um estado ativo (SCHEDULED,
 * CONFIRMED, RESCHEDULED), refazemos a checagem de overlap ignorando
 * o próprio id.
 */
export async function updateAppointment(payload: UpdateAppointmentPayload): Promise<AppointmentRow> {
  const updates: Record<string, unknown> = {};

  // Mudança de paciente (por nome).
  let patientIdToSet: string | undefined;
  if (payload.patientName && payload.patientName.trim().length > 0) {
    patientIdToSet = await ensurePatient(payload.tenantId, payload.patientName);
    updates.patient_id = patientIdToSet;
  }

  if (payload.dateTimeIso) updates.date_time = payload.dateTimeIso;
  if (payload.duration !== undefined) updates.duration = payload.duration;
  if (payload.type !== undefined) updates.type = payload.type;
  if (payload.notes !== undefined) updates.notes = payload.notes;
  if (payload.status) updates.status = payload.status;

  // Se mudou horário/duração OU está reativando, checa overlap (excluindo o próprio id).
  const activeStatuses: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'RESCHEDULED'];
  const needsOverlapCheck =
    !!payload.dateTimeIso ||
    payload.duration !== undefined ||
    (payload.status ? activeStatuses.includes(payload.status) : false);

  if (needsOverlapCheck) {
    const current = await supabase
      .from('appointments')
      .select('date_time, duration, status')
      .eq('id', payload.id)
      .single();
    if (current.error || !current.data) throw new Error('Consulta não encontrada.');

    const dt = (payload.dateTimeIso || current.data.date_time) as string;
    const dur = (payload.duration ?? current.data.duration) as number;
    const newStart = new Date(dt);
    const newEnd = new Date(newStart.getTime() + dur * 60_000);

    const { data, error } = await supabase
      .from('appointments')
      .select('id, date_time, duration, status')
      .eq('tenant_id', payload.tenantId)
      .eq('doctor_id', payload.doctorId)
      .neq('id', payload.id)
      .is('deleted_at', null)
      .not('status', 'in', '("CANCELED","NO_SHOW")')
      .lt('date_time', newEnd.toISOString());
    if (error) throw new Error(error.message);
    const conflict = (data || []).some((apt) => {
      const s = new Date(apt.date_time);
      const e = new Date(s.getTime() + apt.duration * 60_000);
      return e > newStart;
    });
    if (conflict) {
      throw new Error(
        'Já existe outra consulta neste horário para este profissional. Escolha outro horário ou ajuste a duração.',
      );
    }
  }

  const update = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', payload.id)
    .select('*, patients ( id, name )')
    .single();

  if (update.error || !update.data) {
    const msg = update.error?.message || '';
    if (msg.includes('appointments_no_overlap_per_doctor') || update.error?.code === '23P01') {
      throw new Error(
        'Já existe outra consulta neste horário para este profissional. Escolha outro horário.',
      );
    }
    throw new Error(update.error?.message || 'Falha ao atualizar consulta.');
  }

  return update.data as AppointmentRow;
}

/** Atalho: marca a consulta como CANCELED. */
export async function cancelAppointment(id: string, tenantId: string, doctorId: string) {
  return updateAppointment({ id, tenantId, doctorId, status: 'CANCELED' });
}

export { resolveDoctorId };
