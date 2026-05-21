import { supabase } from '@/lib/supabase';

export interface PatientRow {
  id: string;
  tenant_id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientPayload {
  tenantId: string;
  name: string;
  cpf: string;
  phone: string;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
}

export interface PatientStats {
  total: number;
  thisMonth: number;
}

export async function createPatient(payload: CreatePatientPayload): Promise<PatientRow> {
  const insertPayload = {
    tenant_id: payload.tenantId,
    name: payload.name.trim(),
    cpf: payload.cpf,
    phone: payload.phone,
    email: payload.email?.trim() || null,
    date_of_birth: payload.dateOfBirth ? payload.dateOfBirth : null,
    gender: payload.gender || null,
    address: payload.address?.trim() || null,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('patients')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) {
    const msg = error?.message || '';
    if (error?.code === '23505' || msg.toLowerCase().includes('duplicate')) {
      throw new Error('Ja existe um paciente cadastrado com este CPF.');
    }
    throw new Error(error?.message || 'Falha ao cadastrar paciente.');
  }

  return data as PatientRow;
}

export async function listPatients(tenantId: string, limit = 100): Promise<PatientRow[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data || []) as PatientRow[];
}

export async function searchPatients(
  tenantId: string,
  query: string,
  limit = 50,
): Promise<PatientRow[]> {
  const digits = query.replace(/\D/g, '');
  const namePart = query.trim();

  let orClause = `name.ilike.%${namePart}%`;
  if (digits.length > 0) {
    orClause += `,cpf.like.%${digits}%,phone.like.%${digits}%`;
  }

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .or(orClause)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data || []) as PatientRow[];
}

export async function getPatientStats(tenantId: string): Promise<PatientStats> {
  const { count: total, error: errTotal } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (errTotal) throw new Error(errTotal.message);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: thisMonth, error: errMonth } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .gte('created_at', startOfMonth.toISOString());

  if (errMonth) throw new Error(errMonth.message);

  return {
    total: total ?? 0,
    thisMonth: thisMonth ?? 0,
  };
}

export interface UpdatePatientPayload {
  name?: string;
  cpf?: string;
  phone?: string;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
}

export async function updatePatient(
  id: string,
  tenantId: string,
  payload: UpdatePatientPayload,
): Promise<PatientRow> {
  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined)        updateData.name          = payload.name.trim();
  if (payload.cpf !== undefined)         updateData.cpf           = payload.cpf;
  if (payload.phone !== undefined)       updateData.phone         = payload.phone;
  if (payload.email !== undefined)       updateData.email         = payload.email?.trim() || null;
  if (payload.dateOfBirth !== undefined) updateData.date_of_birth = payload.dateOfBirth || null;
  if (payload.gender !== undefined)      updateData.gender        = payload.gender || null;
  if (payload.address !== undefined)     updateData.address       = payload.address?.trim() || null;

  const { data, error } = await supabase
    .from('patients')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) {
    const msg = error?.message || '';
    if (error?.code === '23505' || msg.toLowerCase().includes('duplicate')) {
      throw new Error('Ja existe um paciente cadastrado com este CPF.');
    }
    throw new Error(error?.message || 'Falha ao atualizar paciente.');
  }

  return data as PatientRow;
}

/**
 * Soft-delete: marca deleted_at e desativa o paciente.
 * O registro permanece no banco para auditoria.
 */
export async function deletePatient(id: string, tenantId: string): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(error.message || 'Falha ao excluir paciente.');
}
