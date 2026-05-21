'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ModalShell } from '@/components/dashboard/modal-shell';
import { Search, User, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import {
  createMedicalRecord,
  resolveDoctorId,
  MedicalRecordRow,
} from '@/services/medical-records-service';
import { formatCPF, formatPhone } from '@/lib/utils';

interface NovoProntuarioModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (record: MedicalRecordRow) => void;
}

interface PatientHit {
  id: string;
  name: string;
  cpf: string;
  phone: string;
}

function onlyDigits(v: string) { return v.replace(/\D/g, ''); }

function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

const INITIAL_FORM = {
  chiefComplaint: '',
  historyPresentIllness: '',
  pastMedicalHistory: '',
  familyHistory: '',
  diagnosis: '',
  assessment: '',
  plan: '',
  prescription: '',
};

export function NovoProntuarioModal({ open, onClose, onCreated }: NovoProntuarioModalProps) {
  const user = useAuthStore((s) => s.user);

  const [cpfSearch, setCpfSearch]       = useState('');
  const [searching, setSearching]       = useState(false);
  const [patient, setPatient]           = useState<PatientHit | null>(null);
  const [notFound, setNotFound]         = useState(false);
  const [form, setForm]                 = useState(INITIAL_FORM);
  const [submitting, setSubmitting]     = useState(false);

  const reset = () => {
    setCpfSearch('');
    setPatient(null);
    setNotFound(false);
    setForm(INITIAL_FORM);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSearchCPF = async () => {
    if (!user?.tenantId) return;
    const digits = onlyDigits(cpfSearch);
    if (digits.length < 3) {
      toast.error('Digite ao menos 3 dígitos do CPF para pesquisar.');
      return;
    }
    setSearching(true);
    setPatient(null);
    setNotFound(false);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, cpf, phone')
        .eq('tenant_id', user.tenantId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .like('cpf', `%${digits}%`)
        .limit(1)
        .single();
      if (error || !data) {
        setNotFound(true);
      } else {
        setPatient(data as PatientHit);
      }
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const update = <K extends keyof typeof INITIAL_FORM>(k: K, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId || !patient) return;
    setSubmitting(true);
    try {
      const doctorId = await resolveDoctorId(user.tenantId, user.id);
      if (!doctorId) throw new Error('Médico não encontrado para este usuário. Verifique o cadastro.');

      const record = await createMedicalRecord({
        tenantId: user.tenantId,
        patientId: patient.id,
        doctorId,
        ...form,
      });
      toast.success('Prontuário criado com sucesso.');
      onCreated?.(record);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar prontuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = 'block text-xs font-medium text-[#406B5B]/70 mb-1';
  const inputClass = 'w-full px-3 py-2 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 resize-none';

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Novo Prontuário"
      subtitle="Localize o paciente pelo CPF e registre o prontuário"
      widthClass="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-[#E4D5C3] text-[#406B5B] font-medium hover:bg-[#E4D5C3]/30 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="novo-prontuario-form"
            disabled={submitting || !patient}
            className="px-5 py-2.5 rounded-xl bg-[#406B5B] text-white font-semibold hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Salvar prontuário'}
          </button>
        </>
      }
    >
      <form id="novo-prontuario-form" onSubmit={handleSubmit} className="space-y-5">

        {/* Busca por CPF */}
        <div className="bg-[#F5EFE8] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#406B5B] mb-2 uppercase tracking-wide">
            1. Localizar paciente por CPF
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="text"
                inputMode="numeric"
                value={cpfSearch}
                onChange={(e) => { setCpfSearch(maskCPF(e.target.value)); setPatient(null); setNotFound(false); }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchCPF())}
                placeholder="000.000.000-00"
                className="pl-10 pr-4 py-2.5 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
              />
            </div>
            <button
              type="button"
              onClick={handleSearchCPF}
              disabled={searching}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#406B5B] text-white rounded-xl text-sm font-medium hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </div>

          {/* Resultado */}
          {patient && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-white rounded-xl border border-[#406B5B]/20">
              <CheckCircle className="w-5 h-5 text-[#406B5B] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#406B5B] truncate">{patient.name}</p>
                <p className="text-xs text-[#406B5B]/60">
                  CPF: {formatCPF(patient.cpf)} &middot; Tel: {formatPhone(patient.phone)}
                </p>
              </div>
            </div>
          )}
          {notFound && (
            <p className="mt-2 text-xs text-red-500">
              Nenhum paciente ativo encontrado com esse CPF.
            </p>
          )}
        </div>

        {/* Formulário — visível apenas após localizar paciente */}
        {patient && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[#406B5B] uppercase tracking-wide">
              2. Dados do prontuário
            </p>

            <div>
              <label className={labelClass}>Queixa principal</label>
              <textarea
                rows={2}
                value={form.chiefComplaint}
                onChange={(e) => update('chiefComplaint', e.target.value)}
                placeholder="Motivo principal da consulta..."
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>História da doença atual</label>
                <textarea
                  rows={3}
                  value={form.historyPresentIllness}
                  onChange={(e) => update('historyPresentIllness', e.target.value)}
                  placeholder="Evolução e características dos sintomas..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Antecedentes pessoais</label>
                <textarea
                  rows={3}
                  value={form.pastMedicalHistory}
                  onChange={(e) => update('pastMedicalHistory', e.target.value)}
                  placeholder="Doenças anteriores, cirurgias, alergias..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Histórico familiar</label>
                <textarea
                  rows={2}
                  value={form.familyHistory}
                  onChange={(e) => update('familyHistory', e.target.value)}
                  placeholder="Doenças na família..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Diagnóstico</label>
                <textarea
                  rows={2}
                  value={form.diagnosis}
                  onChange={(e) => update('diagnosis', e.target.value)}
                  placeholder="CID ou descrição diagnóstica..."
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Avaliação / Exame físico</label>
              <textarea
                rows={2}
                value={form.assessment}
                onChange={(e) => update('assessment', e.target.value)}
                placeholder="Achados do exame físico e avaliação clínica..."
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Plano terapêutico</label>
                <textarea
                  rows={3}
                  value={form.plan}
                  onChange={(e) => update('plan', e.target.value)}
                  placeholder="Condutas, exames solicitados, encaminhamentos..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Prescrição</label>
                <textarea
                  rows={3}
                  value={form.prescription}
                  onChange={(e) => update('prescription', e.target.value)}
                  placeholder="Medicamentos, posologia, duração..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </ModalShell>
  );
}
