import { supabase } from '@/lib/supabase';
import { buildOtpauthUri, generateSecret, verifyTotp } from '@/lib/totp';

export interface MfaStatus {
  enabled: boolean;
  hasSecret: boolean;
}

export interface MfaSetup {
  secret: string;
  otpauthUri: string;
}

export async function getMfaStatus(userId: string): Promise<MfaStatus> {
  const { data, error } = await supabase
    .from('users')
    .select('mfa_enabled, mfa_secret')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    enabled: !!data?.mfa_enabled,
    hasSecret: !!data?.mfa_secret,
  };
}

export async function fetchMfaSecret(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('mfa_secret')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.mfa_secret ?? null;
}

export function beginMfaSetup(accountEmail: string): MfaSetup {
  const secret = generateSecret();
  return {
    secret,
    otpauthUri: buildOtpauthUri(secret, accountEmail, 'Vitalle'),
  };
}

/**
 * Persiste o secret no banco e marca mfa_enabled=true após
 * confirmar que o usuário digitou o código corretamente do
 * seu autenticador.
 */
export async function confirmAndEnableMfa(userId: string, secret: string, code: string): Promise<void> {
  const ok = await verifyTotp(secret, code);
  if (!ok) throw new Error('Código inválido. Verifique o relógio do dispositivo e tente novamente.');
  const { error } = await supabase
    .from('users')
    .update({ mfa_enabled: true, mfa_secret: secret })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function disableMfa(userId: string, code: string): Promise<void> {
  const secret = await fetchMfaSecret(userId);
  if (!secret) throw new Error('MFA não configurado.');
  const ok = await verifyTotp(secret, code);
  if (!ok) throw new Error('Código inválido.');
  const { error } = await supabase
    .from('users')
    .update({ mfa_enabled: false, mfa_secret: null })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function verifyLoginMfaCode(userId: string, code: string): Promise<boolean> {
  const secret = await fetchMfaSecret(userId);
  if (!secret) return false;
  return verifyTotp(secret, code);
}
