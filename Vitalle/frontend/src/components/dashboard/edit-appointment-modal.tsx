'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Calendar, Clock, User, FileText, Loader2 } from 'lucide-react';
import { ModalShell } from './modal-shell';
import { useAuthStore } from '@/store/auth-store';
import {
  resolveDoctorId,
  updateAppointment,
  type AppointmentRow,
  type AppointmentStatus,
} from '@/services/appointments-service';

interface EditAppointmentModalProps {
  open: boolean;
  appointment: AppointmentRow | null;
  onClose: () => void;
  onUpdated?: (apt: AppointmentRow) => void;
}

const statusOptions: { value: AppointmentStatus; label: string; color: string }[] = [
  { value: 'SCHEDULED', label: 'Agendado', color: 'bg-[#91AE9E]' },
  { value: 'CONFIRMED', label: 'Confirmado', color: 'bg-[#406B5B]' },
  { value: 'RESCHEDULED', label: 'Reagendado', color: 'bg-[#B89D83]' },
  { value: 'COMPLETED', label: 'Concluído', color: 'bg-gray-400' },
  { value: 'NO_SHOW', label: 'Faltou', color: 'bg-gray-300' },
  { value: 'CANCELED', label: 'Cancelado', color: 'bg-red-400' },
];

export function EditAppointmentModal({ open, appointment, onClose, onUpdated }: EditAppointmentModalProps) {
  const user = useAuthStore((s) => s.user);
  const [submitting, setSubmitting] = useState(false);
  const [patient, setPatient] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState('Retorno');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('SCHEDULED');

  useEffect(() => {
    if (!appointment) return;
    setPatient(appointment.patients?.name || '');
    const dt = new Date(appointment.date_time);
    setDate(dt.toISOString().slice(0, 10));
    setTime(dt.toTimeString().slice(0, 5));
    setDuration(appointment.duration);
    setType(appointment.type || 'Retorno');
    setNotes(appointment.notes || '');
    setStatus(appointment.status);
  }, [appointment]);

  if (!appointment) return null;

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!user?.tenantId) {
      toast.error('Sessão expirada.');
      return;
    }
    setSubmitting(true);
    try {
      const doctorId = await resolveDoctorId(user.tenantId);
      const dateTimeIso = new Date(`${date}T${time}:00`).toISOString();
      const updated = await updateAppointment({
        id: appointment.id,
        tenantId: user.tenantId,
        doctorId,
        patientName: patient,
        dateTimeIso,
        duration,
        type,
        notes,
        status,
      });
      toast.success('Consulta atualizada.');
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar.');
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = 'block text-sm font-medium text-[#406B5B] mb-1.5';
  const inputClass =
    'pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20';

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Editar consulta"
      subtitle="Atualize os dados ou mude o status do agendamento."
      widthClass="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-[#E4D5C3] text-[#406B5B] font-medium hover:bg-[#E4D5C3]/30 disabled:opacity-50"
          >
            Fechar
          </button>
          <button
            type="submit"
            form="edit-appointment-form"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#406B5B] text-white font-semibold hover:bg-[#406B5B]/90 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </>
      }
    >
      <form id="edit-appointment-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Status</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  status === opt.value
                    ? `${opt.color} text-white border-transparent`
                    : 'border-[#E4D5C3] text-[#406B5B] hover:bg-[#E4D5C3]/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Paciente</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input
              type="text"
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Data</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Horário</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Duração (min)</label>
            <input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="px-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
          >
            <option>Primeira Consulta</option>
            <option>Retorno</option>
            <option>Procedimento</option>
            <option>Exames</option>
            <option>Rotina</option>
            <option>Urgência</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Observações</label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 w-4 h-4 text-[#406B5B]/40" />
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="pl-11 pr-4 py-3 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 resize-none"
            />
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
