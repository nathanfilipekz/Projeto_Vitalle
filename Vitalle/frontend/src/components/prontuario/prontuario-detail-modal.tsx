'use client';

import { useEffect, useState } from 'react';
import { ModalShell } from '@/components/dashboard/modal-shell';
import {
  User, CreditCard, Calendar, FileText, Stethoscope,
  ClipboardList, Pill, Activity, Loader2, Pencil,
  Plus, Trash2, Clock,
} from 'lucide-react';
import { formatCPF, formatPhone } from '@/lib/utils';
import {
  MedicalRecordRow,
  AppointmentHistoryRow,
  getPatientAppointmentHistory,
} from '@/services/medical-records-service';
import {
  AtendimentoRow,
  listAtendimentos,
  createAtendimento,
  deleteAtendimento,
  buildAtendimentoTitle,
} from '@/services/atendimentos-service';
import { resolveDoctorId } from '@/services/medical-records-service';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED:   'Agendada',
  CONFIRMED:   'Confirmada',
  CANCELED:    'Cancelada',
  RESCHEDULED: 'Remarcada',
  COMPLETED:   'Concluida',
  NO_SHOW:     'Nao compareceu',
};
const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:   'bg-blue-50 text-blue-600',
  CONFIRMED:   'bg-[#406B5B]/10 text-[#406B5B]',
  CANCELED:    'bg-red-50 text-red-500',
  RESCHEDULED: 'bg-yellow-50 text-yellow-600',
  COMPLETED:   'bg-emerald-50 text-emerald-600',
  NO_SHOW:     'bg-gray-100 text-gray-400',
};

interface ProntuarioDetailModalProps {
  open: boolean;
  record: MedicalRecordRow | null;
  onClose: () => void;
  onEdit?: (r: MedicalRecordRow) => void;
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-[#406B5B]/50">{icon}</span>}
        <p className="text-xs font-semibold text-[#406B5B]/50 uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-2 border-b border-[#E4D5C3]/40 last:border-0">
      {icon && <span className="mt-0.5 text-[#406B5B]/40 shrink-0">{icon}</span>}
      <div>
        <p className="text-xs text-[#406B5B]/50 mb-0.5">{label}</p>
        <p className="text-sm text-[#406B5B] whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  );
}

export function ProntuarioDetailModal({ open, record, onClose, onEdit }: ProntuarioDetailModalProps) {
  const user = useAuthStore((s) => s.user);
  const [appointments, setAppointments]   = useState<AppointmentHistoryRow[]>([]);
  const [atendimentos, setAtendimentos]   = useState<AtendimentoRow[]>([]);
  const [loadingAppts, setLoadingAppts]   = useState(false);
  const [loadingAtend, setLoadingAtend]   = useState(false);

  // form de novo atendimento
  const [showNovoAtend, setShowNovoAtend] = useState(false);
  const [atendDesc, setAtendDesc]         = useState('');
  const [atendObs, setAtendObs]           = useState('');
  const [savingAtend, setSavingAtend]     = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  // título automático com data/hora atual ao abrir o form
  const [atendTitle, setAtendTitle]       = useState('');

  useEffect(() => {
    if (!open || !record || !user?.tenantId) return;
    setLoadingAppts(true);
    setLoadingAtend(true);
    getPatientAppointmentHistory(user.tenantId, record.patient_id)
      .then(setAppointments).catch(() => setAppointments([]))
      .finally(() => setLoadingAppts(false));
    listAtendimentos(user.tenantId, record.patient_id)
      .then(setAtendimentos).catch(() => setAtendimentos([]))
      .finally(() => setLoadingAtend(false));
  }, [open, record, user?.tenantId]);

  const handleOpenNovoAtend = () => {
    setAtendTitle(buildAtendimentoTitle());
    setAtendDesc('');
    setAtendObs('');
    setShowNovoAtend(true);
  };

  const handleSalvarAtendimento = async () => {
    if (!user?.tenantId || !record) return;
    if (!atendDesc.trim()) { toast.error('Descreva o atendimento antes de salvar.'); return; }
    setSavingAtend(true);
    try {
      const doctorId = await resolveDoctorId(user.tenantId, user.id);
      if (!doctorId) throw new Error('Medico nao encontrado para este usuario.');
      const novo = await createAtendimento({
        tenantId:    user.tenantId,
        patientId:   record.patient_id,
        doctorId,
        title:       atendTitle,
        description: atendDesc.trim(),
        observations: atendObs.trim() || null,
      });
      setAtendimentos((prev) => [novo, ...prev]);
      setShowNovoAtend(false);
      toast.success('Atendimento registrado com sucesso.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar atendimento.');
    } finally {
      setSavingAtend(false);
    }
  };

  const handleDeleteAtendimento = async (id: string) => {
    if (!user?.tenantId || deletingId) return;
    setDeletingId(id);
    try {
      await deleteAtendimento(id, user.tenantId);
      setAtendimentos((prev) => prev.filter((a) => a.id !== id));
      toast.success('Atendimento removido.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover atendimento.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!record) return null;

  const patient   = record.patients;
  const initials  = (patient?.name ?? '?')
    .split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const createdDate = new Date(record.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const inputClass = 'w-full px-3 py-2 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 resize-none';

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Prontuario"
      subtitle={`Criado em ${createdDate}`}
      widthClass="max-w-2xl"
      footer={
        onEdit ? (
          <button
            onClick={() => { onClose(); onEdit(record); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#406B5B] text-white rounded-xl font-medium hover:bg-[#406B5B]/90 transition-colors text-sm"
          >
            <Pencil className="w-4 h-4" />
            Editar prontuario
          </button>
        ) : undefined
      }
    >
      <div className="space-y-1">

        {/* Cabecalho do paciente */}
        {patient && (
          <div className="flex items-center gap-4 p-4 bg-[#F5EFE8] rounded-xl mb-4">
            <div className="w-12 h-12 bg-[#91AE9E]/30 rounded-full flex items-center justify-center shrink-0">
              <span className="text-[#406B5B] font-bold text-base">{initials}</span>
            </div>
            <div>
              <p className="text-base font-semibold text-[#406B5B]">{patient.name}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-[#406B5B]/60">
                  <CreditCard className="w-3 h-3" /> {formatCPF(patient.cpf)}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#406B5B]/60">
                  <User className="w-3 h-3" /> {formatPhone(patient.phone)}
                </span>
                {patient.date_of_birth && (
                  <span className="flex items-center gap-1 text-xs text-[#406B5B]/60">
                    <Calendar className="w-3 h-3" />
                    {new Date(patient.date_of_birth).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dados clinicos (anamnese) */}
        <Section title="Dados da Anamnese" icon={<ClipboardList className="w-4 h-4" />}>
          <Field icon={<Stethoscope className="w-4 h-4" />}   label="Queixa principal"        value={record.chief_complaint} />
          <Field icon={<Activity    className="w-4 h-4" />}   label="Historia da doenca atual" value={record.history_present_illness} />
          <Field icon={<ClipboardList className="w-4 h-4" />} label="Antecedentes pessoais"   value={record.past_medical_history} />
          <Field icon={<User        className="w-4 h-4" />}   label="Historico familiar"       value={record.family_history} />
          <Field icon={<FileText    className="w-4 h-4" />}   label="Habitos e estilo de vida" value={record.social_history} />
          <Field icon={<FileText    className="w-4 h-4" />}   label="Revisao de sistemas"      value={record.review_of_systems} />
          <Field icon={<FileText    className="w-4 h-4" />}   label="Exame fisico"             value={record.physical_examination} />
          <Field icon={<FileText    className="w-4 h-4" />}   label="Avaliacao"                value={record.assessment} />
          <Field icon={<FileText    className="w-4 h-4" />}   label="Diagnostico"              value={record.diagnosis} />
          <Field icon={<ClipboardList className="w-4 h-4" />} label="Plano terapeutico"        value={record.plan} />
          <Field icon={<Pill        className="w-4 h-4" />}   label="Prescricao"               value={record.prescription} />
          {!record.chief_complaint && !record.diagnosis && !record.assessment && !record.plan && (
            <p className="text-xs text-[#406B5B]/40 italic py-2">Nenhum dado clinico registrado.</p>
          )}
        </Section>

        <div className="border-t border-[#E4D5C3]/60 my-4" />

        {/* ── Registros de Atendimento ── */}
        <Section title="Registros de Atendimento" icon={<Clock className="w-4 h-4" />}>

          {/* Botão adicionar */}
          {!showNovoAtend && (
            <button
              onClick={handleOpenNovoAtend}
              className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-[#406B5B] text-white rounded-xl text-sm font-medium hover:bg-[#406B5B]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar atendimento atual
            </button>
          )}

          {/* Formulário de novo atendimento */}
          {showNovoAtend && (
            <div className="mb-4 p-4 bg-[#F5EFE8] rounded-xl border border-[#E4D5C3]">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-[#406B5B]" />
                <p className="text-xs font-semibold text-[#406B5B] uppercase tracking-wide">
                  Novo Registro — {atendTitle}
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#406B5B]/70 mb-1">
                    Descricao do atendimento *
                  </label>
                  <textarea
                    rows={3}
                    value={atendDesc}
                    onChange={(e) => setAtendDesc(e.target.value)}
                    placeholder="Descreva o atendimento, evolucao clinica, intercorrencias..."
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#406B5B]/70 mb-1">
                    Observacoes adicionais
                  </label>
                  <textarea
                    rows={2}
                    value={atendObs}
                    onChange={(e) => setAtendObs(e.target.value)}
                    placeholder="Exames solicitados, retorno agendado, orientacoes..."
                    className={inputClass}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSalvarAtendimento}
                    disabled={savingAtend}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#406B5B] text-white rounded-xl text-sm font-medium hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50"
                  >
                    {savingAtend ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    {savingAtend ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setShowNovoAtend(false)}
                    disabled={savingAtend}
                    className="px-4 py-2 border border-[#E4D5C3] text-[#406B5B] rounded-xl text-sm hover:bg-[#E4D5C3]/30 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de atendimentos */}
          {loadingAtend ? (
            <div className="flex items-center gap-2 py-4 text-[#406B5B]/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Carregando registros...</span>
            </div>
          ) : atendimentos.length === 0 ? (
            <p className="text-xs text-[#406B5B]/40 italic py-2">
              Nenhum registro de atendimento ainda. Use o botao acima para registrar o atendimento atual.
            </p>
          ) : (
            <div className="space-y-3">
              {atendimentos.map((a) => (
                <div key={a.id} className="p-3 bg-white rounded-xl border border-[#E4D5C3]/60">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#406B5B]/50 shrink-0" />
                      <span className="text-xs font-semibold text-[#406B5B]">{a.title}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteAtendimento(a.id)}
                      disabled={deletingId === a.id}
                      className="p-1 rounded text-[#406B5B]/30 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                      title="Remover registro"
                    >
                      {deletingId === a.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                  <p className="text-sm text-[#406B5B] whitespace-pre-wrap leading-relaxed">{a.description}</p>
                  {a.observations && (
                    <p className="text-xs text-[#406B5B]/60 mt-1.5 italic whitespace-pre-wrap">{a.observations}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <div className="border-t border-[#E4D5C3]/60 my-4" />

        {/* Historico de consultas */}
        <Section title="Historico de Consultas" icon={<Calendar className="w-4 h-4" />}>
          {loadingAppts ? (
            <div className="flex items-center gap-2 py-4 text-[#406B5B]/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Carregando consultas...</span>
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-xs text-[#406B5B]/40 italic py-2">Nenhuma consulta registrada para este paciente.</p>
          ) : (
            <div className="space-y-2">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 py-2 border-b border-[#E4D5C3]/40 last:border-0">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-[#406B5B]/40 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-[#406B5B]">
                        {new Date(a.date_time).toLocaleString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      {a.type  && <p className="text-xs text-[#406B5B]/60">{a.type}</p>}
                      {a.notes && <p className="text-xs text-[#406B5B]/50 mt-0.5 italic">{a.notes}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </ModalShell>
  );
}
