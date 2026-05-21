'use client';

import { Header } from '@/components/layout/header';
import { useState } from 'react';
import {
  Search,
  Plus,
  TrendingUp,
  Calendar,
  Image,
  ChevronRight,
  User,
} from 'lucide-react';

const mockEvolutions = [
  { id: '1', patient: 'Maria Silva Santos', date: '2024-03-18', title: 'Sessão 12 - Acompanhamento', description: 'Paciente relata melhora significativa dos sintomas. PA: 130/85.', hasImages: true },
  { id: '2', patient: 'João Pedro Oliveira', date: '2024-03-17', title: 'Sessão 5 - Avaliação', description: 'Exames laboratoriais dentro da normalidade. Manter tratamento.', hasImages: false },
  { id: '3', patient: 'Ana Carolina Ferreira', date: '2024-03-15', title: 'Sessão 8 - Retorno', description: 'Melhora do quadro de ansiedade. Redução de medicação.', hasImages: false },
  { id: '4', patient: 'Carlos Eduardo Lima', date: '2024-03-14', title: 'Sessão 3 - Fisioterapia', description: 'Evolução positiva com exercícios de fortalecimento lombar.', hasImages: true },
];

export default function EvolucaoPage() {
  const [search, setSearch] = useState('');

  return (
    <div>
      <Header title="Evolução Clínica" subtitle="Acompanhe a evolução dos pacientes" />
      
      <div className="p-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
            <input
              type="text"
              placeholder="Buscar evolução por paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#406B5B] text-white rounded-xl hover:bg-[#406B5B]/90 transition-colors text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" />
            Nova Evolução
          </button>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#91AE9E]/30" />
          
          <div className="space-y-6">
            {mockEvolutions.map((evolution, i) => (
              <div key={evolution.id} className="relative flex gap-6 group">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 w-12 h-12 bg-white border-2 border-[#91AE9E] rounded-full flex items-center justify-center group-hover:border-[#406B5B] transition-colors">
                  <TrendingUp className="w-5 h-5 text-[#406B5B]" />
                </div>
                
                {/* Content */}
                <div className="flex-1 bg-white rounded-2xl p-6 border border-[#E4D5C3]/50 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#406B5B]">{evolution.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-[#406B5B]/60">
                          <User className="w-3 h-3" />
                          {evolution.patient}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#406B5B]/60">
                          <Calendar className="w-3 h-3" />
                          {new Date(evolution.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {evolution.hasImages && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-[#B89D83]/10 rounded-lg text-xs text-[#B89D83]">
                          <Image className="w-3 h-3" />
                          Imagens
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-[#406B5B]/30 group-hover:text-[#406B5B] transition-colors" />
                    </div>
                  </div>
                  <p className="text-sm text-[#406B5B]/70 leading-relaxed">{evolution.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
