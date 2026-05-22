'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Pencil, Save, ChevronDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  QUESTIONNAIRES,
  AnamneseQuestion,
  AnamneseResponseRow,
  getAnamneseByPatient,
  saveAnamnese,
} from '@/services/anamnese-service';

interface AnamneseTabProps {
  tenantId: string;
  patientId: string;
}

const QUESTIONNAIRE_TYPES = Object.keys(QUESTIONNAIRES);

/** ID usado para armazenar o detalhe do campo condicional */
const detailKey = (id: string) => `${id}_detail`;

function hasRedFlag(q: AnamneseQuestion, answer: string): boolean {
  if (!answer) return false;
  if (q.redFlagWhen === 'sim')    return answer === 'Sim';
  if (q.redFlagWhen === 'filled') return answer.trim().length > 0;
  return false;
}

/** Verifica se todas as perguntas obrigatórias foram respondidas */
function buildMissingIds(
  questions: AnamneseQuestion[],
  answers: Record<string, string>,
): string[] {
  return questions
    .filter((q) => {
      const ans = answers[q.id] ?? '';
      if (!ans) return true; // sem resposta principal
      return false;
    })
    .map((q) => q.id);
}

export function AnamneseTab({ tenantId, patientId }: AnamneseTabProps) {
  const [questionnaireType, setQuestionnaireType] = useState('Geral');
  const [existing, setExisting]     = useState<AnamneseResponseRow | null>(null);
  const [answers, setAnswers]       = useState<Record<string, string>>({});
  const [editing, setEditing]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [missingIds, setMissingIds] = useState<string[]>([]);

  const questions = QUESTIONNAIRES[questionnaireType] ?? [];

  const load = useCallback(async () => {
    setLoading(true);
    setMissingIds([]);
    try {
      const data = await getAnamneseByPatient(tenantId, patientId, questionnaireType);
      setExisting(data);
      setAnswers(data?.responses ?? {});
      setEditing(!data);
    } catch {
      setExisting(null);
      setAnswers({});
      setEditing(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId, patientId, questionnaireType]);

  useEffect(() => { load(); }, [load]);

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      // Se trocou para Não, limpa o detalhe condicional
      if (value === 'Não') delete next[detailKey(id)];
      return next;
    });
    // Remove da lista de faltantes ao responder
    setMissingIds((prev) => prev.filter((x) => x !== id));
  };

  const setDetail = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [detailKey(id)]: value }));

  const handleSave = async () => {
    // Validação: todas as perguntas respondidas
    const missing = buildMissingIds(questions, answers);
    if (missing.length > 0) {
      setMissingIds(missing);
      toast.error('Responda todas as perguntas antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveAnamnese({
        tenantId,
        patientId,
        questionnaireType,
        responses: answers,
        filledBy: 'doctor',
      });
      setExisting(saved);
      setEditing(false);
      setMissingIds([]);
      toast.success('Anamnese salva com sucesso.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar anamnese.');
    } finally {
      setSaving(false);
    }
  };

  const filledAt = existing?.filled_at
    ? new Date(existing.filled_at).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#406B5B]/30" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">

        {/* Dropdown tipo de questionário */}
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E4D5C3] rounded-xl text-sm font-medium text-[#406B5B] hover:bg-[#F7F3EE] transition-colors shadow-sm min-w-[240px] justify-between"
          >
            <span>Selecione o questionário de anamnese</span>
            <ChevronDown className="w-4 h-4 text-[#406B5B]/50 shrink-0" />
          </button>
          {showTypeMenu && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E4D5C3] rounded-xl shadow-lg z-30 overflow-hidden">
              {QUESTIONNAIRE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => { setQuestionnaireType(type); setShowTypeMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    type === questionnaireType
                      ? 'bg-[#406B5B] text-white font-semibold'
                      : 'text-[#406B5B] hover:bg-[#F7F3EE]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Badge + botão */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-[#406B5B]/10 text-[#406B5B] text-sm font-semibold rounded-lg">
            {questionnaireType}
          </span>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#E4D5C3] text-[#406B5B] text-sm font-medium rounded-xl hover:bg-[#F7F3EE] transition-colors shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#406B5B] text-white text-sm font-semibold rounded-xl hover:bg-[#406B5B]/90 transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</>
                : <><Save className="w-3.5 h-3.5" /> Salvar</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Aviso de campos não preenchidos */}
      {missingIds.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Responda todas as perguntas antes de salvar. Os campos destacados estão em aberto.
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white border border-[#E4D5C3] rounded-xl overflow-hidden shadow-sm">

        {/* Cabeçalho */}
        <div className="grid grid-cols-[1fr_220px] bg-[#F7F3EE] border-b border-[#E4D5C3]">
          <div className="px-5 py-3 text-xs font-bold text-[#406B5B] uppercase tracking-wider">
            Pergunta
          </div>
          <div className="px-5 py-3 text-xs font-bold text-[#406B5B] uppercase tracking-wider">
            Resposta
          </div>
        </div>

        {/* Linhas */}
        {questions.map((q, idx) => {
          const answer    = answers[q.id] ?? '';
          const detail    = answers[detailKey(q.id)] ?? '';
          const redFlag   = hasRedFlag(q, answer) || (q.conditionalInput && detail.trim().length > 0 && answer === 'Sim');
          const isMissing = missingIds.includes(q.id);
          const isEven    = idx % 2 === 0;
          const showInput = q.conditionalInput && answer === 'Sim';

          return (
            <div
              key={q.id}
              className={`border-b border-[#E4D5C3]/50 last:border-0 ${
                isMissing
                  ? 'bg-red-50/60'
                  : isEven ? 'bg-white' : 'bg-[#F7F3EE]/40'
              }`}
            >
              <div className="grid grid-cols-[1fr_220px]">
                {/* Pergunta */}
                <div className="px-5 py-3.5 flex items-start gap-2">
                  {redFlag && (
                    <span className="text-base leading-none shrink-0 mt-0.5" title="Atenção">🚩</span>
                  )}
                  {isMissing && !redFlag && (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${isMissing ? 'text-red-600 font-medium' : 'text-[#406B5B]'}`}>
                    {q.label}
                  </span>
                </div>

                {/* Resposta */}
                <div className="px-5 py-3 flex items-center">
                  {q.type === 'sim_nao' ? (
                    editing ? (
                      <div className="flex gap-2">
                        {['Sim', 'Não'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAnswer(q.id, opt)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              answer === opt
                                ? opt === 'Sim'
                                  ? 'bg-green-100 border-green-400 text-green-700'
                                  : 'bg-red-100 border-red-400 text-red-600'
                                : 'bg-white border-[#E4D5C3] text-[#406B5B]/50 hover:border-[#406B5B]/40'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className={`text-sm font-medium ${
                        answer === 'Sim'
                          ? 'text-green-600'
                          : answer === 'Não'
                            ? 'text-red-500'
                            : 'text-[#406B5B]/30 italic'
                      }`}>
                        {answer || '—'}
                      </span>
                    )
                  ) : (
                    /* tipo texto */
                    editing ? (
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder="Descreva..."
                        className="w-full px-3 py-1.5 bg-white border border-[#E4D5C3] rounded-lg text-sm text-[#406B5B] placeholder:text-[#406B5B]/30 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                      />
                    ) : (
                      <span className={`text-sm ${answer ? 'text-[#406B5B]' : 'text-[#406B5B]/30 italic'}`}>
                        {answer || '—'}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Campo condicional (aparece abaixo quando Sim) */}
              {q.conditionalInput && (
                <div className={`px-5 pb-3 transition-all ${showInput ? 'block' : 'hidden'}`}>
                  {editing ? (
                    <input
                      type="text"
                      value={detail}
                      onChange={(e) => setDetail(q.id, e.target.value)}
                      placeholder={q.conditionalPlaceholder ?? 'Descreva...'}
                      className="w-full px-3 py-2 bg-white border border-[#406B5B]/20 rounded-lg text-sm text-[#406B5B] placeholder:text-[#406B5B]/30 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                    />
                  ) : detail ? (
                    <p className="text-sm text-[#406B5B]/70 italic pl-1">↳ {detail}</p>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé */}
      {filledAt && (
        <p className="text-xs text-[#406B5B]/40 text-center pt-1">
          Preenchido pelo profissional em {filledAt}
        </p>
      )}
    </div>
  );
}
