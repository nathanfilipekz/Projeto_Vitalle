import { supabase } from '@/lib/supabase';

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  clinicName: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPPORT' | 'MANAGER' | 'DOCTOR';
  tenantId: string;
}

/**
 * IMPORTANTE: hash de senha real ainda não está disponível no front
 * (bcrypt é server-side). Por enquanto guardamos um hash determinístico
 * simples só para que o login confira contra o que foi gravado. Quando
 * o backend NestJS for ligado, esse fluxo migra para POST /auth/register
 * e bcrypt server-side.
 */
async function sha256(value: string): Promise<string> {
  const enc = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hasAnyUser(): Promise<boolean> {
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[authService.hasAnyUser]', error);
    return false;
  }
  return (count ?? 0) > 0;
}

function makeFakeCnpj(): string {
  // CNPJ "fictício" só pra preencher a coluna obrigatória no MVP.
  // 14 dígitos, prefixado com timestamp para garantir unicidade.
  return Date.now().toString().padStart(14, '0').slice(0, 14);
}

export async function registerFirstUser(payload: RegisterPayload): Promise<AuthUser> {
  // 1. Tenant
  const tenantInsert = await supabase
    .from('tenants')
    .insert({
      name: payload.clinicName,
      document: makeFakeCnpj(),
      email: payload.email,
      phone: payload.phone,
    })
    .select('id')
    .single();

  if (tenantInsert.error || !tenantInsert.data) {
    throw new Error(tenantInsert.error?.message || 'Falha ao criar clínica.');
  }
  const tenantId = tenantInsert.data.id as string;

  // 2. User
  const passwordHash = await sha256(payload.password);
  const userInsert = await supabase
    .from('users')
    .insert({
      tenant_id: tenantId,
      email: payload.email,
      password_hash: passwordHash,
      name: payload.name,
      role: 'DOCTOR',
      phone: payload.phone,
    })
    .select('id, name, email, role, tenant_id')
    .single();

  if (userInsert.error || !userInsert.data) {
    throw new Error(userInsert.error?.message || 'Falha ao criar usuário.');
  }

  // 3. Doctor (para o usuário poder receber appointments)
  await supabase.from('doctors').insert({
    tenant_id: tenantId,
    user_id: userInsert.data.id,
    crm: 'PENDENTE',
    specialty: 'Geral',
  });

  return {
    id: userInsert.data.id,
    name: userInsert.data.name,
    email: userInsert.data.email,
    role: userInsert.data.role,
    tenantId: userInsert.data.tenant_id,
  };
}

export interface LoginResult {
  user: AuthUser;
  requiresMfa: boolean;
}

export async function loginWithCredentials(email: string, password: string): Promise<LoginResult> {
  const passwordHash = await sha256(password);
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, tenant_id, password_hash, is_active, mfa_enabled')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('E-mail ou senha incorretos.');
  if (!data.is_active) throw new Error('Usuário inativo.');
  if (data.password_hash !== passwordHash) throw new Error('E-mail ou senha incorretos.');

  return {
    user: {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      tenantId: data.tenant_id,
    },
    requiresMfa: !!data.mfa_enabled,
  };
}
