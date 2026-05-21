'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ModalShell } from '@/components/dashboard/modal-shell';
import { User, CreditCard, Phone, Mail, Calendar, MapPin, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { updatePatient, PatientRow } from '@/services/patients-service';

interface EditPatientModalProps {
  open: boolean;
  patient: PatientRow | null;
  onClose: () => void;
  onUpdated?: () => void;
}

interface FormData {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, '');
}

function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').trim();
}

function toDateInput(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10); // yyyy-MM-dd
}

export function EditPatientModal({ open, patient, onClose, onUpdated }: EditPatientModalProps) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<FormData>({
    name: '', cpf: '', phone: '', email: '', dateOfBirth: '', gender: '', address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // preenche o form toda vez que o paciente muda
  useEffect(() => {
    if (!patient) return;
    setErrors({});
    setForm({
      name:        patient.name,
      cpf:         maskCPF(patient.cpf),
      phone:       maskPhone(patient.phone),
      email:       patient.email ?? '',
      dateOfBirth: toDateInput(patient.date_of_birth),
      gender:      patient.gender ?? '',
      address:     patient.address ?? '',
    });
  }, [patient]);

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 3)
      e.name = 'Informe o nome completo (min. 3 caracteres).';
    if (onlyDigits(form.cpf).length !== 11)
      e.cpf = 'CPF deve ter 11 digitos.';
    if (onlyDigits(form.phone).length < 10)
      e.phone = 'Telefone invalido.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'E-mail invalido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate() || !patient || !user?.tenantId) return;
    setSubmitting(true);
    try {
      await updatePatient(patient.id, user.tenantId, {
        name:        form.name,
        cpf:         onlyDigits(form.cpf),
        phone:       onlyDigits(form.phone),
        email:       form.email || null,
        dateOfBirth: form.dateOfBirth || null,
        gender:      form.gender || null,
        address:     form.address || null,
      });
      toast.success('Cadastro atualizado', {
        description: `${form.name} foi atualizado com sucesso.`,
      });
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nao foi possivel atualizar o paciente.');
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
      title="Editar Paciente"
      subtitle="Altere os dados do cadastro do paciente"
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
            form="edit-patient-form"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#406B5B] text-white font-semibold hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Salvar alteracoes'}
          </button>
        </>
      }
    >
      <form id="edit-patient-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
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

        {/* CPF + Telefone */}
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

        {/* Email + Data de nascimento */}
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

        {/* Sexo + Endereço */}
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
