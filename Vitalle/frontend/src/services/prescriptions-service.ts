import { supabase } from '@/lib/supabase';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface PrescriptionDoctor {
  id: string;
  crm: string | null;
  specialty: string | null;
  users: { name: string; email: string } | null;
}

export interface PrescriptionPatient {
  id: string;
  name: string;
  date_of_birth: string | null;
}

export interface PrescriptionRow {
  id: string;
  tenant_id: string;
  patient_id: string;
  doctor_id: string;
  medications: MedicationItem[];
  instructions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // joined
  doctors: PrescriptionDoctor | null;
  patients: PrescriptionPatient | null;
}

export interface CreatePrescriptionPayload {
  tenantId: string;
  patientId: string;
  doctorId: string;
  medications: MedicationItem[];
  instructions?: string | null;
  notes?: string | null;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listPrescriptionsByPatient(
  tenantId: string,
  patientId: string,
): Promise<PrescriptionRow[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      doctors ( id, crm, specialty, users ( name, email ) ),
      patients ( id, name, date_of_birth )
    `)
    .eq('tenant_id', tenantId)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as PrescriptionRow[];
}

export async function createPrescription(
  payload: CreatePrescriptionPayload,
): Promise<PrescriptionRow> {
  const { data, error } = await supabase
    .from('prescriptions')
    .insert({
      tenant_id:    payload.tenantId,
      patient_id:   payload.patientId,
      doctor_id:    payload.doctorId,
      medications:  payload.medications,
      instructions: payload.instructions || null,
      notes:        payload.notes        || null,
    })
    .select(`
      *,
      doctors ( id, crm, specialty, users ( name, email ) ),
      patients ( id, name, date_of_birth )
    `)
    .single();
  if (error || !data) throw new Error(error?.message || 'Falha ao criar receita.');
  return data as PrescriptionRow;
}

export async function deletePrescription(id: string, tenantId: string): Promise<void> {
  const { error } = await supabase
    .from('prescriptions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message || 'Falha ao excluir receita.');
}
