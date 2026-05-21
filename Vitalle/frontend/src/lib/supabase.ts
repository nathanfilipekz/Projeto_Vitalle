import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para o frontend (uso direto enquanto o backend
 * NestJS ainda não está conectado).
 *
 * IMPORTANTE: as policies de RLS "*_mvp_anon" no banco são
 * temporárias e permitem leitura/escrita com a chave anon. Isso
 * vale apenas para a fase MVP single-user. Em produção real
 * deve ser substituído pelo fluxo do backend com service_role.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Vitalle] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes em .env.local. Algumas funcionalidades vão falhar.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

/**
 * Regex de e-mail estrito: exige presença de "@" e domínio terminando em ".com".
 * Aceita .com.br e similares (qualquer coisa após .com permanece válida apenas
 * se for separada por outro ponto — ex.: contato@clinica.com.br).
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.com(\.[a-zA-Z]{2,})?$/i;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}
