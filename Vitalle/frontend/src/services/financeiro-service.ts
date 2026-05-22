import { supabase } from '@/lib/supabase';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BudgetItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export type BudgetStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface BudgetRow {
  id: string;
  tenant_id: string;
  patient_id: string;
  items: BudgetItem[];
  total: number;
  status: BudgetStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type PaymentMethod =
  | 'Dinheiro'
  | 'PIX'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Transferência'
  | 'Outros';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Dinheiro', 'PIX', 'Cartão de Crédito',
  'Cartão de Débito', 'Transferência', 'Outros',
];

export interface PaymentRow {
  id: string;
  tenant_id: string;
  patient_id: string;
  budget_id: string | null;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface FinanceiroSummary {
  valorTotal: number;     // soma de todos os orçamentos não excluídos
  valorAprovado: number;  // soma dos orçamentos aprovados/concluídos
  valorPago: number;      // soma dos pagamentos
  saldoEmAberto: number;  // valorAprovado - valorPago
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function budgetStatusLabel(s: BudgetStatus): string {
  const map: Record<BudgetStatus, string> = {
    pending:   'Pendente',
    approved:  'Aprovado',
    rejected:  'Recusado',
    completed: 'Concluído',
  };
  return map[s] ?? s;
}

export function budgetStatusColor(s: BudgetStatus): string {
  const map: Record<BudgetStatus, string> = {
    pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved:  'bg-[#406B5B]/10 text-[#406B5B] border-[#406B5B]/20',
    rejected:  'bg-red-100 text-red-600 border-red-200',
    completed: 'bg-blue-50 text-blue-600 border-blue-200',
  };
  return map[s] ?? 'bg-[#E4D5C3] text-[#406B5B]';
}

export function calcSummary(budgets: BudgetRow[], payments: PaymentRow[]): FinanceiroSummary {
  const valorTotal    = budgets.reduce((s, b) => s + Number(b.total), 0);
  const valorAprovado = budgets
    .filter((b) => b.status === 'approved' || b.status === 'completed')
    .reduce((s, b) => s + Number(b.total), 0);
  const valorPago     = payments.reduce((s, p) => s + Number(p.amount), 0);
  const saldoEmAberto = Math.max(0, valorAprovado - valorPago);
  return { valorTotal, valorAprovado, valorPago, saldoEmAberto };
}

// ─── CRUD Orçamentos ──────────────────────────────────────────────────────────

export async function listBudgets(tenantId: string, patientId: string): Promise<BudgetRow[]> {
  const { data, error } = await supabase
    .from('patient_budgets')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as BudgetRow[];
}

export async function createBudget(payload: {
  tenantId: string;
  patientId: string;
  items: BudgetItem[];
  notes?: string | null;
}): Promise<BudgetRow> {
  const total = payload.items.reduce((s, i) => s + Number(i.total), 0);
  const { data, error } = await supabase
    .from('patient_budgets')
    .insert({
      tenant_id:  payload.tenantId,
      patient_id: payload.patientId,
      items:      payload.items,
      total,
      notes:      payload.notes || null,
      status:     'pending',
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message || 'Falha ao criar orçamento.');
  return data as BudgetRow;
}

export async function updateBudgetStatus(
  id: string, tenantId: string, status: BudgetStatus,
): Promise<void> {
  const { error } = await supabase
    .from('patient_budgets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id).eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);
}

export async function deleteBudget(id: string, tenantId: string): Promise<void> {
  const { error } = await supabase
    .from('patient_budgets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id).eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);
}

// ─── CRUD Pagamentos ──────────────────────────────────────────────────────────

export async function listPayments(tenantId: string, patientId: string): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from('patient_payments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('paid_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as PaymentRow[];
}

export async function createPayment(payload: {
  tenantId: string;
  patientId: string;
  budgetId?: string | null;
  amount: number;
  method: PaymentMethod;
  paidAt?: string;
  notes?: string | null;
}): Promise<PaymentRow> {
  const { data, error } = await supabase
    .from('patient_payments')
    .insert({
      tenant_id:  payload.tenantId,
      patient_id: payload.patientId,
      budget_id:  payload.budgetId || null,
      amount:     payload.amount,
      method:     payload.method,
      paid_at:    payload.paidAt || new Date().toISOString(),
      notes:      payload.notes || null,
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message || 'Falha ao registrar pagamento.');
  return data as PaymentRow;
}

export async function deletePayment(id: string, tenantId: string): Promise<void> {
  const { error } = await supabase
    .from('patient_payments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id).eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);
}
