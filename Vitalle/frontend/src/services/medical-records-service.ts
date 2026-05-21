import { supabase } from '@/lib/supabase';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface MedicalRecordPatient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  date_of_birth: string | null;
}

export interface MedicalRecordRow {
  id: string;
  tenant_id: string;
  patient_id: string;
  doctor_id: string;
  chief_complaint: string | null;
  history_present_illness: string | null;
  past_medical_history: string | null;
  family_history: string | null;
  social_history: string | null;
  review_of_systems: string | null;
  physical_examination: string | null;
  assessment: string | null;
  plan: string | null;
  diagnosis: string | null;
  prescription: string | null;
  attachments: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // joined
  patients: MedicalRecordPatient | null;
}

export interface CreateMedicalRecordPayload {
  tenantId: string;
  patientId: string;
  doctorId: string;
  chiefComplaint?: string | null;
  historyPresentIllness?: string | null;
  pastMedicalHistory?: string | null;
  familyHistory?: string | null;
  diagnosis?: string | null;
  assessment?: string | null;
  plan?: string | null;
  prescription?: string | null;
}

export interface UpdateMedicalRecordPayload {
  chiefComplaint?: string | null;
  historyPresentIllness?: string | null;
  pastMedicalHistory?: string | null;
  familyHistory?: string | null;
  diagnosis?: string | null;
  assessment?: string | null;
  plan?: string | null;
  prescription?: string | null;
}

// ─── Helper: resolve doctor_id from user_id ────────────────────────────────────

export async function resolveDoctorId(tenantId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('doctors')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data.id as string;
}

// ─── CRUD ──────────────────────────────────────────────────────────────────────

export async function listMedicalRecords(tenantId: string): Promise<MedicalRecordRow[]> {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*, patients ( id, name, cpf, phone, date_of_birth )')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as MedicalRecordRow[];
}

export async function getMedicalRecordsByPatient(
  tenantId: string,
  patientId: string,
): Promise<MedicalRecordRow[]> {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*, patients ( id, name, cpf, phone, date_of_birth )')
    .eq('tenant_id', tenantId)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as MedicalRecordRow[];
}

export function searchMedicalRecords(
  records: MedicalRecordRow[],
  query: string,
): MedicalRecordRow[] {
  if (!query.trim()) return records;
  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, '');
  return records.filter((r) => {
    const p = r.patients;
    if (!p) return false;
    if (p.name.toLowerCase().includes(q)) return true;
    if (digits && p.cpf.includes(digits)) return true;
    if (digits && p.phone.includes(digits)) return true;
    return false;
  });
}

export async function createMedicalRecord(
  payload: CreateMedicalRecordPayload,
): Promise<MedicalRecordRow> {
  const insert: Record<string, unknown> = {
    tenant_id: payload.tenantId,
    patient_id: payload.patientId,
    doctor_id: payload.doctorId,
  };
  if (payload.chiefComplaint !== undefined)        insert.chief_complaint        = payload.chiefComplaint || null;
  if (payload.historyPresentIllness !== undefined) insert.history_present_illness= payload.historyPresentIllness || null;
  if (payload.pastMedicalHistory !== undefined)    insert.past_medical_history   = payload.pastMedicalHistory || null;
  if (payload.familyHistory !== undefined)         insert.family_history         = payload.familyHistory || null;
  if (payload.diagnosis !== undefined)             insert.diagnosis              = payload.diagnosis || null;
  if (payload.assessment !== undefined)            insert.assessment             = payload.assessment || null;
  if (payload.plan !== undefined)                  insert.plan                   = payload.plan || null;
  if (payload.prescription !== undefined)          insert.prescription           = payload.prescription || null;

  const { data, error } = await supabase
    .from('medical_records')
    .insert(insert)
    .select('*, patients ( id, name, cpf, phone, date_of_birth )')
    .single();
  if (error || !data) throw new Error(error?.message || 'Falha ao criar prontuario.');
  return data as MedicalRecordRow;
}

export async function updateMedicalRecord(
  id: string,
  tenantId: string,
  payload: UpdateMedicalRecordPayload,
): Promise<MedicalRecordRow> {
  const upd: Record<string, unknown> = {};
  if (payload.chiefComplaint !== undefined)        upd.chief_complaint         = payload.chiefComplaint || null;
  if (payload.historyPresentIllness !== undefined) upd.history_present_illness = payload.historyPresentIllness || null;
  if (payload.pastMedicalHistory !== undefined)    upd.past_medical_history    = payload.pastMedicalHistory || null;
  if (payload.familyHistory !== undefined)         upd.family_history          = payload.familyHistory || null;
  if (payload.diagnosis !== undefined)             upd.diagnosis               = payload.diagnosis || null;
  if (payload.assessment !== undefined)            upd.assessment              = payload.assessment || null;
  if (payload.plan !== undefined)                  upd.plan                    = payload.plan || null;
  if (payload.prescription !== undefined)          upd.prescription            = payload.prescription || null;

  const { data, error } = await supabase
    .from('medical_records')
    .update(upd)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*, patients ( id, name, cpf, phone, date_of_birth )')
    .single();
  if (error || !data) throw new Error(error?.message || 'Falha ao atualizar prontuario.');
  return data as MedicalRecordRow;
}

export async function deleteMedicalRecord(id: string, tenantId: string): Promise<void> {
  const { error } = await supabase
    .from('medical_records')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message || 'Falha ao excluir prontuario.');
}

// ─── Appointments history (para o modal de detalhe) ────────────────────────────

export interface AppointmentHistoryRow {
  id: string;
  date_time: string;
  status: string;
  type: string | null;
  notes: string | null;
}

export async function getPatientAppointmentHistory(
  tenantId: string,
  patientId: string,
  limit = 20,
): Promise<AppointmentHistoryRow[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, date_time, status, type, notes')
    .eq('tenant_id', tenantId)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('date_time', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []) as AppointmentHistoryRow[];
}
