'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ModalShell } from './modal-shell';
import { User, CreditCard, Phone, Mail, Calendar, MapPin, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { createPatient } from '@/services/patients-service';

interface NewPatientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export interface PatientFormData {
  name: string;
  cpf: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

const initialState: PatientFormData = {
  name: '',
  cpf: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  address: '',
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function maskCPF(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').trim();
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').trim();
}

export function NewPatientModal({ open, onClose, onCreated }: NewPatientModalProps) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<PatientFormData>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof PatientFormData>(field: K, value: PatientFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 3) {
      e.name = 'Informe o nome completo (min. 3 caracteres).';
    }
    const cpfDigits = onlyDigits(form.cpf);
    if (cpfDigits.length !== 11) e.cpf = 'CPF deve ter 11 digitos.';
    const phoneDigits = onlyDigits(form.phone);
    if (phoneDigits.length < 10) e.phone = 'Telefone invalido.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'E-mail invalido.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!user?.tenantId) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    setSubmitting(true);

    try {
      await createPatient({
        tenantId: user.tenantId,
        name: form.name,
        cpf: onlyDigits(form.cpf),
        phone: onlyDigits(form.phone),
        email: form.email || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        address: form.address || null,
      });

      toast.success('Paciente cadastrado com sucesso', {
        description: `${form.name} foi adicionado à base.`,
      });
      setForm(initialState);
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível cadastrar o paciente');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 focus:border-[#406B5B]/30 transition-all';
  const labelClass = 'block text-sm font-medium text-[#406B5B] mb-1.5';

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Novo Paciente"
      subtitle="Cadastre um novo paciente na base"
      widthClass="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-[#E4D5C3] text-[#406B5B] font-medium hover:bg-[#E4D5C3]/30 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="new-patient-form"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#406B5B] text-white font-semibold hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Cadastrar paciente'}
          </button>
        </>
      }
    >
      <form id="new-patient-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nome completo</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Joao da Silva Santos"
              className={inputClass}
              autoFocus
            />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>CPF</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="text"
                inputMode="numeric"
                value={form.cpf}
                onChange={(e) => update('cpf', maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                className={inputClass}
              />
            </div>
            {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="text"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => update('phone', maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className={inputClass}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="paciente@email.com"
                className={inputClass}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className={labelClass}>Data de nascimento</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update('dateOfBirth', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Sexo</label>
            <select
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              className="px-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
            >
              <option value="">Selecione...</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Endereco</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="text"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Rua, numero, bairro, cidade"
                className={inputClass}
              />
            </div>
          </div>
        </div>

      </form>
    </ModalShell>
  );
}
