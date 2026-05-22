import { supabase } from '@/lib/supabase';

// ─── Questionnaires definition ────────────────────────────────────────────────

export type AnswerType = 'sim_nao' | 'texto';

export interface AnamneseQuestion {
  id: string;
  label: string;
  type: AnswerType;
  redFlagWhen?: 'sim' | 'filled'; // 'sim' = flag when answer is 'Sim'; 'filled' = flag when non-empty
  /** Se true, exibe campo de texto extra quando resposta = 'Sim' */
  conditionalInput?: boolean;
  /** Placeholder do campo condicional */
  conditionalPlaceholder?: string;
}

export const GERAL_QUESTIONS: AnamneseQuestion[] = [
  { id: 'pregnant',      label: 'Está grávida ou suspeita de gravidez?',  type: 'sim_nao', redFlagWhen: 'sim'    },
  { id: 'hypertension',  label: 'Tem pressão alta?',                       type: 'sim_nao', redFlagWhen: 'sim'    },
  { id: 'diabetes',      label: 'Tem diabetes?',                           type: 'sim_nao', redFlagWhen: 'sim'    },
  { id: 'heart',         label: 'Tem problema cardíaco?',                  type: 'sim_nao', redFlagWhen: 'sim'    },
  { id: 'coagulation',   label: 'Tem problema de coagulação sanguínea?',   type: 'sim_nao', redFlagWhen: 'sim'    },
  { id: 'renal',         label: 'Tem problema renal?',                     type: 'sim_nao', redFlagWhen: 'sim'    },
  { id: 'hepatic',       label: 'Tem problema hepático (fígado)?',         type: 'sim_nao', redFlagWhen: 'sim'    },
  {
    id: 'autoimmune',
    label: 'Tem doença autoimune?',
    type: 'sim_nao',
    redFlagWhen: 'sim',
    conditionalInput: true,
    conditionalPlaceholder: 'Qual doença autoimune?',
  },
  {
    id: 'medications',
    label: 'Faz uso de algum medicamento?',
    type: 'sim_nao',
    redFlagWhen: 'sim',
    conditionalInput: true,
    conditionalPlaceholder: 'Quais medicamentos e posologia?',
  },
  {
    id: 'allergies',
    label: 'Tem alguma alergia?',
    type: 'sim_nao',
    redFlagWhen: 'sim',
    conditionalInput: true,
    conditionalPlaceholder: 'Qual alergia e quando foi identificada?',
  },
  {
    id: 'surgery',
    label: 'Já realizou cirurgia?',
    type: 'sim_nao',
    redFlagWhen: 'sim',
    conditionalInput: true,
    conditionalPlaceholder: 'Qual a cirurgia?',
  },
  { id: 'keloid',        label: 'Tem histórico de queloides?',  type: 'sim_nao', redFlagWhen: 'sim'    },
  { id: 'needle_phobia', label: 'Tem fobia de agulhas?',        type: 'sim_nao', redFlagWhen: 'sim'    },
  { id: 'herpes',        label: 'Tem herpes labial?',           type: 'sim_nao', redFlagWhen: 'sim'    },
];

export const QUESTIONNAIRES: Record<string, AnamneseQuestion[]> = {
  Geral: GERAL_QUESTIONS,
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AnamneseResponseRow {
  id: string;
  tenant_id: string;
  patient_id: string;
  questionnaire_type: string;
  responses: Record<string, string>;
  filled_at: string;
  filled_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SaveAnamnesePayload {
  tenantId: string;
  patientId: string;
  questionnaireType: string;
  responses: Record<string, string>;
  filledBy?: string;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getAnamneseByPatient(
  tenantId: string,
  patientId: string,
  questionnaireType = 'Geral',
): Promise<AnamneseResponseRow | null> {
  const { data, error } = await supabase
    .from('anamnese_responses')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('patient_id', patientId)
    .eq('questionnaire_type', questionnaireType)
    .is('deleted_at', null)
    .order('filled_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AnamneseResponseRow | null;
}

export async function saveAnamnese(
  payload: SaveAnamnesePayload,
): Promise<AnamneseResponseRow> {
  const existing = await getAnamneseByPatient(
    payload.tenantId,
    payload.patientId,
    payload.questionnaireType,
  );

  if (existing) {
    const { data, error } = await supabase
      .from('anamnese_responses')
      .update({
        responses:  payload.responses,
        filled_at:  new Date().toISOString(),
        filled_by:  payload.filledBy ?? 'doctor',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('tenant_id', payload.tenantId)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Falha ao atualizar anamnese.');
    return data as AnamneseResponseRow;
  }

  const { data, error } = await supabase
    .from('anamnese_responses')
    .insert({
      tenant_id:          payload.tenantId,
      patient_id:         payload.patientId,
      questionnaire_type: payload.questionnaireType,
      responses:          payload.responses,
      filled_at:          new Date().toISOString(),
      filled_by:          payload.filledBy ?? 'doctor',
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message || 'Falha ao salvar anamnese.');
  return data as AnamneseResponseRow;
}
