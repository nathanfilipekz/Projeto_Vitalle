'use client';

import { Header } from '@/components/layout/header';
import { useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  CheckCheck,
  Clock,
  AlertCircle,
  Bot,
  Users,
  Calendar,
  Settings,
  Zap,
} from 'lucide-react';

type Tab = 'conversas' | 'automacoes' | 'campanhas' | 'configuracoes';

const mockConversations = [
  { id: '1', patient: 'Maria Silva', phone: '11987654321', lastMessage: 'Ok, confirmado!', time: '14:32', unread: 0, status: 'read' },
  { id: '2', patient: 'João Santos', phone: '11976543210', lastMessage: 'Gostaria de remarcar', time: '13:15', unread: 1, status: 'delivered' },
  { id: '3', patient: 'Ana Oliveira', phone: '11965432109', lastMessage: 'Qual o horário disponível?', time: '11:45', unread: 2, status: 'delivered' },
  { id: '4', patient: 'Carlos Mendes', phone: '11954321098', lastMessage: '1', time: '10:20', unread: 0, status: 'read' },
  { id: '5', patient: 'Lucia Ferreira', phone: '11943210987', lastMessage: 'Obrigada pela confirmação', time: 'Ontem', unread: 0, status: 'read' },
  { id: '6', patient: 'Pedro Costa', phone: '11932109876', lastMessage: '2', time: 'Ontem', unread: 0, status: 'read' },
];

const mockMessages = [
  { id: '1', direction: 'outbound', body: 'Olá Maria.\n\nSeu atendimento será amanhã às 09:00.\n\nResponda:\n1 = Confirmar\n2 = Cancelar', time: '14:30', status: 'read' },
  { id: '2', direction: 'inbound', body: '1', time: '14:31', status: 'read' },
  { id: '3', direction: 'outbound', body: 'Consulta confirmada! Até amanhã às 09:00. ✓', time: '14:31', status: 'read' },
  { id: '4', direction: 'inbound', body: 'Ok, confirmado!', time: '14:32', status: 'read' },
];

const automations = [
  { id: '1', name: 'Lembrete D+1', description: 'Envia lembrete 24h antes da consulta', trigger: 'Automático - 18h do dia anterior', status: 'active', sent: 342 },
  { id: '2', name: 'Confirmação de Agendamento', description: 'Confirma quando paciente responde "1"', trigger: 'Resposta do paciente', status: 'active', sent: 289 },
  { id: '3', name: 'Cancelamento Automático', description: 'Cancela consulta quando paciente responde "2"', trigger: 'Resposta do paciente', status: 'active', sent: 45 },
  { id: '4', name: 'Reagendamento', description: 'Sugere novo horário após cancelamento', trigger: 'Após cancelamento', status: 'active', sent: 38 },
  { id: '5', name: 'Recuperação 90 dias', description: 'Contata pacientes inativos há 90+ dias', trigger: 'Cron semanal', status: 'paused', sent: 67 },
  { id: '6', name: 'Aniversariante', description: 'Mensagem de felicitações no aniversário', trigger: 'Diário - 08h', status: 'active', sent: 124 },
];

const statusIcon = {
  read: <CheckCheck className="w-3.5 h-3.5 text-[#406B5B]" />,
  delivered: <CheckCheck className="w-3.5 h-3.5 text-[#406B5B]/40" />,
  sent: <Clock className="w-3.5 h-3.5 text-[#406B5B]/40" />,
  failed: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
};

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<Tab>('conversas');
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const tabs = [
    { id: 'conversas' as Tab, label: 'Conversas', icon: MessageSquare },
    { id: 'automacoes' as Tab, label: 'Automações', icon: Bot },
    { id: 'campanhas' as Tab, label: 'Campanhas', icon: Users },
    { id: 'configuracoes' as Tab, label: 'Config', icon: Settings },
  ];

  return (
    <div>
      <Header title="WhatsApp Business" subtitle="Comunicação integrada com pacientes" />

      <div className="p-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 bg-white rounded-xl border border-[#E4D5C3] p-1.5 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#406B5B] text-white'
                  : 'text-[#406B5B]/60 hover:text-[#406B5B] hover:bg-[#E4D5C3]/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conversas Tab */}
        {activeTab === 'conversas' && (
          <div className="grid grid-cols-12 gap-0 bg-white rounded-2xl border border-[#E4D5C3]/50 shadow-sm overflow-hidden h-[600px]">
            {/* Conversation list */}
            <div className="col-span-4 border-r border-[#E4D5C3]/50 flex flex-col">
              <div className="p-4 border-b border-[#E4D5C3]/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#406B5B]/40" />
                  <input
                    type="text"
                    placeholder="Buscar conversa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full bg-[#E4D5C3]/20 border-0 rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {mockConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#E4D5C3]/10 transition-colors border-b border-[#E4D5C3]/20 ${
                      selectedConversation.id === conv.id ? 'bg-[#91AE9E]/10' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-[#91AE9E]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#406B5B] font-semibold text-sm">
                        {conv.patient.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-[#406B5B] truncate">{conv.patient}</h4>
                        <span className="text-xs text-[#406B5B]/50">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-[#406B5B]/50 truncate flex items-center gap-1">
                          {conv.status && statusIcon[conv.status as keyof typeof statusIcon]}
                          {conv.lastMessage}
                        </p>
                        {conv.unread > 0 && (
                          <span className="w-5 h-5 bg-[#406B5B] rounded-full text-white text-xs flex items-center justify-center flex-shrink-0">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div className="col-span-8 flex flex-col">
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-[#E4D5C3]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#91AE9E]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#406B5B] font-semibold text-sm">
                      {selectedConversation.patient.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#406B5B]">{selectedConversation.patient}</h3>
                    <p className="text-xs text-[#406B5B]/50 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedConversation.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-[#E4D5C3]/30 transition-colors" title="Ver paciente">
                    <Users className="w-4 h-4 text-[#406B5B]/60" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-[#E4D5C3]/30 transition-colors" title="Ver agenda">
                    <Calendar className="w-4 h-4 text-[#406B5B]/60" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#E4D5C3]/5">
                {mockMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                      msg.direction === 'outbound'
                        ? 'bg-[#406B5B] text-white rounded-br-md'
                        : 'bg-white border border-[#E4D5C3] text-[#406B5B] rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{msg.body}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        msg.direction === 'outbound' ? 'text-white/60' : 'text-[#406B5B]/40'
                      }`}>
                        <span className="text-[10px]">{msg.time}</span>
                        {msg.direction === 'outbound' && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-[#E4D5C3]/30">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Digite uma mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#E4D5C3]/20 border-0 rounded-xl text-sm text-[#406B5B] placeholder:text-[#406B5B]/40 focus:outline-none focus:ring-2 focus:ring-[#406B5B]/20"
                  />
                  <button className="p-3 bg-[#406B5B] text-white rounded-xl hover:bg-[#406B5B]/90 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Automações Tab */}
        {activeTab === 'automacoes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#406B5B]/60">Gerencie automações de mensagens para seus pacientes</p>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#406B5B] text-white rounded-xl hover:bg-[#406B5B]/90 transition-colors text-sm font-medium">
                <Zap className="w-4 h-4" />
                Nova Automação
              </button>
            </div>

            <div className="grid gap-4">
              {automations.map((auto) => (
                <div key={auto.id} className="bg-white rounded-2xl p-6 border border-[#E4D5C3]/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        auto.status === 'active' ? 'bg-[#91AE9E]/20' : 'bg-[#E4D5C3]/30'
                      }`}>
                        <Bot className={`w-5 h-5 ${auto.status === 'active' ? 'text-[#406B5B]' : 'text-[#406B5B]/40'}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[#406B5B]">{auto.name}</h3>
                        <p className="text-sm text-[#406B5B]/60 mt-0.5">{auto.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-[#406B5B]/40 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {auto.trigger}
                          </span>
                          <span className="text-xs text-[#406B5B]/40">
                            {auto.sent} enviadas
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        auto.status === 'active'
                          ? 'bg-[#91AE9E]/20 text-[#406B5B]'
                          : 'bg-[#E4D5C3] text-[#406B5B]/60'
                      }`}>
                        {auto.status === 'active' ? 'Ativo' : 'Pausado'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={auto.status === 'active'} className="sr-only peer" />
                        <div className="w-10 h-5 bg-[#E4D5C3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#406B5B]" />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campanhas Tab */}
        {activeTab === 'campanhas' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-[#406B5B]/60">Envie mensagens em massa para grupos de pacientes</p>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#406B5B] text-white rounded-xl hover:bg-[#406B5B]/90 transition-colors text-sm font-medium">
                <Send className="w-4 h-4" />
                Nova Campanha
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-5 border border-[#E4D5C3]/50">
                <p className="text-xs text-[#406B5B]/60">Total Enviadas</p>
                <p className="text-2xl font-bold text-[#406B5B] mt-1">1.247</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-[#E4D5C3]/50">
                <p className="text-xs text-[#406B5B]/60">Taxa de Leitura</p>
                <p className="text-2xl font-bold text-[#91AE9E] mt-1">89%</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-[#E4D5C3]/50">
                <p className="text-xs text-[#406B5B]/60">Respostas</p>
                <p className="text-2xl font-bold text-[#B89D83] mt-1">234</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E4D5C3]/50 shadow-sm">
              <div className="p-6 border-b border-[#E4D5C3]/30">
                <h2 className="text-lg font-heading font-semibold text-[#406B5B]">Campanhas Recentes</h2>
              </div>
              <div className="divide-y divide-[#E4D5C3]/30">
                {[
                  { name: 'Lembrete Check-up Anual', sent: 85, read: 72, date: '15/03/2024', status: 'completed' },
                  { name: 'Campanha Vacinação', sent: 120, read: 98, date: '10/03/2024', status: 'completed' },
                  { name: 'Reativação Inativos 90 dias', sent: 45, read: 32, date: '05/03/2024', status: 'completed' },
                ].map((campaign, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-[#E4D5C3]/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#91AE9E]/10 rounded-xl flex items-center justify-center">
                        <Send className="w-4 h-4 text-[#406B5B]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#406B5B]">{campaign.name}</p>
                        <p className="text-xs text-[#406B5B]/50">{campaign.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#406B5B]">{campaign.sent} enviadas</p>
                        <p className="text-xs text-[#91AE9E]">{campaign.read} lidas ({Math.round(campaign.read/campaign.sent*100)}%)</p>
                      </div>
                      <span className="px-3 py-1 bg-[#91AE9E]/20 text-[#406B5B] rounded-full text-xs font-medium">
                        Concluída
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Configurações Tab */}
        {activeTab === 'configuracoes' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl p-8 border border-[#E4D5C3]/50 shadow-sm">
              <h2 className="text-xl font-heading font-bold text-[#406B5B] mb-6">
                Configurações WhatsApp Business
              </h2>

              <div className="space-y-6">
                {/* Connection Status */}
                <div className="p-4 bg-[#91AE9E]/10 rounded-xl border border-[#91AE9E]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-[#406B5B] rounded-full animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-[#406B5B]">Conectado</p>
                        <p className="text-xs text-[#406B5B]/50">WhatsApp Business Cloud API - Meta</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-[#406B5B] text-white rounded-lg text-xs font-medium">
                      API Oficial
                    </span>
                  </div>
                </div>

                {/* Settings fields */}
                <div>
                  <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Phone Number ID</label>
                  <input
                    type="text"
                    defaultValue="••••••••••1234"
                    disabled
                    className="w-full px-4 py-3 bg-[#E4D5C3]/20 border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B]/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Business Account ID</label>
                  <input
                    type="text"
                    defaultValue="••••••••••5678"
                    disabled
                    className="w-full px-4 py-3 bg-[#E4D5C3]/20 border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B]/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#406B5B] mb-1.5">Webhook URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      defaultValue="https://api.vitalle.com.br/api/v1/whatsapp/webhook"
                      readOnly
                      className="flex-1 px-4 py-3 bg-[#E4D5C3]/20 border border-[#E4D5C3] rounded-xl text-sm text-[#406B5B]/60"
                    />
                    <button className="px-4 py-3 bg-[#406B5B] text-white rounded-xl text-sm font-medium hover:bg-[#406B5B]/90 transition-colors">
                      Copiar
                    </button>
                  </div>
                </div>

                {/* Message Templates */}
                <div className="pt-4 border-t border-[#E4D5C3]/30">
                  <h3 className="text-base font-semibold text-[#406B5B] mb-4">Templates de Mensagem</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'appointment_reminder', status: 'APPROVED' },
                      { name: 'appointment_confirmation', status: 'APPROVED' },
                      { name: 'appointment_cancellation', status: 'APPROVED' },
                      { name: 'patient_reactivation', status: 'PENDING' },
                    ].map((template, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <span className="text-sm text-[#406B5B] font-mono">{template.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          template.status === 'APPROVED'
                            ? 'bg-[#91AE9E]/20 text-[#406B5B]'
                            : 'bg-[#B89D83]/20 text-[#B89D83]'
                        }`}>
                          {template.status === 'APPROVED' ? 'Aprovado' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
