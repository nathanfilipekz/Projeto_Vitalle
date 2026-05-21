'use client';

import { ModalShell } from '@/components/dashboard/modal-shell';
import {
  User, CreditCard, Phone, Mail, Calendar,
  MapPin, Heart, Pencil,
} from 'lucide-react';
import { formatCPF, formatPhone } from '@/lib/utils';
import { PatientRow } from '@/services/patients-service';

interface PatientDetailsModalProps {
  open: boolean;
  patient: PatientRow | null;
  onClose: () => void;
  onEdit?: (p: PatientRow) => void;
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#E4D5C3]/40 last:border-0">
      <div className="mt-0.5 text-[#406B5B]/40 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-[#406B5B]/50 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-[#406B5B] break-words">{value}</p>
      </div>
    </div>
  );
}

const GENDER_LABEL: Record<string, string> = { M: 'Masculino', F: 'Feminino', O: 'Outro' };

export function PatientDetailsModal({ open, patient, onClose, onEdit }: PatientDetailsModalProps) {
  if (!patient) return null;

  const initials = patient.name
    .split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const birthDate = patient.date_of_birth
    ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Detalhes do Paciente"
      subtitle="Visualizacao completa do cadastro"
      widthClass="max-w-lg"
      footer={
        onEdit ? (
          <button
            onClick={() => { onClose(); onEdit(patient); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#406B5B] text-white font-semibold hover:bg-[#406B5B]/90 transition-colors text-sm"
          >
            <Pencil className="w-4 h-4" />
            Editar cadastro
          </button>
        ) : undefined
      }
    >
      {/* Avatar + nome + status */}
      <div className="flex items-center gap-4 pb-4 mb-2 border-b border-[#E4D5C3]/50">
        <div className="w-14 h-14 bg-[#91AE9E]/20 rounded-full flex items-center justify-center shrink-0">
          <span className="text-[#406B5B] font-bold text-lg">{initials}</span>
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#406B5B]">{patient.name}</h3>
          <span
            className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              patient.is_active
                ? 'bg-[#406B5B]/10 text-[#406B5B]'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {patient.is_active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Campos */}
      <div>
        <Row icon={<CreditCard className="w-4 h-4" />} label="CPF"            value={formatCPF(patient.cpf)} />
        <Row icon={<Phone className="w-4 h-4" />}      label="Telefone"       value={formatPhone(patient.phone)} />
        <Row icon={<Mail className="w-4 h-4" />}       label="E-mail"         value={patient.email} />
        <Row icon={<Calendar className="w-4 h-4" />}   label="Nascimento"     value={birthDate} />
        <Row icon={<User className="w-4 h-4" />}       label="Sexo"           value={patient.gender ? GENDER_LABEL[patient.gender] ?? patient.gender : null} />
        <Row icon={<MapPin className="w-4 h-4" />}     label="Endereco"       value={patient.address} />
        <Row icon={<Heart className="w-4 h-4" />}      label="Tipo sanguineo" value={patient.blood_type} />
      </div>

      {/* Data de cadastro */}
      <p className="mt-4 text-xs text-[#406B5B]/40 text-right">
        Cadastrado em {new Date(patient.created_at).toLocaleDateString('pt-BR')}
      </p>
    </ModalShell>
  );
}
