'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Package, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { fetchTopProcedures, type TopProcedurePoint } from '@/services/dashboard-service';

// Paleta da marca em gradiente, do escuro pro claro
const colors = [
  '#406B5B',
  '#4C7868',
  '#598577',
  '#669387',
  '#76A192',
  '#86AE9E',
  '#96BBAA',
  '#A6C7B6',
  '#B6D3C2',
  '#C6DFCE',
];

export function TopProductsChart() {
  const tenantId = useAuthStore((s) => s.user?.tenantId);
  const [data, setData] = useState<TopProcedurePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTopProcedures(tenantId)
      .then((rows) => {
        if (!cancelled) setData(rows);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Falha ao carregar TOP 10.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const totalVendas = useMemo(() => data.reduce((acc, d) => acc + d.vendas, 0), [data]);

  return (
    <div className="bg-white rounded-2xl border border-[#E4D5C3]/50 shadow-sm">
      <div className="p-6 border-b border-[#E4D5C3]/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-semibold text-[#406B5B] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#B89D83]" />
            TOP 10 produtos mais vendidos
          </h2>
          <p className="text-xs text-[#406B5B]/50 mt-1">
            Ranking do mês · tipos de consulta com mais agendamentos ativos
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#406B5B]/50">Vendas no top 10</p>
          <p className="text-xl font-bold text-[#406B5B]">{totalVendas}</p>
          <p className="text-[10px] text-[#91AE9E] font-medium mt-0.5">unidades</p>
        </div>
      </div>
      <div className="p-4 h-96">
        {error ? (
          <div className="h-full flex items-center justify-center text-sm text-red-600">{error}</div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center text-[#406B5B]/60 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-[#406B5B]/50">
            Sem consultas concluídas / agendadas neste mês.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            >
              <CartesianGrid stroke="#E4D5C3" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                stroke="#406B5B"
                tick={{ fontSize: 11, fill: '#406B5B' }}
                tickLine={false}
                axisLine={{ stroke: '#E4D5C3' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#406B5B"
                tick={{ fontSize: 11, fill: '#406B5B' }}
                tickLine={false}
                axisLine={{ stroke: '#E4D5C3' }}
                width={170}
              />
              <Tooltip
                cursor={{ fill: 'rgba(228, 213, 195, 0.25)' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E4D5C3',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#406B5B', fontWeight: 600 }}
                formatter={(value: number) => [`${value} vendas`, 'Quantidade']}
              />
              <Bar dataKey="vendas" radius={[0, 8, 8, 0]}>
                {data.map((_, idx) => (
                  <Cell key={idx} fill={colors[idx % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
