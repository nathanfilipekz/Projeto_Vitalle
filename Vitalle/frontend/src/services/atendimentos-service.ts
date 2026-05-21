import { supabase } from '@/lib/supabase';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface AtendimentoRow {
  id: string;
  tenant_id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string;
  observations: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateAtendimentoPayload {
  tenantId: string;
  patientId: string;
  doctorId: string;
  title: string;
  description: string;
  observations?: string | null;
}

// ─── Funções ──────────────────────────────────────────────────────────────────

export async function listAtendimentos(
  tenantId: string,
  patientId: string,
): Promise<AtendimentoRow[]> {
  const { data, error } = await supabase
    .from('patient_evolutions')
    .select('id, tenant_id, patient_id, doctor_id, title, description, observations, created_at, updated_at, deleted_at')
    .eq('tenant_id', tenantId)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as AtendimentoRow[];
}

export async function createAtendimento(
  payload: CreateAtendimentoPayload,
): Promise<AtendimentoRow> {
  const { data, error } = await supabase
    .from('patient_evolutions')
    .insert({
      tenant_id:    payload.tenantId,
      patient_id:   payload.patientId,
      doctor_id:    payload.doctorId,
      title:        payload.title,
      description:  payload.description,
      observations: payload.observations || null,
    })
    .select('id, tenant_id, patient_id, doctor_id, title, description, observations, created_at, updated_at, deleted_at')
    .single();
  if (error || !data) throw new Error(error?.message || 'Falha ao registrar atendimento.');
  return data as AtendimentoRow;
}

export async function deleteAtendimento(id: string, tenantId: string): Promise<void> {
  const { error } = await supabase
    .from('patient_evolutions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message || 'Falha ao excluir atendimento.');
}

// ─── Formata data/hora para rótulo do título ───────────────────────────────────

export function buildAtendimentoTitle(): string {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
