'use client';

import { Header } from '@/components/layout/header';
import {
  DollarSign,
  CreditCard,
  FileText,
  TrendingUp,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

const mockPayments = [
  { id: '1', date: '2024-03-01', amount: 397, method: 'PIX', status: 'APPROVED', invoice: true },
  { id: '2', date: '2024-02-01', amount: 397, method: 'PIX', status: 'APPROVED', invoice: true },
  { id: '3', date: '2024-01-01', amount: 397, method: 'CREDIT_CARD', status: 'APPROVED', invoice: true },
  { id: '4', date: '2023-12-01', amount: 397, method: 'PIX', status: 'APPROVED', invoice: true },
];

const paymentStatusIcons: Record<string, typeof CheckCircle2> = {
  APPROVED: CheckCircle2,
  PENDING: Clock,
  DECLINED: AlertCircle,
};

const paymentStatusColors: Record<string, string> = {
  APPROVED: 'text-[#406B5B]',
  PENDING: 'text-[#B89D83]',
  DECLINED: 'text-red-500',
};

export default function FinanceiroPage() {
  return (
    <div>
      <Header title="Financeiro" subtitle="Assinatura e pagamentos" />
      
      <div className="p-8">
        {/* Subscription Card */}
        <div className="bg-[#406B5B] rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -right-5 -bottom-5 w-28 h-28 bg-[#91AE9E]/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium">Plano Atual</p>
                <h2 className="text-3xl font-heading font-bold mt-1">Plus</h2>
                <p className="text-white/60 mt-2">Renovação em 01/04/2024</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm">Valor mensal</p>
                <p className="text-3xl font-bold mt-1">R$ 397</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <span className="px-3 py-1 bg-[#91AE9E]/30 rounded-full text-xs font-medium">
                ATIVO
              </span>
              <span className="text-sm text-white/60">Ciclo: Mensal</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-5 border border-[#E4D5C3]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#406B5B]/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#406B5B]" />
              </div>
              <div>
                <p className="text-xs text-[#406B5B]/60">Total Pago</p>
                <p className="text-xl font-bold text-[#406B5B]">R$ 4.764</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-[#E4D5C3]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#91AE9E]/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#91AE9E]" />
              </div>
              <div>
                <p className="text-xs text-[#406B5B]/60">Notas Fiscais</p>
                <p className="text-xl font-bold text-[#406B5B]">12</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-[#E4D5C3]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#B89D83]/10 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#B89D83]" />
              </div>
              <div>
                <p className="text-xs text-[#406B5B]/60">Método Principal</p>
                <p className="text-xl font-bold text-[#406B5B]">PIX</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl border border-[#E4D5C3]/50 shadow-sm">
          <div className="p-6 border-b border-[#E4D5C3]/50">
            <h2 className="text-lg font-heading font-semibold text-[#406B5B]">
              Histórico de Pagamentos
            </h2>
          </div>
          <div className="divide-y divide-[#E4D5C3]/30">
            {mockPayments.map((payment) => {
              const StatusIcon = paymentStatusIcons[payment.status] || Clock;
              return (
                <div key={payment.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#E4D5C3]/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <StatusIcon className={`w-5 h-5 ${paymentStatusColors[payment.status]}`} />
                    <div>
                      <p className="text-sm font-medium text-[#406B5B]">
                        Assinatura Plus - {payment.method === 'PIX' ? 'PIX' : 'Cartão'}
                      </p>
                      <p className="text-xs text-[#406B5B]/50">
                        {new Date(payment.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-[#406B5B]">
                      R$ {payment.amount.toFixed(2)}
                    </span>
                    {payment.invoice && (
                      <button className="p-2 rounded-lg hover:bg-[#E4D5C3]/30 transition-colors" title="Download NF">
                        <Download className="w-4 h-4 text-[#406B5B]/60" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
