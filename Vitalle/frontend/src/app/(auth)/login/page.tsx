'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { hasAnyUser, loginWithCredentials, type AuthUser } from '@/services/auth-service';
import { isValidEmail } from '@/lib/supabase';
import { verifyLoginMfaCode } from '@/services/mfa-service';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [hasUser, setHasUser] = useState<boolean | null>(null);
  const [mfaPending, setMfaPending] = useState<AuthUser | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const { setUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    hasAnyUser().then(setHasUser);
    if (searchParams.get('registered') === '1') {
      setInfo('Conta criada com sucesso. Faça login para continuar.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('E-mail inválido. Use um endereço com "@" e domínio terminado em ".com".');
      return;
    }
    if (!password) {
      setError('Informe a senha.');
      return;
    }

    setIsLoading(true);
    try {
      const { user, requiresMfa } = await loginWithCredentials(email, password);
      if (requiresMfa) {
        setMfaPending(user);
        setIsLoading(false);
        return;
      }
      setUser(user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaPending) return;
    setError('');
    setIsLoading(true);
    try {
      const ok = await verifyLoginMfaCode(mfaPending.id, mfaCode);
      if (!ok) {
        setError('Código MFA inválido. Verifique o aplicativo autenticador.');
        return;
      }
      setUser(mfaPending);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na verificação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="lg:hidden flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-[#406B5B] rounded-full flex items-center justify-center">
          <span className="text-white font-heading text-lg font-bold">V</span>
        </div>
        <span className="font-heading text-2xl text-[#406B5B] font-semibold tracking-wide">
          VITALLE
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-[#406B5B] mb-2">
          {mfaPending ? 'Verificação em duas etapas' : 'Bem-vindo de volta'}
        </h1>
        <p className="text-[#406B5B]/60">
          {mfaPending
            ? `Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador para ${mfaPending.email}.`
            : 'Acesse sua conta para continuar'}
        </p>
      </div>

      {mfaPending ? (
        <form onSubmit={handleMfaSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#406B5B] mb-2">Código MFA</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-3.5 bg-white border border-[#E4D5C3] rounded-xl text-[#406B5B] placeholder:text-[#406B5B]/30 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || mfaCode.length !== 6}
            className="w-full py-3.5 bg-[#406B5B] text-white rounded-xl font-semibold hover:bg-[#406B5B]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#406B5B]/20 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Validando...' : 'Confirmar e entrar'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMfaPending(null);
              setMfaCode('');
              setError('');
            }}
            className="w-full text-sm text-[#406B5B]/60 hover:text-[#406B5B]"
          >
            Voltar e usar outra conta
          </button>
        </form>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-5">
        {info && (
          <div className="p-4 bg-[#91AE9E]/10 border border-[#91AE9E]/30 rounded-xl text-sm text-[#406B5B]">
            {info}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#406B5B] mb-2">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              pattern="^[^\s@]+@[^\s@]+\.com(\.[a-zA-Z]{2,})?$"
              title='O e-mail deve conter "@" e terminar em ".com" (ou ".com.br" etc.).'
              className="pl-11 pr-4 py-3.5 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 focus:border-[#406B5B]/30 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#406B5B] mb-2">Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="pl-11 pr-12 py-3.5 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 focus:border-[#406B5B]/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#406B5B]/40 hover:text-[#406B5B]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-[#E4D5C3] text-[#406B5B] focus:ring-[#406B5B]/20"
            />
            <span className="text-sm text-[#406B5B]/60">Lembrar-me</span>
          </label>
          <a
            href="#"
            className="text-sm text-[#406B5B] hover:text-[#91AE9E] font-medium transition-colors"
          >
            Esqueceu a senha?
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-[#406B5B] text-white rounded-xl font-semibold hover:bg-[#406B5B]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#406B5B]/20 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      )}

      <p className="mt-8 text-center text-sm text-[#406B5B]/60">
        {hasUser === false ? (
          <>
            Nenhum usuário cadastrado.{' '}
            <Link
              href="/register"
              className="text-[#406B5B] hover:text-[#91AE9E] font-semibold transition-colors"
            >
              Criar a primeira conta
            </Link>
          </>
        ) : (
          <>
            Ainda não tem acesso?{' '}
            <Link
              href="/register"
              className="text-[#406B5B] hover:text-[#91AE9E] font-semibold transition-colors"
            >
              Criar conta
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
