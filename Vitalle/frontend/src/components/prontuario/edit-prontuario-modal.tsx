'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ModalShell } from '@/components/dashboard/modal-shell';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import {
  updateMedicalRecord,
  MedicalRecordRow,
  UpdateMedicalRecordPayload,
} from '@/services/medical-records-service';

interface EditProntuarioModalProps {
  open: boolean;
  record: MedicalRecordRow | null;
  onClose: () => void;
  onUpdated?: (record: MedicalRecordRow) => void;
}

type FormState = Required<UpdateMedicalRecordPayload>;

const EMPTY: FormState = {
  chiefComplaint: '',
  historyPresentIllness: '',
  pastMedicalHistory: '',
  familyHistory: '',
  diagnosis: '',
  assessment: '',
  plan: '',
  prescription: '',
};

export function EditProntuarioModal({ open, record, onClose, onUpdated }: EditProntuarioModalProps) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm]         = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({
        chiefComplaint:        record.chief_complaint        ?? '',
        historyPresentIllness: record.history_present_illness ?? '',
        pastMedicalHistory:    record.past_medical_history    ?? '',
        familyHistory:         record.family_history          ?? '',
        diagnosis:             record.diagnosis               ?? '',
        assessment:            record.assessment              ?? '',
        plan:                  record.plan                   ?? '',
        prescription:          record.prescription            ?? '',
      });
    }
  }, [record]);

  if (!record) return null;

  const update = <K extends keyof FormState>(k: K, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setSubmitting(true);
    try {
      const updated = await updateMedicalRecord(record.id, user.tenantId, form);
      toast.success('Prontuário atualizado com sucesso.');
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar prontuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = 'block text-xs font-medium text-[#406B5B]/70 mb-1';
  const inputClass = 'w-full px-3 py-2 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 resize-none';

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Editar Prontuário"
      subtitle={`Paciente: ${record.patients?.name ?? '—'}`}
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
            form="edit-prontuario-form"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#406B5B] text-white font-semibold hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </>
      }
    >
      <form id="edit-prontuario-form" onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className={labelClass}>Queixa principal</label>
          <textarea rows={2} value={form.chiefComplaint}
            onChange={(e) => update('chiefComplaint', e.target.value)}
            placeholder="Motivo principal da consulta..." className={inputClass} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>História da doença atual</label>
            <textarea rows={3} value={form.historyPresentIllness}
              onChange={(e) => update('historyPresentIllness', e.target.value)}
              placeholder="Evolução e características dos sintomas..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Antecedentes pessoais</label>
            <textarea rows={3} value={form.pastMedicalHistory}
              onChange={(e) => update('pastMedicalHistory', e.target.value)}
              placeholder="Doenças anteriores, cirurgias, alergias..." className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Histórico familiar</label>
            <textarea rows={2} value={form.familyHistory}
              onChange={(e) => update('familyHistory', e.target.value)}
              placeholder="Doenças na família..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Diagnóstico</label>
            <textarea rows={2} value={form.diagnosis}
              onChange={(e) => update('diagnosis', e.target.value)}
              placeholder="CID ou descrição diagnóstica..." className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Avaliação / Exame físico</label>
          <textarea rows={2} value={form.assessment}
            onChange={(e) => update('assessment', e.target.value)}
            placeholder="Achados do exame físico e avaliação clínica..." className={inputClass} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Plano terapêutico</label>
            <textarea rows={3} value={form.plan}
              onChange={(e) => update('plan', e.target.value)}
              placeholder="Condutas, exames solicitados..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Prescrição</label>
            <textarea rows={3} value={form.prescription}
              onChange={(e) => update('prescription', e.target.value)}
              placeholder="Medicamentos, posologia, duração..." className={inputClass} />
          </div>
        </div>

      </form>
    </ModalShell>
  );
}
