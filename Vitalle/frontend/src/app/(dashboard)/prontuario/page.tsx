'use client';

import { Header } from '@/components/layout/header';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, Plus, FileText, User, Calendar,
  MoreVertical, Pencil, Trash2, AlertTriangle,
  Loader2, X, Eye,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import {
  listMedicalRecords,
  searchMedicalRecords,
  deleteMedicalRecord,
  MedicalRecordRow,
} from '@/services/medical-records-service';
import { formatCPF } from '@/lib/utils';
import { NovoProntuarioModal }     from '@/components/prontuario/novo-prontuario-modal';
import { EditProntuarioModal }     from '@/components/prontuario/edit-prontuario-modal';
import { ProntuarioDetailModal }  from '@/components/prontuario/prontuario-detail-modal';

// ─── Row menu (editar / excluir) ──────────────────────────────────────────────

interface RowMenuProps {
  record: MedicalRecordRow;
  onEdit:   (r: MedicalRecordRow) => void;
  onDelete: (r: MedicalRecordRow) => void;
}

function RowMenu({ record, onEdit, onDelete }: RowMenuProps) {
  const [open, setOpen]       = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
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
            onClick={() => { setOpen(false); onEdit(record); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#406B5B] hover:bg-[#E4D5C3]/30 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar prontuário
          </button>

          <div className="mx-2 my-1 border-t border-[#E4D5C3]/60" />

          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir prontuário
            </button>
          ) : (
            <div className="px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mb-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Confirmar exclusão?
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setOpen(false); onDelete(record); }}
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

// ─── Card do prontuário ────────────────────────────────────────────────────────

interface RecordCardProps {
  record: MedicalRecordRow;
  onView:   (r: MedicalRecordRow) => void;
  onEdit:   (r: MedicalRecordRow) => void;
  onDelete: (r: MedicalRecordRow) => void;
}

function RecordCard({ record, onView, onEdit, onDelete }: RecordCardProps) {
  const patient = record.patients;
  const date = new Date(record.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div
      onClick={() => onView(record)}
      className="bg-white rounded-2xl p-5 border border-[#E4D5C3]/50 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#91AE9E]/20 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#406B5B]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#406B5B] truncate">
              {patient?.name ?? '—'}
            </h3>
            {patient?.cpf && (
              <p className="text-xs text-[#406B5B]/50">CPF: {formatCPF(patient.cpf)}</p>
            )}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <RowMenu record={record} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      {record.diagnosis && (
        <div className="mb-3">
          <p className="text-xs text-[#406B5B]/50 mb-0.5">Diagnóstico</p>
          <p className="text-sm text-[#406B5B] line-clamp-2">{record.diagnosis}</p>
        </div>
      )}
      {!record.diagnosis && record.chief_complaint && (
        <div className="mb-3">
          <p className="text-xs text-[#406B5B]/50 mb-0.5">Queixa principal</p>
          <p className="text-sm text-[#406B5B] line-clamp-2">{record.chief_complaint}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#E4D5C3]/30">
        <span className="flex items-center gap-1 text-xs text-[#406B5B]/50">
          <Calendar className="w-3.5 h-3.5" /> {date}
        </span>
        <span className="flex items-center gap-1 text-xs text-[#406B5B] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye className="w-3.5 h-3.5" /> Ver completo
        </span>
      </div>
    </div>
  );
}

// ─── Conteúdo principal ────────────────────────────────────────────────────────

function ProntuarioContent() {
  const user          = useAuthStore((s) => s.user);
  const searchParams  = useSearchParams();
  const router        = useRouter();

  const pacienteId = searchParams.get('pacienteId');
  const nomeParam  = searchParams.get('nome') ?? '';

  const [allRecords, setAllRecords]     = useState<MedicalRecordRow[]>([]);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [deleting, setDeleting]         = useState(false);

  const [showNovo, setShowNovo]         = useState(false);
  const [editRecord, setEditRecord]     = useState<MedicalRecordRow | null>(null);
  const [detailRecord, setDetailRecord] = useState<MedicalRecordRow | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pré-preenche busca ao vir da aba Pacientes
  useEffect(() => {
    if (nomeParam) setSearch(nomeParam);
  }, [nomeParam]);

  const load = useCallback(async () => {
    if (!user?.tenantId) return;
    setLoading(true);
    try {
      const data = await listMedicalRecords(user.tenantId);
      // Se veio com pacienteId, filtra só os desse paciente
      setAllRecords(pacienteId ? data.filter((r) => r.patient_id === pacienteId) : data);
    } catch {
      setAllRecords([]);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, pacienteId]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 0); // no-op: filter is computed
  };

  const displayed = search.trim()
    ? searchMedicalRecords(allRecords, search)
    : allRecords;

  const clearContext = () => { setSearch(''); router.replace('/prontuario'); };

  const handleDelete = async (record: MedicalRecordRow) => {
    if (!user?.tenantId || deleting) return;
    setDeleting(true);
    try {
      await deleteMedicalRecord(record.id, user.tenantId);
      toast.success('Prontuário excluído.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir prontuário.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreated = (r: MedicalRecordRow) => {
    setAllRecords((prev) => [r, ...prev]);
  };

  const handleUpdated = (updated: MedicalRecordRow) => {
    setAllRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  return (
    <div>
      <Header
        title="Prontuário"
        subtitle={pacienteId && nomeParam ? `Exibindo prontuários de ${nomeParam}` : 'Registros médicos dos pacientes'}
      />

      <div className="p-8">
        {/* Banner de contexto */}
        {pacienteId && nomeParam && (
          <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-[#406B5B]/8 border border-[#406B5B]/20 rounded-xl">
            <button
              onClick={clearContext}
              className="flex items-center gap-1.5 text-xs text-[#406B5B]/60 hover:text-[#406B5B] transition-colors"
            >
              ← Todos os prontuários
            </button>
            <span className="text-[#406B5B]/30">|</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-[#406B5B]">
              <User className="w-4 h-4" /> {nomeParam}
            </span>
            <button
              onClick={clearContext}
              className="ml-auto text-[#406B5B]/40 hover:text-[#406B5B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
              <button
                onClick={() => { setSearch(''); if (pacienteId) router.replace('/prontuario'); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#406B5B]/40 hover:text-[#406B5B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowNovo(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#406B5B] text-white rounded-xl hover:bg-[#406B5B]/90 transition-colors text-sm font-medium shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Novo Prontuário
          </button>
        </div>

        {/* Contador */}
        {!loading && displayed.length > 0 && (
          <p className="text-xs text-[#406B5B]/50 mb-4">
            {displayed.length} prontuário{displayed.length !== 1 ? 's' : ''}
            {search.trim() ? ` para "${search}"` : ''}
          </p>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#406B5B]/30" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#406B5B]/40 gap-3">
            <FileText className="w-12 h-12" />
            <p className="text-sm">
              {search.trim()
                ? `Nenhum prontuário encontrado para "${search}".`
                : 'Nenhum prontuário cadastrado ainda.'}
            </p>
            {!search.trim() && (
              <button
                onClick={() => setShowNovo(true)}
                className="mt-2 text-xs font-medium text-[#406B5B] underline underline-offset-2 hover:text-[#406B5B]/70 transition-colors"
              >
                Criar primeiro prontuário
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((r) => (
              <RecordCard
                key={r.id}
                record={r}
                onView={setDetailRecord}
                onEdit={setEditRecord}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <NovoProntuarioModal
        open={showNovo}
        onClose={() => setShowNovo(false)}
        onCreated={handleCreated}
      />

      <EditProntuarioModal
        open={editRecord !== null}
        record={editRecord}
        onClose={() => setEditRecord(null)}
        onUpdated={handleUpdated}
      />

      <ProntuarioDetailModal
        open={detailRecord !== null}
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
        onEdit={(r) => { setDetailRecord(null); setEditRecord(r); }}
      />
    </div>
  );
}

export default function ProntuarioPage() {
  return (
    <Suspense fallback={null}>
      <ProntuarioContent />
    </Suspense>
  );
}
