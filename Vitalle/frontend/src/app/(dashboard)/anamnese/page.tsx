'use client';

import { Header } from '@/components/layout/header';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Plus, ClipboardList, User, Calendar, CreditCard,
  Loader2, X, CheckCircle, ChevronRight, FileText,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  listMedicalRecords,
  searchMedicalRecords,
  createMedicalRecord,
  resolveDoctorId,
  MedicalRecordRow,
} from '@/services/medical-records-service';
import { formatCPF, formatPhone } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PatientHit {
  id: string;
  name: string;
  cpf: string;
  phone: string;
}

const EMPTY_FORM = {
  chiefComplaint:        '',
  historyPresentIllness: '',
  pastMedicalHistory:    '',
  familyHistory:         '',
  socialHistory:         '',
  reviewOfSystems:       '',
  physicalExamination:   '',
  assessment:            '',
  diagnosis:             '',
  plan:                  '',
  prescription:          '',
};

function onlyDigits(v: string) { return v.replace(/\D/g, ''); }
function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// ─── Labels e seções do formulário ───────────────────────────────────────────

const SECTIONS = [
  {
    title: 'Identificacao do Paciente',
    fields: [] as string[],
    special: 'cpf_search',
  },
  {
    title: 'Queixa e Historia Clinica',
    fields: ['chiefComplaint', 'historyPresentIllness'],
  },
  {
    title: 'Antecedentes',
    fields: ['pastMedicalHistory', 'familyHistory'],
  },
  {
    title: 'Habitos e Revisao de Sistemas',
    fields: ['socialHistory', 'reviewOfSystems'],
  },
  {
    title: 'Exame Fisico e Conclusao',
    fields: ['physicalExamination', 'assessment', 'diagnosis', 'plan', 'prescription'],
  },
];

const FIELD_LABELS: Record<string, { label: string; placeholder: string; rows: number }> = {
  chiefComplaint:        { label: 'Queixa principal *',        placeholder: 'Motivo da consulta — o que trouxe o paciente hoje...', rows: 2 },
  historyPresentIllness: { label: 'Historia da doenca atual',  placeholder: 'Evolucao, caracteristicas, fatores de melhora/piora, sintomas associados...', rows: 3 },
  pastMedicalHistory:    { label: 'Antecedentes pessoais',     placeholder: 'Doencas previas, cirurgias, hospitalizacoes, alergias, medicamentos em uso...', rows: 3 },
  familyHistory:         { label: 'Historico familiar',        placeholder: 'Doencas nos pais, irmaos, filhos — diabetes, hipertensao, cancer...', rows: 2 },
  socialHistory:         { label: 'Habitos e estilo de vida',  placeholder: 'Tabagismo, etilismo, atividade fisica, alimentacao, trabalho, stress...', rows: 2 },
  reviewOfSystems:       { label: 'Revisao de sistemas',       placeholder: 'Cardiorespiratorio, digestivo, neurologico, osteoarticular, urinario...', rows: 2 },
  physicalExamination:   { label: 'Exame fisico',              placeholder: 'PA, FC, peso, altura, ausculta, palpacao, achados relevantes...', rows: 3 },
  assessment:            { label: 'Avaliacao clinica',         placeholder: 'Impressao diagnostica e raciocinio clinico...', rows: 2 },
  diagnosis:             { label: 'Diagnostico (CID)',         placeholder: 'Ex.: J06.9 — Infeccao aguda das vias aereas superiores nao especificada', rows: 2 },
  plan:                  { label: 'Plano terapeutico',         placeholder: 'Condutas, exames solicitados, encaminhamentos, retorno...', rows: 3 },
  prescription:          { label: 'Prescricao',               placeholder: 'Medicamentos, posologia, duracao do tratamento...', rows: 3 },
};

// ─── Card da anamnese na lista ────────────────────────────────────────────────

function AnamneseCard({ record, onClick }: { record: MedicalRecordRow; onClick: () => void }) {
  const patient = record.patients;
  const date    = new Date(record.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-5 border border-[#E4D5C3]/50 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#91AE9E]/20 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-[#406B5B]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#406B5B] truncate">{patient?.name ?? '—'}</h3>
            {patient?.cpf && (
              <p className="text-xs text-[#406B5B]/50">CPF: {formatCPF(patient.cpf)}</p>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#406B5B]/30 group-hover:text-[#406B5B] transition-colors mt-1 shrink-0" />
      </div>
      {record.chief_complaint && (
        <p className="text-xs text-[#406B5B]/60 line-clamp-2 mb-2">{record.chief_complaint}</p>
      )}
      <div className="flex items-center gap-1 text-xs text-[#406B5B]/40">
        <Calendar className="w-3.5 h-3.5" /> {date}
      </div>
    </button>
  );
}

// ─── Conteúdo principal ────────────────────────────────────────────────────────

function AnamneseContent() {
  const user         = useAuthStore((s) => s.user);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const autoNovo     = searchParams.get('novo') === 'true';

  const [allRecords, setAllRecords]   = useState<MedicalRecordRow[]>([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);

  // form inline
  const [showForm, setShowForm]       = useState(false);
  const [cpfInput, setCpfInput]       = useState('');
  const [searchingCPF, setSearchingCPF] = useState(false);
  const [patient, setPatient]         = useState<PatientHit | null>(null);
  const [cpfNotFound, setCpfNotFound] = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [step, setStep]               = useState<'cpf' | 'form'>('cpf');

  const formRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user?.tenantId) return;
    setLoading(true);
    try { setAllRecords(await listMedicalRecords(user.tenantId)); }
    catch { setAllRecords([]); }
    finally { setLoading(false); }
  }, [user?.tenantId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (autoNovo && !showForm) {
      setShowForm(true);
      setStep('cpf');
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [autoNovo]);

  const displayed = search.trim()
    ? searchMedicalRecords(allRecords, search)
    : allRecords;

  const handleSearchCPF = async () => {
    if (!user?.tenantId) return;
    const digits = onlyDigits(cpfInput);
    if (digits.length < 3) { toast.error('Digite ao menos 3 digitos do CPF.'); return; }
    setSearchingCPF(true);
    setPatient(null);
    setCpfNotFound(false);
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
      if (error || !data) { setCpfNotFound(true); }
      else { setPatient(data as PatientHit); setStep('form'); }
    } catch { setCpfNotFound(true); }
    finally { setSearchingCPF(false); }
  };

  const update = <K extends keyof typeof EMPTY_FORM>(k: K, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId || !patient) return;
    if (!form.chiefComplaint.trim()) { toast.error('Preencha a queixa principal.'); return; }
    setSubmitting(true);
    try {
      const doctorId = await resolveDoctorId(user.tenantId, user.id);
      if (!doctorId) throw new Error('Medico nao encontrado para este usuario.');
      await createMedicalRecord({
        tenantId:              user.tenantId,
        patientId:             patient.id,
        doctorId,
        chiefComplaint:        form.chiefComplaint        || null,
        historyPresentIllness: form.historyPresentIllness || null,
        pastMedicalHistory:    form.pastMedicalHistory    || null,
        familyHistory:         form.familyHistory         || null,
        diagnosis:             form.diagnosis             || null,
        assessment:            form.assessment            || null,
        plan:                  form.plan                  || null,
        prescription:          form.prescription          || null,
      });
      toast.success(`Anamnese de ${patient.name} salva! Redirecionando para o prontuario...`);
      setTimeout(() => {
        router.push(`/prontuario?pacienteId=${patient.id}&nome=${encodeURIComponent(patient.name)}`);
      }, 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar anamnese.');
      setSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setStep('cpf');
    setCpfInput('');
    setPatient(null);
    setCpfNotFound(false);
    setForm(EMPTY_FORM);
  };

  const labelClass = 'block text-xs font-medium text-[#406B5B]/70 mb-1';
  const inputClass = 'w-full px-3 py-2.5 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 resize-none';

  return (
    <div>
      <Header
        title="Anamnese"
        subtitle="Historico clinico e entrevista medica"
      />

      <div className="p-8">

        {/* Barra de ações */}
        {!showForm && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-9 py-2.5 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#406B5B]/40 hover:text-[#406B5B]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => { setShowForm(true); setStep('cpf'); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#406B5B] text-white rounded-xl hover:bg-[#406B5B]/90 transition-colors text-sm font-medium shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nova Anamnese
            </button>
          </div>
        )}

        {/* ── FORMULÁRIO INLINE ── */}
        {showForm && (
          <div ref={formRef} className="mb-8">
            {/* Header do form */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#406B5B]">Nova Anamnese</h2>
                <p className="text-sm text-[#406B5B]/60">
                  {step === 'cpf'
                    ? 'Localize o paciente pelo CPF para iniciar'
                    : `Paciente: ${patient?.name}`}
                </p>
              </div>
              <button
                onClick={handleCancelForm}
                className="flex items-center gap-1.5 text-sm text-[#406B5B]/50 hover:text-[#406B5B] transition-colors"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Etapa 1: CPF */}
              <div className="bg-[#F5EFE8] rounded-2xl p-5">
                <p className="text-xs font-semibold text-[#406B5B] uppercase tracking-wide mb-3">
                  1. Identificar Paciente
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cpfInput}
                      onChange={(e) => { setCpfInput(maskCPF(e.target.value)); setPatient(null); setCpfNotFound(false); setStep('cpf'); }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchCPF())}
                      placeholder="000.000.000-00"
                      className="pl-10 pr-4 py-2.5 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchCPF}
                    disabled={searchingCPF}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#406B5B] text-white rounded-xl text-sm font-medium hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50"
                  >
                    {searchingCPF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Buscar
                  </button>
                </div>
                {patient && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-white rounded-xl border border-[#406B5B]/20">
                    <CheckCircle className="w-5 h-5 text-[#406B5B] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#406B5B]">{patient.name}</p>
                      <p className="text-xs text-[#406B5B]/60">
                        CPF: {formatCPF(patient.cpf)} &middot; Tel: {formatPhone(patient.phone)}
                      </p>
                    </div>
                  </div>
                )}
                {cpfNotFound && (
                  <p className="mt-2 text-xs text-red-500">Nenhum paciente ativo encontrado com esse CPF.</p>
                )}
              </div>

              {/* Etapa 2: Formulário — só aparece após localizar paciente */}
              {step === 'form' && patient && (
                <>
                  {/* Queixa e HDA */}
                  <div className="bg-white rounded-2xl p-5 border border-[#E4D5C3]/50">
                    <p className="text-xs font-semibold text-[#406B5B] uppercase tracking-wide mb-4">
                      2. Queixa e Historia Clinica
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>{FIELD_LABELS.chiefComplaint.label}</label>
                        <textarea rows={FIELD_LABELS.chiefComplaint.rows}
                          value={form.chiefComplaint}
                          onChange={(e) => update('chiefComplaint', e.target.value)}
                          placeholder={FIELD_LABELS.chiefComplaint.placeholder}
                          className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>{FIELD_LABELS.historyPresentIllness.label}</label>
                        <textarea rows={FIELD_LABELS.historyPresentIllness.rows}
                          value={form.historyPresentIllness}
                          onChange={(e) => update('historyPresentIllness', e.target.value)}
                          placeholder={FIELD_LABELS.historyPresentIllness.placeholder}
                          className={inputClass} />
                      </div>
                    </div>
                  </div>

                  {/* Antecedentes */}
                  <div className="bg-white rounded-2xl p-5 border border-[#E4D5C3]/50">
                    <p className="text-xs font-semibold text-[#406B5B] uppercase tracking-wide mb-4">
                      3. Antecedentes
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>{FIELD_LABELS.pastMedicalHistory.label}</label>
                        <textarea rows={FIELD_LABELS.pastMedicalHistory.rows}
                          value={form.pastMedicalHistory}
                          onChange={(e) => update('pastMedicalHistory', e.target.value)}
                          placeholder={FIELD_LABELS.pastMedicalHistory.placeholder}
                          className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>{FIELD_LABELS.familyHistory.label}</label>
                        <textarea rows={FIELD_LABELS.familyHistory.rows}
                          value={form.familyHistory}
                          onChange={(e) => update('familyHistory', e.target.value)}
                          placeholder={FIELD_LABELS.familyHistory.placeholder}
                          className={inputClass} />
                      </div>
                    </div>
                  </div>

                  {/* Habitos */}
                  <div className="bg-white rounded-2xl p-5 border border-[#E4D5C3]/50">
                    <p className="text-xs font-semibold text-[#406B5B] uppercase tracking-wide mb-4">
                      4. Habitos e Revisao de Sistemas
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>{FIELD_LABELS.socialHistory.label}</label>
                        <textarea rows={FIELD_LABELS.socialHistory.rows}
                          value={form.socialHistory}
                          onChange={(e) => update('socialHistory', e.target.value)}
                          placeholder={FIELD_LABELS.socialHistory.placeholder}
                          className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>{FIELD_LABELS.reviewOfSystems.label}</label>
                        <textarea rows={FIELD_LABELS.reviewOfSystems.rows}
                          value={form.reviewOfSystems}
                          onChange={(e) => update('reviewOfSystems', e.target.value)}
                          placeholder={FIELD_LABELS.reviewOfSystems.placeholder}
                          className={inputClass} />
                      </div>
                    </div>
                  </div>

                  {/* Exame + Conclusão */}
                  <div className="bg-white rounded-2xl p-5 border border-[#E4D5C3]/50">
                    <p className="text-xs font-semibold text-[#406B5B] uppercase tracking-wide mb-4">
                      5. Exame Fisico e Conclusao
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>{FIELD_LABELS.physicalExamination.label}</label>
                        <textarea rows={FIELD_LABELS.physicalExamination.rows}
                          value={form.physicalExamination}
                          onChange={(e) => update('physicalExamination', e.target.value)}
                          placeholder={FIELD_LABELS.physicalExamination.placeholder}
                          className={inputClass} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>{FIELD_LABELS.assessment.label}</label>
                          <textarea rows={FIELD_LABELS.assessment.rows}
                            value={form.assessment}
                            onChange={(e) => update('assessment', e.target.value)}
                            placeholder={FIELD_LABELS.assessment.placeholder}
                            className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>{FIELD_LABELS.diagnosis.label}</label>
                          <textarea rows={FIELD_LABELS.diagnosis.rows}
                            value={form.diagnosis}
                            onChange={(e) => update('diagnosis', e.target.value)}
                            placeholder={FIELD_LABELS.diagnosis.placeholder}
                            className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>{FIELD_LABELS.plan.label}</label>
                        <textarea rows={FIELD_LABELS.plan.rows}
                          value={form.plan}
                          onChange={(e) => update('plan', e.target.value)}
                          placeholder={FIELD_LABELS.plan.placeholder}
                          className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>{FIELD_LABELS.prescription.label}</label>
                        <textarea rows={FIELD_LABELS.prescription.rows}
                          value={form.prescription}
                          onChange={(e) => update('prescription', e.target.value)}
                          placeholder={FIELD_LABELS.prescription.placeholder}
                          className={inputClass} />
                      </div>
                    </div>
                  </div>

                  {/* Botões de salvar */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-3 bg-[#406B5B] text-white rounded-xl font-semibold hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50 text-sm"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      {submitting ? 'Salvando e gerando prontuario...' : 'Salvar anamnese e gerar prontuario'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      disabled={submitting}
                      className="px-5 py-3 border border-[#E4D5C3] text-[#406B5B] rounded-xl text-sm hover:bg-[#E4D5C3]/30 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}

        {/* ── LISTA ── */}
        {!showForm && (
          <>
            {!loading && displayed.length > 0 && (
              <p className="text-xs text-[#406B5B]/50 mb-4">
                {displayed.length} anamnese{displayed.length !== 1 ? 's' : ''}
                {search.trim() ? ` para "${search}"` : ''}
              </p>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-[#406B5B]/30" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-[#406B5B]/40 gap-3">
                <ClipboardList className="w-12 h-12" />
                <p className="text-sm">
                  {search.trim()
                    ? `Nenhuma anamnese encontrada para "${search}".`
                    : 'Nenhuma anamnese registrada ainda.'}
                </p>
                {!search.trim() && (
                  <button
                    onClick={() => { setShowForm(true); setStep('cpf'); }}
                    className="mt-2 text-xs font-medium text-[#406B5B] underline underline-offset-2 hover:text-[#406B5B]/70 transition-colors"
                  >
                    Registrar primeira anamnese
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayed.map((r) => (
                  <AnamneseCard
                    key={r.id}
                    record={r}
                    onClick={() => {
                      router.push(`/prontuario?pacienteId=${r.patient_id}&nome=${encodeURIComponent(r.patients?.name ?? '')}`);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AnamnesePage() {
  return (
    <Suspense fallback={null}>
      <AnamneseContent />
    </Suspense>
  );
}
