'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import {
  Plus, Search, Phone, Mail, MoreVertical,
  FileText, Eye, Loader2, UserX, Calendar, X, Pencil, Trash2, AlertTriangle,
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
import { PatientDetailsModal } from '@/components/pacientes/patient-details-modal';

// Dropdown do card
interface CardMenuProps {
  patient: PatientRow;
  onEdit: (p: PatientRow) => void;
  onDelete: (p: PatientRow) => void;
}

function CardMenu({ patient, onEdit, onDelete }: CardMenuProps) {
  const [confirm, setConfirm] = useState(false);
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
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setConfirm(false); setOpen((v) => !v); }}
        className="p-1.5 rounded-lg hover:bg-[#E4D5C3]/40 transition-colors text-[#406B5B]/50 hover:text-[#406B5B]"
        aria-label="Opcoes"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 w-52 bg-white rounded-xl shadow-lg border border-[#E4D5C3] py-1 animate-in fade-in zoom-in-95">
          <button
            onClick={() => { setOpen(false); setConfirm(false); onEdit(patient); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#406B5B] hover:bg-[#E4D5C3]/30 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar cadastro
          </button>

          <div className="mx-2 my-1 border-t border-[#E4D5C3]/60" />

          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir paciente
            </button>
          ) : (
            <div className="px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mb-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Confirmar exclusao?
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setOpen(false); setConfirm(false); onDelete(patient); }}
                  className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  className="flex-1 px-2 py-1 text-xs border border-[#E4D5C3] text-[#406B5B] rounded-lg hover:bg-[#E4D5C3]/30 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Card do paciente
interface PatientCardProps {
  patient: PatientRow;
  onEdit: (p: PatientRow) => void;
  onDelete: (p: PatientRow) => void;
  onDetails: (p: PatientRow) => void;
  onProntuario: (p: PatientRow) => void;
}

function PatientCard({ patient, onEdit, onDelete, onDetails, onProntuario }: PatientCardProps) {
  const initials = patient.name
    .split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E4D5C3]/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 bg-[#91AE9E]/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-[#406B5B] font-semibold text-sm">{initials}</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#406B5B] truncate">{patient.name}</h3>
            <p className="text-xs text-[#406B5B]/50">CPF: {formatCPF(patient.cpf)}</p>
          </div>
        </div>
        <CardMenu patient={patient} onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-[#406B5B]/60">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span>{formatPhone(patient.phone)}</span>
        </div>
        {patient.email && (
          <div className="flex items-center gap-2 text-xs text-[#406B5B]/60">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{patient.email}</span>
          </div>
        )}
        {patient.date_of_birth && (
          <div className="flex items-center gap-2 text-xs text-[#406B5B]/60">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              {new Date(patient.date_of_birth).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#E4D5C3]/30">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            patient.is_active
              ? 'bg-[#406B5B]/10 text-[#406B5B]'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {patient.is_active ? 'Ativo' : 'Inativo'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onProntuario(patient)}
            className="p-1.5 rounded-lg hover:bg-[#91AE9E]/10 transition-colors"
            title="Ver prontuario"
          >
            <FileText className="w-4 h-4 text-[#406B5B]/60" />
          </button>
          <button
            onClick={() => onDetails(patient)}
            className="p-1.5 rounded-lg hover:bg-[#91AE9E]/10 transition-colors"
            title="Ver detalhes"
          >
            <Eye className="w-4 h-4 text-[#406B5B]/60" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Page
export default function PacientesPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [patients, setPatients]         = useState<PatientRow[]>([]);
  const [stats, setStats]               = useState<PatientStats>({ total: 0, thisMonth: 0 });
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editPatient, setEditPatient]   = useState<PatientRow | null>(null);
  const [detailPatient, setDetailPatient] = useState<PatientRow | null>(null);
  const [deleting, setDeleting]         = useState(false);

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

  const clearSearch = () => { setSearch(''); loadPatients(''); };
  const handleAfterSave = () => { loadPatients(search); loadStats(); };

  const handleDelete = async (patient: PatientRow) => {
    if (!user?.tenantId || deleting) return;
    setDeleting(true);
    try {
      await deletePatient(patient.id, user.tenantId);
      toast.success('Paciente excluido', { description: `${patient.name} foi removido da base.` });
      loadPatients(search);
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nao foi possivel excluir o paciente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleProntuario = (patient: PatientRow) => {
    router.push(`/prontuario?pacienteId=${patient.id}&nome=${encodeURIComponent(patient.name)}`);
  };

  return (
    <div>
      <Header title="Pacientes" subtitle="Gerencie seus pacientes" />

      <div className="p-8">
        {/* Barra de acoes */}
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
            className="flex items-center gap-2 px-4 py-2.5 bg-[#406B5B] text-white rounded-xl hover:bg-[#406B5B]/90 transition-colors text-sm font-medium shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo Paciente
          </button>
        </div>

        {/* Estatisticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-[#E4D5C3]/50">
            <p className="text-sm text-[#406B5B]/60">Total de Pacientes</p>
            <p className="text-2xl font-bold text-[#406B5B] mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#E4D5C3]/50">
            <p className="text-sm text-[#406B5B]/60">Novos este mes</p>
            <p className="text-2xl font-bold text-[#91AE9E] mt-1">{stats.thisMonth}</p>
          </div>
        </div>

        {/* Lista */}
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
          <>
            {search.trim() && (
              <p className="text-xs text-[#406B5B]/50 mb-4">
                {patients.length} resultado{patients.length !== 1 ? 's' : ''} para &quot;{search}&quot;
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  onEdit={setEditPatient}
                  onDelete={handleDelete}
                  onDetails={setDetailPatient}
                  onProntuario={handleProntuario}
                />
              ))}
            </div>
          </>
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

      <PatientDetailsModal
        open={detailPatient !== null}
        patient={detailPatient}
        onClose={() => setDetailPatient(null)}
        onEdit={(p) => { setDetailPatient(null); setEditPatient(p); }}
      />
    </div>
  );
}
