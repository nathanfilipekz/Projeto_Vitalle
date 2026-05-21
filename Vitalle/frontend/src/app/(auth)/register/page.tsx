'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, Loader2 } from 'lucide-react';
import { hasAnyUser, registerFirstUser } from '@/services/auth-service';
import { isValidEmail } from '@/lib/supabase';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    clinicName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'standard';

  useEffect(() => {
    let cancelled = false;
    hasAnyUser()
      .then((exists) => {
        if (cancelled) return;
        if (exists) {
          setBlocked(true);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) return setError('Informe o nome completo.');
    if (!isValidEmail(formData.email)) {
      return setError('E-mail inválido. Use um endereço com "@" e domínio terminado em ".com".');
    }
    if (!formData.phone.trim()) return setError('Informe o telefone.');
    if (!formData.clinicName.trim()) return setError('Informe o nome da clínica.');
    if (formData.password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.');
    if (formData.password !== formData.confirmPassword) {
      return setError('As senhas não coincidem.');
    }

    setIsLoading(true);
    try {
      // Última checagem (race-condition): garante apenas 1 usuário.
      if (await hasAnyUser()) {
        setBlocked(true);
        setError('Já existe um usuário cadastrado. Esta ferramenta aceita apenas um usuário.');
        return;
      }
      await registerFirstUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        clinicName: formData.clinicName.trim(),
        password: formData.password,
      });
      router.push('/login?registered=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-[#406B5B]/70">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Verificando disponibilidade de cadastro...</p>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold text-[#406B5B]">Cadastro indisponível</h1>
        <p className="text-sm text-[#406B5B]/70">
          Já existe um usuário cadastrado nesta ferramenta. Apenas um usuário pode ser criado por
          instância. Faça login para continuar.
        </p>
        <Link
          href="/login"
          className="inline-block w-full text-center py-3.5 bg-[#406B5B] text-white rounded-xl font-semibold hover:bg-[#406B5B]/90"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="lg:hidden flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#406B5B] rounded-full flex items-center justify-center">
          <span className="text-white font-heading text-lg font-bold">V</span>
        </div>
        <span className="font-heading text-2xl text-[#406B5B] font-semibold tracking-wide">
          VITALLE
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-[#406B5B] mb-2">Criar conta</h1>
        <p className="text-[#406B5B]/60">
          Plano selecionado:{' '}
          <span className="font-semibold capitalize text-[#406B5B]">{selectedPlan}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Nome completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Dr. João Silva"
                required
                className="pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                required
                className="pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#406B5B] mb-1.5">
            Nome da Clínica / Consultório
          </label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input
              type="text"
              value={formData.clinicName}
              onChange={(e) => updateField('clinicName', e.target.value)}
              placeholder="Clínica Vitalle"
              required
              className="pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#406B5B] mb-1.5">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="seu@email.com"
              required
              pattern="^[^\s@]+@[^\s@]+\.com(\.[a-zA-Z]{2,})?$"
              title='O e-mail deve conter "@" e terminar em ".com" (ou ".com.br" etc.).'
              className="pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Min. 8 caracteres"
                required
                minLength={8}
                className="pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#406B5B]/40 hover:text-[#406B5B]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#406B5B] mb-1.5">
              Confirmar senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Repetir senha"
                required
                minLength={8}
                className="pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            required
            className="mt-1 w-4 h-4 rounded border-[#E4D5C3] text-[#406B5B] focus:ring-[#406B5B]/20"
          />
          <span className="text-xs text-[#406B5B]/60">
            Concordo com os{' '}
            <a href="#" className="text-[#406B5B] font-medium hover:underline">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-[#406B5B] font-medium hover:underline">
              Política de Privacidade
            </a>
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-[#406B5B] text-white rounded-xl font-semibold hover:bg-[#406B5B]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#406B5B]/20 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#406B5B]/60">
        Já tem conta?{' '}
        <Link
          href="/login"
          className="text-[#406B5B] hover:text-[#91AE9E] font-semibold transition-colors"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
