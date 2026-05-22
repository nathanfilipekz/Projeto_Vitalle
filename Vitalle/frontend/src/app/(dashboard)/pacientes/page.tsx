'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import {
  Plus, Search, Loader2, UserX, X, Pencil, FileText, ChevronDown,
} from 'lucide-react';
import { formatCPF, formatPhone } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import {
  listPatients, searchPatients, getPatientStats, deletePatient,
  PatientRow, PatientStats,
} from '@/services/patients-service';
import { NewPatientModal } from '@/components/dashboard/new-patient-modal';
import { EditPatientModal } from '@/components/pacientes/edit-patient-modal';

/* ------------------------------------------------------------------ */
/* Dropdown OPÇÕES                                                       */
/* ------------------------------------------------------------------ */
interface RowMenuProps {
  patient: PatientRow;
  onEdit: (p: PatientRow) => void;
  onProntuario: (p: PatientRow) => void;
}

function RowMenu({ patient, onEdit, onProntuario }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#406B5B] text-white text-xs font-semibold rounded-lg hover:bg-[#406B5B]/90 transition-colors shadow-sm"
      >
        OPÇÕES
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-52 bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 py-1 animate-in fade-in zoom-in-95">
          <button
            onClick={() => { setOpen(false); onEdit(patient); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
          >
            <Pencil className="w-4 h-4 text-[#91AE9E]" />
            Editar Paciente
          </button>
          <button
            onClick={() => { setOpen(false); onProntuario(patient); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
          >
            <FileText className="w-4 h-4 text-[#91AE9E]" />
            Prontuário do Paciente
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Linha da tabela                                                       */
/* ------------------------------------------------------------------ */
interface PatientRowProps {
  index: number;
  patient: PatientRow;
  onEdit: (p: PatientRow) => void;
  onProntuario: (p: PatientRow) => void;
}

function PatientTableRow({ index, patient, onEdit, onProntuario }: PatientRowProps) {
  const initials = patient.name
    .split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <tr className="border-b border-[#E4D5C3]/30 hover:bg-[#F7F3EE] transition-colors group">
      {/* Nome */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#91AE9E]/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-[#406B5B] font-semibold text-xs">{initials}</span>
          </div>
          <span className="text-sm font-medium text-[#406B5B] uppercase">{patient.name}</span>
        </div>
      </td>

      {/* Telefone */}
      <td className="py-3.5 px-4 text-sm text-[#406B5B]/70">
        {patient.phone ? formatPhone(patient.phone) : '—'}
      </td>

      {/* CPF */}
      <td className="py-3.5 px-4 text-sm text-[#406B5B]/70">
        {patient.cpf ? formatCPF(patient.cpf) : '—'}
      </td>

      {/* E-Mail */}
      <td className="py-3.5 px-4 text-sm text-[#406B5B]/70 max-w-[200px] truncate">
        {patient.email || '—'}
      </td>

      {/* Ações */}
      <td className="py-3.5 px-4 text-right">
        <RowMenu patient={patient} onEdit={onEdit} onProntuario={onProntuario} />
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */
export default function PacientesPage() {
  const user    = useAuthStore((s) => s.user);
  const router  = useRouter();

  const [patients, setPatients]         = useState<PatientRow[]>([]);
  const [stats, setStats]               = useState<PatientStats>({ total: 0, thisMonth: 0 });
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editPatient, setEditPatient]   = useState<PatientRow | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPatients = useCallback(async (query: string) => {
    if (!user?.tenantId) return;
    setLoading(true);
    try {
      const data = query.trim().length >= 2
        ? await searchPatients(user.tenantId, query.trim())
        : await listPatients(user.tenantId);
      setPatients(data);
    } catch { setPatients([]); }
    finally   { setLoading(false); }
  }, [user?.tenantId]);

  const loadStats = useCallback(async () => {
    if (!user?.tenantId) return;
    try { setStats(await getPatientStats(user.tenantId)); } catch { /* silencioso */ }
  }, [user?.tenantId]);

  useEffect(() => { loadPatients(''); loadStats(); }, [loadPatients, loadStats]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadPatients(value), 300);
  };

  const clearSearch  = () => { setSearch(''); loadPatients(''); };
  const handleAfterSave = () => { loadPatients(search); loadStats(); };

  const handleProntuario = (patient: PatientRow) => {
    router.push(`/prontuario?pacienteId=${patient.id}&nome=${encodeURIComponent(patient.name)}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = async (patient: PatientRow) => {
    if (!user?.tenantId) return;
    try {
      await deletePatient(patient.id, user.tenantId);
      toast.success('Paciente excluído', { description: `${patient.name} foi removido da base.` });
      loadPatients(search);
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o paciente.');
    }
  };

  return (
    <div>
      <Header title="Pacientes" subtitle="Gerencie seus pacientes" />

      <div className="p-8">
        {/* Barra de ações */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou telefone..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-9 py-2.5 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
            />
            {search && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#406B5B]/40 hover:text-[#406B5B] transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#406B5B] text-white rounded-xl hover:bg-[#406B5B]/90 transition-colors text-sm font-semibold shadow-sm whitespace-nowrap uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" />
            Criar Novo Paciente
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-[#E4D5C3]/50">
            <p className="text-sm text-[#406B5B]/60">Total de Pacientes</p>
            <p className="text-2xl font-bold text-[#406B5B] mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#E4D5C3]/50">
            <p className="text-sm text-[#406B5B]/60">Novos este mês</p>
            <p className="text-2xl font-bold text-[#91AE9E] mt-1">{stats.thisMonth}</p>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#406B5B]/30" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#406B5B]/40 gap-3">
            <UserX className="w-12 h-12" />
            <p className="text-sm">
              {search.trim()
                ? `Nenhum paciente encontrado para "${search}".`
                : 'Nenhum paciente cadastrado ainda.'}
            </p>
            {!search.trim() && (
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-2 text-xs font-medium text-[#406B5B] underline underline-offset-2 hover:text-[#406B5B]/70 transition-colors"
              >
                Cadastrar primeiro paciente
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E4D5C3]/50 shadow-sm">
            {search.trim() && (
              <div className="px-4 py-2 border-b border-[#E4D5C3]/30 bg-[#F7F3EE] rounded-t-2xl">
                <p className="text-xs text-[#406B5B]/50">
                  {patients.length} resultado{patients.length !== 1 ? 's' : ''} para &quot;{search}&quot;
                </p>
              </div>
            )}
            <div className="w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E4D5C3]/50 bg-[#F7F3EE]">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#406B5B]/60 uppercase tracking-wider">Nome</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#406B5B]/60 uppercase tracking-wider">Telefones</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#406B5B]/60 uppercase tracking-wider">CPF</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#406B5B]/60 uppercase tracking-wider">E-Mail</th>
                    <th className="py-3 px-4 w-28" />
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p, idx) => (
                    <PatientTableRow
                      key={p.id}
                      index={idx + 1}
                      patient={p}
                      onEdit={setEditPatient}
                      onProntuario={handleProntuario}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <NewPatientModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleAfterSave}
      />

      <EditPatientModal
        open={editPatient !== null}
        patient={editPatient}
        onClose={() => setEditPatient(null)}
        onUpdated={handleAfterSave}
      />
    </div>
  );
}
