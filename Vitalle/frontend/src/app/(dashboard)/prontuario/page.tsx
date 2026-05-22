'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus, Loader2, Bell, Printer, ChevronDown, ChevronUp,
  User, Lock, FileText, Search, X, MessageCircle, Pencil,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  listMedicalRecords, getMedicalRecordsByPatient,
  deleteMedicalRecord, MedicalRecordRow,
  getPatientAppointmentHistory, AppointmentHistoryRow,
} from '@/services/medical-records-service';
import { NovoProntuarioModal } from '@/components/prontuario/novo-prontuario-modal';
import { EditProntuarioModal } from '@/components/prontuario/edit-prontuario-modal';
import { AnamneseTab } from '@/components/prontuario/anamnese-tab';
import { PrescricoesTab } from '@/components/prontuario/prescricoes-tab';
import { AnexosTab } from '@/components/prontuario/anexos-tab';

// ─── helpers ──────────────────────────────────────────────────────────────────

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function genderLabel(g: string | null) {
  if (g === 'M') return 'MASCULINO';
  if (g === 'F') return 'FEMININO';
  return g?.toUpperCase() ?? null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (months > 0) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  if (days  > 0) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `há ${hours}h`;
  return `há ${Math.floor(diff / 60000)}min`;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-[#406B5B] text-white',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-[#91AE9E]/30 text-[#406B5B]',
  CANCELED:  'bg-red-100 text-red-600',
  NO_SHOW:   'bg-yellow-100 text-yellow-700',
  ATENDIDO:  'bg-[#406B5B] text-white',
};

const TABS = [
  'Evolução', 'Anamnese', 'Plano de tratamento', 'Harmonização',
  'Prescrições e Laudos', 'Anexos', 'Contratos e Termos', 'Financeiro', 'Convênios',
];

// ─── Sidebar section ──────────────────────────────────────────────────────────

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-[#E4D5C3] rounded-xl overflow-hidden mb-3 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 bg-[#F7F3EE] hover:bg-[#E4D5C3]/40 transition-colors"
      >
        <span className="text-sm font-semibold text-[#406B5B]">{title}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#406B5B]/50" />
          : <ChevronDown className="w-4 h-4 text-[#406B5B]/50" />}
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

// ─── Evolution card ───────────────────────────────────────────────────────────

function EvolutionCard({
  record, onEdit, onDelete,
}: {
  record: MedicalRecordRow;
  onEdit: (r: MedicalRecordRow) => void;
  onDelete: (r: MedicalRecordRow) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const doctor     = record.doctors;
  const doctorName = doctor?.users?.name ?? 'Profissional';
  const crm        = doctor?.crm ?? '';
  const specialty  = doctor?.specialty ?? '';
  const initials   = doctorName.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const dt = new Date(record.created_at);
  const dateLabel = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const fields = [
    { label: 'Queixa principal',    value: record.chief_complaint },
    { label: 'HDA',                 value: record.history_present_illness },
    { label: 'Antecedentes',        value: record.past_medical_history },
    { label: 'Histórico familiar',  value: record.family_history },
    { label: 'Exame físico',        value: record.physical_examination },
    { label: 'Diagnóstico',         value: record.diagnosis },
    { label: 'Plano terapêutico',   value: record.plan },
    { label: 'Prescrição',          value: record.prescription },
  ].filter((f) => f.value);

  return (
    <div className="flex gap-3 mb-5">
      {/* Timeline dot */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div className="w-3 h-3 rounded-full bg-[#406B5B] z-10" />
        <div className="w-px flex-1 bg-[#E4D5C3] mt-1" />
      </div>

      {/* Card */}
      <div className="flex-1 border border-[#E4D5C3] rounded-xl overflow-hidden shadow-sm mb-2">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F3EE] border-b border-[#E4D5C3]">
          <span className="text-sm font-semibold text-[#406B5B]">{dateLabel}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => onEdit(record)}
              className="text-xs text-[#406B5B]/60 hover:text-[#406B5B] transition-colors font-medium">
              Editar
            </button>
            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)}
                className="text-xs text-red-400 hover:text-red-500 transition-colors">
                Excluir
              </button>
            ) : (
              <span className="flex items-center gap-1.5">
                <button onClick={() => onDelete(record)}
                  className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600">
                  Confirmar
                </button>
                <button onClick={() => setConfirmDel(false)}
                  className="text-xs text-[#406B5B]/50 hover:text-[#406B5B]">
                  Cancelar
                </button>
              </span>
            )}
            <Lock className="w-4 h-4 text-[#406B5B]/40" />
          </div>
        </div>

        {/* Doctor info */}
        <div className="px-4 py-3 bg-white border-b border-[#E4D5C3]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#91AE9E]/20 flex items-center justify-center text-[#406B5B] font-semibold text-sm shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#406B5B]">{doctorName}</p>
                {crm      && <p className="text-xs text-[#406B5B]/50">({crm})</p>}
                {specialty && <p className="text-xs text-[#406B5B]/40">{specialty}</p>}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-[#91AE9E]/20 text-[#406B5B] text-xs font-medium mb-1">
                PARTICULAR
              </span>
              <p className="text-xs text-[#406B5B]/40">{timeAgo(record.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Evolução */}
        <div className="px-4 py-4 bg-white">
          <p className="text-xs font-bold text-[#406B5B] uppercase tracking-widest mb-3">Evolução</p>
          {fields.length > 0 ? (
            <div className="space-y-2">
              {fields.map((f, i) => (
                <p key={i} className="text-sm text-[#406B5B]/80 leading-relaxed">
                  <span className="font-semibold text-[#406B5B]/60">{f.label}: </span>
                  {f.value}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#406B5B]/40 italic">Sem registros de evolução.</p>
          )}

          <div className="mt-4 flex justify-end">
            <button className="px-4 py-2 border border-[#406B5B]/30 text-[#406B5B] text-xs font-semibold rounded-lg hover:bg-[#406B5B]/5 transition-colors uppercase tracking-wide">
              Solicitar Consentimento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Patient detail view ──────────────────────────────────────────────────────

function PatientDetailView({
  patientId, patientName, onBack, tenantId,
}: {
  patientId: string;
  patientName: string;
  onBack: () => void;
  tenantId: string;
  userId: string;
}) {
  const [activeTab, setActiveTab]       = useState('Evolução');
  const [records, setRecords]           = useState<MedicalRecordRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentHistoryRow[]>([]);
  const [patient, setPatient]           = useState<{ name: string; date_of_birth: string | null; gender: string | null } | null>(null);
  const [loading, setLoading]           = useState(true);
  const [showNovo, setShowNovo]         = useState(false);
  const [editRecord, setEditRecord]     = useState<MedicalRecordRow | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [recs, appts, pat] = await Promise.all([
        getMedicalRecordsByPatient(tenantId, patientId),
        getPatientAppointmentHistory(tenantId, patientId, 20),
        supabase.from('patients').select('name, date_of_birth, gender').eq('id', patientId).single(),
      ]);
      setRecords(recs);
      setAppointments(appts);
      if (pat.data) setPatient(pat.data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, patientId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDelete = async (r: MedicalRecordRow) => {
    try {
      await deleteMedicalRecord(r.id, tenantId);
      toast.success('Evolução excluída.');
      setRecords((prev) => prev.filter((x) => x.id !== r.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  };

  const dob          = patient?.date_of_birth ?? null;
  const age          = calcAge(dob);
  const gender       = genderLabel(patient?.gender ?? null);
  const dobFormatted = dob ? new Date(dob).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null;
  const displayName  = patient?.name ?? patientName;
  const patInitials  = displayName.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-full bg-[#F7F3EE]">

      {/* Patient header */}
      <div className="bg-white border-b border-[#E4D5C3] px-6 py-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#91AE9E]/20 border-2 border-[#E4D5C3] flex items-center justify-center text-[#406B5B] font-bold text-xl shrink-0">
              {patInitials || <User className="w-8 h-8 text-[#406B5B]/40" />}
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#406B5B] uppercase tracking-wide">
                {displayName}
              </h1>
              {(dobFormatted || age || gender) && (
                <p className="text-sm text-[#406B5B]/60 mt-0.5">
                  {[dobFormatted, age ? `${age} ANOS` : null, gender].filter(Boolean).join(' – ')}
                </p>
              )}
              <span className="text-xs text-[#406B5B]/40 mt-0.5 block">PARTICULAR</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={onBack}
              className="px-3 py-2 text-xs text-[#406B5B]/60 hover:text-[#406B5B] border border-[#E4D5C3] rounded-lg hover:bg-[#F7F3EE] transition-colors">
              ← Voltar
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-orange-400 text-white text-sm font-medium rounded-lg hover:bg-orange-500 transition-colors">
              <MessageCircle className="w-4 h-4" /> Contato
            </button>
            <button onClick={() => setShowNovo(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#406B5B] text-white text-sm font-medium rounded-lg hover:bg-[#406B5B]/90 transition-colors">
              <Pencil className="w-4 h-4" /> Nova Evolução
            </button>
          </div>
        </div>
        <p className="text-xs text-[#406B5B] mt-3 cursor-pointer hover:text-[#406B5B]/70 transition-colors font-medium">
          # Adicionar etiqueta
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E4D5C3] overflow-x-auto shadow-sm">
        <div className="flex min-w-max">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#406B5B] text-[#406B5B]'
                  : 'border-transparent text-[#406B5B]/40 hover:text-[#406B5B]/70'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-5 p-6">

        {/* Main */}
        <div className="flex-1 min-w-0">
          {activeTab === 'Evolução' && (
            <>
              {/* Toolbar */}
              <div className="flex justify-end gap-2 mb-5">
                <button className="flex items-center gap-1.5 px-4 py-2 border border-[#E4D5C3] text-[#406B5B]/70 text-xs font-medium rounded-lg hover:bg-white transition-colors shadow-sm">
                  <Bell className="w-3.5 h-3.5" /> ALERTA DE RETORNO
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 border border-[#E4D5C3] text-[#406B5B]/70 text-xs font-medium rounded-lg hover:bg-white transition-colors shadow-sm">
                  <Printer className="w-3.5 h-3.5" /> IMPRIMIR
                </button>
              </div>

              {/* Timeline */}
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#406B5B]/30" />
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-[#406B5B]/30 gap-3">
                  <FileText className="w-12 h-12" />
                  <p className="text-sm">Nenhuma evolução registrada ainda.</p>
                  <button onClick={() => setShowNovo(true)}
                    className="mt-2 text-xs text-[#406B5B] underline underline-offset-2 hover:text-[#406B5B]/70 font-medium">
                    Registrar primeira evolução
                  </button>
                </div>
              ) : (
                <div>
                  {records.map((r) => (
                    <EvolutionCard key={r.id} record={r} onEdit={setEditRecord} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'Anamnese' && (
            <AnamneseTab tenantId={tenantId} patientId={patientId} />
          )}

          {activeTab === 'Prescrições e Laudos' && (
            <PrescricoesTab
              tenantId={tenantId}
              patientId={patientId}
              patientName={displayName}
            />
          )}

          {activeTab === 'Anexos' && (
            <AnexosTab tenantId={tenantId} patientId={patientId} />
          )}

          {activeTab !== 'Evolução' && activeTab !== 'Anamnese' && activeTab !== 'Prescrições e Laudos' && activeTab !== 'Anexos' && (
            <div className="flex flex-col items-center justify-center py-24 text-[#406B5B]/30 gap-3">
              <FileText className="w-12 h-12" />
              <p className="text-sm">
                A aba <strong className="text-[#406B5B]/50">{activeTab}</strong> está em desenvolvimento.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0">
          <SidebarSection title="Procedimentos Planejados">
            <p className="text-xs text-[#406B5B]/40 text-center py-2">Não existem tratamentos planejados</p>
          </SidebarSection>

          <SidebarSection title="Procedimentos Realizados">
            <p className="text-xs text-[#406B5B]/40 text-center py-2">Não existem tratamentos realizados</p>
          </SidebarSection>

          <SidebarSection title="Agendamentos">
            {appointments.length === 0 ? (
              <p className="text-xs text-[#406B5B]/40 text-center py-2">Nenhum agendamento encontrado</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => {
                  const dt = new Date(a.date_time);
                  const label = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={a.id} className="border-b border-[#E4D5C3]/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-[#406B5B]/70 font-medium">{label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] ?? 'bg-[#E4D5C3] text-[#406B5B]'}`}>
                          {a.status}
                        </span>
                      </div>
                      {a.type && <p className="text-xs text-[#406B5B]/50 truncate">{a.type}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </SidebarSection>
        </div>
      </div>

      <NovoProntuarioModal
        open={showNovo}
        onClose={() => setShowNovo(false)}
        onCreated={(r) => setRecords((prev) => [r, ...prev])}
        preselectedPatientId={patientId}
      />
      <EditProntuarioModal
        open={editRecord !== null}
        record={editRecord}
        onClose={() => setEditRecord(null)}
        onUpdated={(u) => setRecords((prev) => prev.map((r) => r.id === u.id ? u : r))}
      />
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ProntuarioListView({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [records, setRecords]   = useState<MedicalRecordRow[]>([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [showNovo, setShowNovo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await listMedicalRecords(tenantId)); }
    catch { setRecords([]); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const grouped: Record<string, MedicalRecordRow[]> = {};
  records.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.patients?.name.toLowerCase().includes(q) || r.patients?.cpf.includes(search.replace(/\D/g, ''));
  }).forEach((r) => {
    if (!grouped[r.patient_id]) grouped[r.patient_id] = [];
    grouped[r.patient_id].push(r);
  });

  return (
    <div>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#406B5B]">Prontuários</h1>
          <button onClick={() => setShowNovo(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#406B5B] text-white text-sm font-semibold rounded-xl hover:bg-[#406B5B]/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nova Evolução
          </button>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40 pointer-events-none" />
          <input type="text" placeholder="Buscar paciente por nome ou CPF..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-9 py-2.5 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#406B5B]/40 hover:text-[#406B5B] transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#406B5B]/30" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#406B5B]/40 gap-3">
            <FileText className="w-12 h-12" />
            <p className="text-sm">{search ? `Nenhum resultado para "${search}".` : 'Nenhum prontuário cadastrado.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.values(grouped).map((group) => {
              const p = group[0].patients;
              if (!p) return null;
              const initials = p.name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
              return (
                <button key={p.id}
                  onClick={() => router.push(`/prontuario?pacienteId=${p.id}&nome=${encodeURIComponent(p.name)}`)}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-white border border-[#E4D5C3] rounded-xl hover:shadow-md hover:border-[#406B5B]/30 transition-all text-left shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#91AE9E]/20 flex items-center justify-center text-[#406B5B] font-bold text-sm shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#406B5B]">{p.name}</p>
                    <p className="text-xs text-[#406B5B]/50">
                      {group.length} evolução{group.length !== 1 ? 'ões' : ''} registrada{group.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-xs text-[#406B5B]/30">→</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <NovoProntuarioModal open={showNovo} onClose={() => setShowNovo(false)} onCreated={() => load()} />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function ProntuarioContent() {
  const user         = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const router       = useRouter();

  const pacienteId = searchParams.get('pacienteId');
  const nomeParam  = searchParams.get('nome') ?? '';

  if (!user?.tenantId) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#406B5B]/40" /></div>;
  }

  if (pacienteId) {
    return (
      <PatientDetailView
        patientId={pacienteId}
        patientName={nomeParam}
        tenantId={user.tenantId}
        userId={user.id}
        onBack={() => router.push('/prontuario')}
      />
    );
  }

  return <ProntuarioListView tenantId={user.tenantId} />;
}

export default function ProntuarioPage() {
  return (
    <Suspense fallback={null}>
      <ProntuarioContent />
    </Suspense>
  );
}
