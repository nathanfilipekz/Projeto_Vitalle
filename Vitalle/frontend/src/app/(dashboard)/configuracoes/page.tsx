'use client';

import { Header } from '@/components/layout/header';
import { useState } from 'react';
import {
  User,
  Building2,
  Bell,
  Shield,
  Save,
} from 'lucide-react';
import { MfaSetupCard } from '@/components/dashboard/mfa-setup';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('perfil');

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'clinica', label: 'Clínica', icon: Building2 },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
  ];

  return (
    <div>
      <Header title="Configurações" subtitle="Gerencie sua conta e preferências" />
      
      <div className="p-8">
        <div className="flex gap-8">
          {/* Sidebar tabs */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-[#E4D5C3]/50 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#406B5B] text-white'
                      : 'text-[#406B5B]/60 hover:bg-[#E4D5C3]/20 hover:text-[#406B5B]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'perfil' && (
              <div className="bg-white rounded-2xl p-8 border border-[#E4D5C3]/50">
                <h2 className="text-xl font-heading font-bold text-[#406B5B] mb-6">
                  Informações Pessoais
                </h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Nome</label>
                      <input
                        type="text"
                        defaultValue="Dr. Roberto Silva"
                        className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#406B5B] mb-1.5">CRM</label>
                      <input
                        type="text"
                        defaultValue="CRM/SP 123456"
                        className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#406B5B] mb-1.5">E-mail</label>
                    <input
                      type="email"
                      defaultValue="dr.roberto@vitalle.com"
                      className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Especialidade</label>
                    <input
                      type="text"
                      defaultValue="Clínico Geral"
                      className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Bio</label>
                    <textarea
                      rows={3}
                      defaultValue="Médico com 15 anos de experiência em clínica geral."
                      className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20 resize-none"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-[#406B5B] text-white rounded-xl font-medium hover:bg-[#406B5B]/90 transition-colors">
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'clinica' && (
              <div className="bg-white rounded-2xl p-8 border border-[#E4D5C3]/50">
                <h2 className="text-xl font-heading font-bold text-[#406B5B] mb-6">
                  Dados da Clínica
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Nome da Clínica</label>
                    <input
                      type="text"
                      defaultValue="Clínica Vitalle Saúde"
                      className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#406B5B] mb-1.5">CNPJ</label>
                    <input
                      type="text"
                      defaultValue="12.345.678/0001-90"
                      className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Telefone</label>
                      <input
                        type="tel"
                        defaultValue="(11) 3456-7890"
                        className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#406B5B] mb-1.5">E-mail</label>
                      <input
                        type="email"
                        defaultValue="contato@clinicavitalle.com"
                        className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                      />
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-[#406B5B] text-white rounded-xl font-medium hover:bg-[#406B5B]/90 transition-colors">
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notificacoes' && (
              <div className="bg-white rounded-2xl p-8 border border-[#E4D5C3]/50">
                <h2 className="text-xl font-heading font-bold text-[#406B5B] mb-6">
                  Preferências de Notificação
                </h2>
                <div className="space-y-6">
                  {[
                    { title: 'Novas consultas agendadas', desc: 'Receber notificação quando um paciente agendar' },
                    { title: 'Cancelamentos', desc: 'Receber notificação quando uma consulta for cancelada' },
                    { title: 'Lembretes diários', desc: 'Resumo das consultas do dia seguinte' },
                    { title: 'Pagamentos recebidos', desc: 'Notificação de novos pagamentos' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-[#E4D5C3]/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-[#406B5B]">{item.title}</p>
                        <p className="text-xs text-[#406B5B]/50 mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-[#E4D5C3] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#406B5B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#406B5B]" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div className="space-y-6">
                <MfaSetupCard />
                <div className="bg-white rounded-2xl p-8 border border-[#E4D5C3]/50">
                  <h3 className="text-sm font-semibold text-[#406B5B] mb-4">Alterar Senha</h3>
                  <div className="space-y-3">
                    <input type="password" placeholder="Senha atual" className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20" />
                    <input type="password" placeholder="Nova senha" className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20" />
                    <input type="password" placeholder="Confirmar nova senha" className="w-full px-4 py-3 bg-white border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20" />
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#406B5B] text-white rounded-xl font-medium hover:bg-[#406B5B]/90 transition-colors">
                      Atualizar Senha
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
