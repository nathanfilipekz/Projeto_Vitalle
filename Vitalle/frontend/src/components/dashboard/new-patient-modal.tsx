'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ModalShell } from './modal-shell';
import { User, CreditCard, Phone, Mail, Calendar, MapPin, Hash, Loader2, Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { createPatient } from '@/services/patients-service';
import { createMedicalRecord, resolveDoctorId } from '@/services/medical-records-service';

interface NewPatientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export interface PatientFormData {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  zipCode: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const initialState: PatientFormData = {
  name: '', cpf: '', phone: '', email: '', dateOfBirth: '', gender: '',
  zipCode: '', address: '', addressNumber: '', addressComplement: '',
  neighborhood: '', city: '', state: '',
};

function onlyDigits(value: string) { return value.replace(/\D/g, ''); }

function maskCPF(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').trim();
}

function maskCEP(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, '');
}

export function NewPatientModal({ open, onClose, onCreated }: NewPatientModalProps) {
  const user   = useAuthStore((s) => s.user);
  const router = useRouter();
  const [form, setForm] = useState<PatientFormData>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof PatientFormData>(field: K, value: PatientFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const buscarCEP = async () => {
    const digits = onlyDigits(form.zipCode);
    if (digits.length !== 8) {
      setErrors((prev) => ({ ...prev, zipCode: 'CEP deve ter 8 dígitos.' }));
      return;
    }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErrors((prev) => ({ ...prev, zipCode: 'CEP não encontrado.' }));
        return;
      }
      setForm((prev) => ({
        ...prev,
        address:      data.logradouro || '',
        neighborhood: data.bairro     || '',
        city:         data.localidade || '',
        state:        data.uf         || '',
      }));
      setErrors((prev) => ({ ...prev, zipCode: '' }));
    } catch {
      setErrors((prev) => ({ ...prev, zipCode: 'Erro ao buscar CEP. Tente novamente.' }));
    } finally {
      setCepLoading(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 3) e.name = 'Informe o nome completo (min. 3 caracteres).';
    if (onlyDigits(form.cpf).length !== 11)               e.cpf  = 'CPF deve ter 11 dígitos.';
    if (onlyDigits(form.phone).length < 10)               e.phone = 'Telefone inválido.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate() || !user?.tenantId) return;
    setSubmitting(true);
    try {
      // 1. Cria o paciente
      const newPatient = await createPatient({
        tenantId:          user.tenantId,
        name:              form.name,
        cpf:               onlyDigits(form.cpf),
        phone:             onlyDigits(form.phone),
        email:             form.email || null,
        dateOfBirth:       form.dateOfBirth || null,
        gender:            form.gender || null,
        zipCode:           onlyDigits(form.zipCode) || null,
        address:           form.address || null,
        addressNumber:     form.addressNumber || null,
        addressComplement: form.addressComplement || null,
        neighborhood:      form.neighborhood || null,
        city:              form.city || null,
        state:             form.state || null,
      });

      // 2. Cria prontuário inicial automaticamente
      const doctorId = await resolveDoctorId(user.tenantId, user.id);
      if (doctorId) {
        // Monta contexto inicial com dados já preenchidos do cadastro
        const addressParts = [
          form.address,
          form.addressNumber && `nº ${form.addressNumber}`,
          form.addressComplement,
          form.neighborhood,
          form.city && form.state ? `${form.city}/${form.state}` : (form.city || form.state),
          form.zipCode && `CEP ${form.zipCode}`,
        ].filter(Boolean).join(', ');

        const pastMedicalHistory = [
          form.dateOfBirth && `Data de nascimento: ${new Date(form.dateOfBirth).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`,
          form.gender && `Sexo: ${form.gender === 'M' ? 'Masculino' : form.gender === 'F' ? 'Feminino' : 'Outro'}`,
          form.email && `E-mail: ${form.email}`,
          addressParts && `Endereço: ${addressParts}`,
        ].filter(Boolean).join('\n');

        await createMedicalRecord({
          tenantId:            user.tenantId,
          patientId:           newPatient.id,
          doctorId,
          pastMedicalHistory:  pastMedicalHistory || null,
        });
      }

      toast.success('Paciente cadastrado!', {
        description: `${form.name} adicionado. Prontuário criado automaticamente.`,
      });
      setForm(initialState);
      onCreated?.();
      onClose();

      // 3. Redireciona direto para o prontuário do paciente
      router.push(`/prontuario?pacienteId=${newPatient.id}&nome=${encodeURIComponent(form.name)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível cadastrar o paciente');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 focus:border-[#406B5B]/30 transition-all';
  const inputNoIconClass = 'px-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 focus:border-[#406B5B]/30 transition-all';
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
          <button type="button" onClick={onClose} disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-[#E4D5C3] text-[#406B5B] font-medium hover:bg-[#E4D5C3]/30 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" form="new-patient-form" disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#406B5B] text-white font-semibold hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Cadastrar paciente'}
          </button>
        </>
      }
    >
      <form id="new-patient-form" onSubmit={handleSubmit} className="space-y-4">

        {/* Nome */}
        <div>
          <label className={labelClass}>Nome completo</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
              placeholder="João da Silva Santos" className={inputClass} autoFocus />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* CPF + Telefone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>CPF</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input type="text" inputMode="numeric" value={form.cpf}
                onChange={(e) => update('cpf', maskCPF(e.target.value))}
                placeholder="000.000.000-00" className={inputClass} />
            </div>
            {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input type="text" inputMode="tel" value={form.phone}
                onChange={(e) => update('phone', maskPhone(e.target.value))}
                placeholder="(11) 99999-9999" className={inputClass} />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* E-mail + Nascimento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                placeholder="paciente@email.com" className={inputClass} />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className={labelClass}>Data de nascimento</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input type="date" value={form.dateOfBirth}
                onChange={(e) => update('dateOfBirth', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Sexo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Sexo</label>
            <select value={form.gender} onChange={(e) => update('gender', e.target.value)}
              className="px-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20">
              <option value="">Selecione...</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>
        </div>

        {/* Divisor endereço */}
        <div className="flex items-center gap-3 pt-2">
          <MapPin className="w-4 h-4 text-[#406B5B]/50 shrink-0" />
          <span className="text-sm font-semibold text-[#406B5B]/70 uppercase tracking-wide">Endereço</span>
          <div className="flex-1 h-px bg-[#E4D5C3]" />
        </div>

        {/* CEP */}
        <div>
          <label className={labelClass}>CEP</label>
          <div className="flex gap-2">
            <input type="text" inputMode="numeric" value={form.zipCode}
              onChange={(e) => update('zipCode', maskCEP(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarCEP())}
              placeholder="_____-___" maxLength={9}
              className="px-4 py-3 flex-1 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 transition-all" />
            <button type="button" onClick={buscarCEP} disabled={cepLoading}
              className="flex items-center gap-1.5 px-4 py-3 bg-[#406B5B]/10 text-[#406B5B] text-sm font-medium rounded-xl hover:bg-[#406B5B]/20 transition-colors disabled:opacity-50 whitespace-nowrap">
              {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar CEP
            </button>
          </div>
          {errors.zipCode && <p className="text-xs text-red-500 mt-1">{errors.zipCode}</p>}
        </div>

        {/* Endereço + Número */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Endereço</label>
            <input type="text" value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Rua, Avenida, Alameda..." className={inputNoIconClass} />
          </div>
          <div>
            <label className={labelClass}>Número</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input type="text" value={form.addressNumber}
                onChange={(e) => update('addressNumber', e.target.value)}
                placeholder="123" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Complemento */}
        <div>
          <label className={labelClass}>Complemento</label>
          <input type="text" value={form.addressComplement}
            onChange={(e) => update('addressComplement', e.target.value)}
            placeholder="APTO / BLOCO" className={inputNoIconClass} />
        </div>

        {/* Cidade + Bairro + UF */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Cidade</label>
            <input type="text" value={form.city}
              onChange={(e) => update('city', e.target.value)}
              placeholder="São Paulo" className={inputNoIconClass} />
          </div>
          <div>
            <label className={labelClass}>Bairro</label>
            <input type="text" value={form.neighborhood}
              onChange={(e) => update('neighborhood', e.target.value)}
              placeholder="Centro" className={inputNoIconClass} />
          </div>
          <div>
            <label className={labelClass}>Unidade da Federação</label>
            <input type="text" value={form.state}
              onChange={(e) => update('state', e.target.value.toUpperCase().slice(0, 2))}
              placeholder="SP" maxLength={2} className={inputNoIconClass} />
          </div>
        </div>

      </form>
    </ModalShell>
  );
}
