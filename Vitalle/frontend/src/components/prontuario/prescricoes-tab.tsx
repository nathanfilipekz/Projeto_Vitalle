'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Plus, Trash2, FileText, Printer,
  X, PlusCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { resolveDoctorId } from '@/services/medical-records-service';
import {
  listPrescriptionsByPatient,
  createPrescription,
  deletePrescription,
  PrescriptionRow,
  MedicationItem,
  PrescriptionDoctor,
} from '@/services/prescriptions-service';
import { ModalShell } from '@/components/dashboard/modal-shell';

// ─── helpers ──────────────────────────────────────────────────────────────────

const EMPTY_MED: MedicationItem = { name: '', dosage: '', frequency: '', duration: '' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── Modal Nova Receita ───────────────────────────────────────────────────────

interface NovaReceitaModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (r: PrescriptionRow) => void;
  tenantId: string;
  patientId: string;
  patientName: string;
  doctor: PrescriptionDoctor | null;
  doctorId: string | null;
}

function NovaReceitaModal({
  open, onClose, onCreated,
  tenantId, patientId, patientName,
  doctor, doctorId,
}: NovaReceitaModalProps) {
  const [meds, setMeds]           = useState<MedicationItem[]>([{ ...EMPTY_MED }]);
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setMeds([{ ...EMPTY_MED }]); setInstructions(''); setNotes(''); };
  const handleClose = () => { reset(); onClose(); };

  const updateMed = (idx: number, field: keyof MedicationItem, value: string) =>
    setMeds((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));

  const addMed    = () => setMeds((prev) => [...prev, { ...EMPTY_MED }]);
  const removeMed = (idx: number) => setMeds((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) { toast.error('Médico não encontrado. Verifique o cadastro.'); return; }
    const validMeds = meds.filter((m) => m.name.trim());
    if (validMeds.length === 0) { toast.error('Adicione ao menos um medicamento.'); return; }

    setSubmitting(true);
    try {
      const record = await createPrescription({
        tenantId, patientId, doctorId,
        medications: validMeds,
        instructions: instructions || null,
        notes: notes || null,
      });
      toast.success('Receita criada com sucesso.');
      onCreated(record);
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar receita.');
    } finally {
      setSubmitting(false);
    }
  };

  const doctorName = doctor?.users?.name ?? '—';
  const crm        = doctor?.crm        ?? '—';
  const specialty  = doctor?.specialty  ?? '';

  const inputClass = 'w-full px-3 py-2 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20';
  const labelClass = 'block text-xs font-medium text-[#406B5B]/70 mb-1';

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Nova Receita"
      subtitle="Preencha os medicamentos e orientações"
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
            form="nova-receita-form"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#406B5B] text-white font-semibold hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Salvar receita'}
          </button>
        </>
      }
    >
      <form id="nova-receita-form" onSubmit={handleSubmit} className="space-y-5">

        {/* Cabeçalho do médico — somente leitura */}
        <div className="bg-[#F7F3EE] border border-[#E4D5C3] rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-[#406B5B]/50 uppercase tracking-wide mb-2">Médico responsável</p>
          <p className="text-sm font-bold text-[#406B5B]">{doctorName}</p>
          <p className="text-xs text-[#406B5B]/60">CRM: {crm}{specialty ? ` · ${specialty}` : ''}</p>
        </div>

        {/* Paciente */}
        <div className="bg-[#F7F3EE] border border-[#E4D5C3] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#406B5B]/50 uppercase tracking-wide mb-1">Paciente</p>
          <p className="text-sm font-semibold text-[#406B5B]">{patientName}</p>
        </div>

        {/* Medicamentos */}
        <div>
          <p className="text-xs font-semibold text-[#406B5B] uppercase tracking-wide mb-3">
            Medicamentos
          </p>
          <div className="space-y-3">
            {meds.map((med, idx) => (
              <div key={idx} className="border border-[#E4D5C3] rounded-xl p-4 bg-white relative">
                {meds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMed(idx)}
                    className="absolute top-3 right-3 text-[#406B5B]/30 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <p className="text-xs font-semibold text-[#406B5B]/50 mb-3">
                  Medicamento {idx + 1}
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className={labelClass}>Nome do medicamento *</label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => updateMed(idx, 'name', e.target.value)}
                      placeholder="Ex: Amoxicilina 500mg"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Posologia</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMed(idx, 'dosage', e.target.value)}
                        placeholder="Ex: 1 comprimido"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Frequência</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMed(idx, 'frequency', e.target.value)}
                        placeholder="Ex: 8/8h"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Duração</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMed(idx, 'duration', e.target.value)}
                        placeholder="Ex: 7 dias"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMed}
            className="mt-3 flex items-center gap-1.5 text-sm text-[#406B5B] font-medium hover:text-[#406B5B]/70 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Adicionar medicamento
          </button>
        </div>

        {/* Orientações */}
        <div>
          <label className={labelClass}>Orientações ao paciente</label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Ex: Tomar após as refeições, evitar exposição solar..."
            className={inputClass + ' resize-none'}
          />
        </div>

        {/* Observações internas */}
        <div>
          <label className={labelClass}>Observações internas (não impressas)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas internas sobre esta receita..."
            className={inputClass + ' resize-none'}
          />
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Card de receita (histórico) ─────────────────────────────────────────────

function PrescriptionCard({
  prescription, onDelete,
}: {
  prescription: PrescriptionRow;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const doctor     = prescription.doctors;
  const doctorName = doctor?.users?.name ?? 'Profissional';
  const crm        = doctor?.crm        ?? '';
  const specialty  = doctor?.specialty  ?? '';
  const initials   = doctorName.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <div className="border border-[#E4D5C3] rounded-xl overflow-hidden shadow-sm bg-white mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#F7F3EE] border-b border-[#E4D5C3]">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-[#406B5B]/50" />
          <span className="text-sm font-semibold text-[#406B5B]">
            Receita · {formatDate(prescription.created_at)}
          </span>
          <span className="text-xs text-[#406B5B]/40">
            {prescription.medications.length} medicamento{prescription.medications.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="text-xs text-[#406B5B]/50 hover:text-[#406B5B] transition-colors flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
          {!confirmDel ? (
            <button
              onClick={() => setConfirmDel(true)}
              className="text-xs text-red-400 hover:text-red-500 transition-colors"
            >
              Excluir
            </button>
          ) : (
            <span className="flex items-center gap-1.5">
              <button
                onClick={() => onDelete(prescription.id)}
                className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className="text-xs text-[#406B5B]/50 hover:text-[#406B5B]"
              >
                Cancelar
              </button>
            </span>
          )}
          <button onClick={() => setExpanded((v) => !v)}>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-[#406B5B]/40" />
              : <ChevronDown className="w-4 h-4 text-[#406B5B]/40" />}
          </button>
        </div>
      </div>

      {/* Doctor info */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E4D5C3]/60 bg-white">
        <div className="w-8 h-8 rounded-full bg-[#91AE9E]/20 flex items-center justify-center text-[#406B5B] font-semibold text-xs shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#406B5B]">{doctorName}</p>
          <p className="text-xs text-[#406B5B]/50">
            {crm && `CRM: ${crm}`}{specialty ? ` · ${specialty}` : ''}
          </p>
        </div>
      </div>

      {/* Medications list (sempre visível) */}
      <div className="px-5 py-4">
        <p className="text-xs font-bold text-[#406B5B] uppercase tracking-widest mb-3">Medicamentos</p>
        <div className="space-y-3">
          {prescription.medications.map((med, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <span className="text-xs font-bold text-[#406B5B]/40 mt-0.5 w-5 shrink-0">{idx + 1}.</span>
              <div>
                <p className="text-sm font-semibold text-[#406B5B]">{med.name}</p>
                <p className="text-xs text-[#406B5B]/60">
                  {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expandido: orientações e notas */}
      {expanded && (prescription.instructions || prescription.notes) && (
        <div className="px-5 pb-4 space-y-3 border-t border-[#E4D5C3]/50 pt-4">
          {prescription.instructions && (
            <div>
              <p className="text-xs font-bold text-[#406B5B] uppercase tracking-widest mb-1">Orientações</p>
              <p className="text-sm text-[#406B5B]/80 whitespace-pre-line">{prescription.instructions}</p>
            </div>
          )}
          {prescription.notes && (
            <div>
              <p className="text-xs font-bold text-[#406B5B]/40 uppercase tracking-widest mb-1">Obs. internas</p>
              <p className="text-sm text-[#406B5B]/60 italic">{prescription.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab principal ────────────────────────────────────────────────────────────

interface PrescricoesTabProps {
  tenantId: string;
  patientId: string;
  patientName: string;
}

export function PrescricoesTab({ tenantId, patientId, patientName }: PrescricoesTabProps) {
  const user = useAuthStore((s) => s.user);

  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [doctor, setDoctor]               = useState<PrescriptionDoctor | null>(null);
  const [doctorId, setDoctorId]           = useState<string | null>(null);

  // Carrega médico logado
  useEffect(() => {
    if (!user?.tenantId || !user?.id) return;
    resolveDoctorId(user.tenantId, user.id).then(async (id) => {
      if (!id) return;
      setDoctorId(id);
      const { data } = await supabase
        .from('doctors')
        .select('id, crm, specialty, users ( name, email )')
        .eq('id', id)
        .single();
      if (data) setDoctor(data as PrescriptionDoctor);
    });
  }, [user?.tenantId, user?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPrescriptions(await listPrescriptionsByPatient(tenantId, patientId)); }
    catch   { setPrescriptions([]); }
    finally { setLoading(false); }
  }, [tenantId, patientId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await deletePrescription(id, tenantId);
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
      toast.success('Receita excluída.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-[#406B5B]">
          {prescriptions.length > 0
            ? `${prescriptions.length} receita${prescriptions.length !== 1 ? 's' : ''} registrada${prescriptions.length !== 1 ? 's' : ''}`
            : 'Nenhuma receita registrada'}
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#406B5B] text-white text-sm font-semibold rounded-xl hover:bg-[#406B5B]/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nova Receita
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#406B5B]/30" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#406B5B]/30 gap-3">
          <FileText className="w-12 h-12" />
          <p className="text-sm">Nenhuma receita emitida para este paciente.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 text-xs text-[#406B5B] underline underline-offset-2 hover:text-[#406B5B]/70 font-medium"
          >
            Emitir primeira receita
          </button>
        </div>
      ) : (
        <div>
          {prescriptions.map((p) => (
            <PrescriptionCard key={p.id} prescription={p} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modal */}
      <NovaReceitaModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(r) => setPrescriptions((prev) => [r, ...prev])}
        tenantId={tenantId}
        patientId={patientId}
        patientName={patientName}
        doctor={doctor}
        doctorId={doctorId}
      />
    </div>
  );
}
