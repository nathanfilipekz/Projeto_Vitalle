'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, ShieldAlert, Copy } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import {
  beginMfaSetup,
  confirmAndEnableMfa,
  disableMfa,
  getMfaStatus,
  type MfaSetup,
} from '@/services/mfa-service';
import { qrImageUrl } from '@/lib/totp';

export function MfaSetupCard() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getMfaStatus(user.id)
      .then((s) => setEnabled(s.enabled))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Falha ao checar MFA.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleBegin = () => {
    if (!user?.email) return;
    setSetup(beginMfaSetup(user.email));
    setCode('');
  };

  const handleConfirm = async () => {
    if (!user?.id || !setup) return;
    setSubmitting(true);
    try {
      await confirmAndEnableMfa(user.id, setup.secret, code);
      setEnabled(true);
      setSetup(null);
      setCode('');
      toast.success('Autenticação em dois fatores ativada.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao ativar MFA.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await disableMfa(user.id, disableCode);
      setEnabled(false);
      setDisableCode('');
      setShowDisable(false);
      toast.success('MFA desativado.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desativar MFA.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#406B5B]/60">
        <Loader2 className="w-4 h-4 animate-spin" /> Verificando status do MFA...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E4D5C3]/50 p-6 space-y-4">
      <div className="flex items-center gap-3">
        {enabled ? (
          <ShieldCheck className="w-6 h-6 text-[#406B5B]" />
        ) : (
          <ShieldAlert className="w-6 h-6 text-[#B89D83]" />
        )}
        <div>
          <h3 className="font-semibold text-[#406B5B]">Autenticação em dois fatores (TOTP)</h3>
          <p className="text-sm text-[#406B5B]/60">
            {enabled
              ? 'O MFA está ativo. Você precisará do código do autenticador a cada login.'
              : 'Aumente a segurança da sua conta exigindo um código de 6 dígitos a cada login.'}
          </p>
        </div>
      </div>

      {!enabled && !setup && (
        <button
          onClick={handleBegin}
          className="px-4 py-2.5 bg-[#406B5B] text-white rounded-xl text-sm font-semibold hover:bg-[#406B5B]/90"
        >
          Ativar MFA
        </button>
      )}

      {!enabled && setup && (
        <div className="space-y-4 border-t border-[#E4D5C3]/40 pt-4">
          <ol className="text-sm text-[#406B5B] space-y-1 list-decimal pl-5">
            <li>
              Abra um app autenticador (Google Authenticator, Authy, Microsoft Authenticator,
              1Password).
            </li>
            <li>Escaneie o QR Code abaixo ou insira o segredo manualmente.</li>
            <li>Digite o código de 6 dígitos exibido pelo app para confirmar.</li>
          </ol>
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl(setup.otpauthUri)}
              alt="QR Code MFA"
              className="rounded-xl border border-[#E4D5C3]"
              width={220}
              height={220}
            />
            <div className="flex-1 space-y-3 w-full">
              <div>
                <p className="text-xs text-[#406B5B]/60 mb-1">Segredo (base32)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all bg-[#E4D5C3]/20 px-3 py-2 rounded-lg text-xs text-[#406B5B] font-mono">
                    {setup.secret}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(setup.secret);
                      toast.success('Segredo copiado.');
                    }}
                    className="p-2 rounded-lg border border-[#E4D5C3] text-[#406B5B] hover:bg-[#E4D5C3]/30"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#406B5B]/60 mb-1 block">Código de confirmação</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.4em] text-xl font-mono px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={submitting || code.length !== 6}
                  className="px-4 py-2.5 bg-[#406B5B] text-white rounded-xl text-sm font-semibold hover:bg-[#406B5B]/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar e ativar
                </button>
                <button
                  onClick={() => setSetup(null)}
                  className="px-4 py-2.5 border border-[#E4D5C3] text-[#406B5B] rounded-xl text-sm hover:bg-[#E4D5C3]/30"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {enabled && (
        <div className="space-y-3">
          {!showDisable ? (
            <button
              onClick={() => setShowDisable(true)}
              className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50"
            >
              Desativar MFA
            </button>
          ) : (
            <div className="space-y-2 border-t border-[#E4D5C3]/40 pt-3">
              <p className="text-sm text-[#406B5B]">
                Confirme com o código atual do seu autenticador para desativar.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full md:w-48 text-center tracking-[0.4em] text-xl font-mono px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDisable}
                  disabled={submitting || disableCode.length !== 6}
                  className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Desativar
                </button>
                <button
                  onClick={() => {
                    setShowDisable(false);
                    setDisableCode('');
                  }}
                  className="px-4 py-2.5 border border-[#E4D5C3] text-[#406B5B] rounded-xl text-sm hover:bg-[#E4D5C3]/30"
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
