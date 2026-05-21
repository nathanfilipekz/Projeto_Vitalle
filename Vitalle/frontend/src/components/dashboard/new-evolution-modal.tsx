'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ModalShell } from './modal-shell';
import { User, FileText, ClipboardList, Loader2 } from 'lucide-react';

interface NewEvolutionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (data: EvolutionFormData) => void;
}

export interface EvolutionFormData {
  patient: string;
  title: string;
  description: string;
  observations?: string;
}

const initialState: EvolutionFormData = {
  patient: '',
  title: '',
  description: '',
  observations: '',
};

export function NewEvolutionModal({ open, onClose, onCreated }: NewEvolutionModalProps) {
  const [form, setForm] = useState<EvolutionFormData>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof EvolutionFormData>(field: K, value: EvolutionFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.patient.trim() || form.patient.trim().length < 3) {
      e.patient = 'Informe o paciente (mín. 3 caracteres).';
    }
    if (!form.title.trim() || form.title.trim().length < 3) {
      e.title = 'Título obrigatório (mín. 3 caracteres).';
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      e.description = 'Descreva a evolução com pelo menos 10 caracteres.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      // TODO: substituir por:
      // await api.post('/api/v1/evolutions', { patientId, title, description, observations });
      await new Promise((r) => setTimeout(r, 600));

      if (typeof window !== 'undefined') {
        const prev = JSON.parse(localStorage.getItem('vitalle_mock_evolutions') || '[]');
        prev.unshift({
          ...form,
          id: `local-${Date.now()}`,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('vitalle_mock_evolutions', JSON.stringify(prev.slice(0, 100)));
      }

      toast.success('Evolução registrada', {
        description: `${form.title} - ${form.patient}`,
      });
      onCreated?.(form);
      setForm(initialState);
      onClose();
    } catch {
      toast.error('Não foi possível registrar a evolução');
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
      title="Nova Evolução"
      subtitle="Registre uma evolução clínica do paciente"
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
            form="new-evolution-form"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#406B5B] text-white font-semibold hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Registrar evolução'}
          </button>
        </>
      }
    >
      <form id="new-evolution-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Paciente</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input
              type="text"
              value={form.patient}
              onChange={(e) => update('patient', e.target.value)}
              placeholder="Nome do paciente"
              className={inputClass}
              autoFocus
            />
          </div>
          {errors.patient && <p className="text-xs text-red-500 mt-1">{errors.patient}</p>}
        </div>

        <div>
          <label className={labelClass}>Título</label>
          <div className="relative">
            <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Ex.: Sessão 12 - Acompanhamento"
              className={inputClass}
            />
          </div>
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className={labelClass}>Descrição clínica</label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 w-4 h-4 text-[#406B5B]/40" />
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Descreva a evolução do paciente, achados clínicos, conduta..."
              className="pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 resize-none"
            />
          </div>
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className={labelClass}>Observações</label>
          <textarea
            rows={3}
            value={form.observations}
            onChange={(e) => update('observations', e.target.value)}
            placeholder="Observações adicionais (opcional)"
            className="px-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 resize-none"
          />
        </div>

        <p className="text-xs text-[#406B5B]/50 italic">
          Backend ainda não conectado. A evolução é salva apenas no navegador (mock) até a Fase 2 (módulo Evolution) do plano de finalização.
        </p>
      </form>
    </ModalShell>
  );
}
