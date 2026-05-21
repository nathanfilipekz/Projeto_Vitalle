'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ModalShell } from './modal-shell';
import { Calendar, Clock, User, FileText, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import {
  createAppointment,
  resolveDoctorId,
  type AppointmentRow,
} from '@/services/appointments-service';

interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (appointment: AppointmentRow) => void;
  /** Pré-seleciona uma data (yyyy-MM-dd) quando aberto a partir da agenda. */
  defaultDate?: string;
}

export interface AppointmentFormData {
  patient: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  notes?: string;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewAppointmentModal({ open, onClose, onCreated, defaultDate }: NewAppointmentModalProps) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<AppointmentFormData>({
    patient: '',
    date: defaultDate || todayIsoDate(),
    time: '08:00',
    duration: 30,
    type: 'Retorno',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof AppointmentFormData>(field: K, value: AppointmentFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.patient.trim() || form.patient.trim().length < 3) {
      e.patient = 'Informe o nome do paciente (mín. 3 caracteres).';
    }
    if (!form.date) e.date = 'Selecione a data.';
    if (!form.time) e.time = 'Selecione o horário.';
    if (form.duration <= 0) e.duration = 'Duração inválida.';
    if (!form.type.trim()) e.type = 'Informe o tipo da consulta.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!user?.tenantId) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    setSubmitting(true);
    try {
      const doctorId = await resolveDoctorId(user.tenantId);
      const dateTimeIso = new Date(`${form.date}T${form.time}:00`).toISOString();

      const created = await createAppointment({
        tenantId: user.tenantId,
        doctorId,
        patientName: form.patient,
        dateTimeIso,
        duration: form.duration,
        type: form.type,
        notes: form.notes,
      });

      toast.success('Consulta criada com sucesso', {
        description: `${form.patient} - ${form.date} às ${form.time}`,
      });
      onCreated?.(created);
      setForm({
        patient: '',
        date: defaultDate || todayIsoDate(),
        time: '08:00',
        duration: 30,
        type: 'Retorno',
        notes: '',
      });
      onClose();
    } catch (err) {
      toast.error('Não foi possível criar a consulta', {
        description: err instanceof Error ? err.message : 'Erro desconhecido.',
      });
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
      title="Nova Consulta"
      subtitle="Agende uma nova consulta no calendário"
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
            form="new-appointment-form"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#406B5B] text-white font-semibold hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Criar consulta'}
          </button>
        </>
      }
    >
      <form id="new-appointment-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Paciente</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input
              type="text"
              value={form.patient}
              onChange={(e) => update('patient', e.target.value)}
              placeholder="Maria Silva Santos"
              className={inputClass}
              autoFocus
            />
          </div>
          {errors.patient && <p className="text-xs text-red-500 mt-1">{errors.patient}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Data</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                className={inputClass}
              />
            </div>
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className={labelClass}>Horário</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="time"
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
                className={inputClass}
              />
            </div>
            {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
          </div>
          <div>
            <label className={labelClass}>Duração (min)</label>
            <input
              type="number"
              min={5}
              step={5}
              value={form.duration}
              onChange={(e) => update('duration', Number(e.target.value))}
              className="px-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
            />
            {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Tipo</label>
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value)}
            className="px-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
          >
            <option>Primeira Consulta</option>
            <option>Retorno</option>
            <option>Procedimento</option>
            <option>Exames</option>
            <option>Rotina</option>
            <option>Urgência</option>
          </select>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
        </div>

        <div>
          <label className={labelClass}>Observações</label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 w-4 h-4 text-[#406B5B]/40" />
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Observações internas (opcional)"
              className="pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 resize-none"
            />
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
