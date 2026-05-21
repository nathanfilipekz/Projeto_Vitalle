import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#E4D5C3]">
      {/* Header */}
      <header className="border-b border-[#B89D83]/30 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#406B5B] rounded-full flex items-center justify-center">
                <span className="text-white font-heading text-lg font-bold">V</span>
              </div>
              <span className="font-heading text-2xl text-[#406B5B] font-semibold tracking-wide">
                VITALLE
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#406B5B] hover:text-[#91AE9E] transition-colors font-medium">
                Funcionalidades
              </a>
              <a href="#plans" className="text-[#406B5B] hover:text-[#91AE9E] transition-colors font-medium">
                Planos
              </a>
              <a href="#contact" className="text-[#406B5B] hover:text-[#91AE9E] transition-colors font-medium">
                Contato
              </a>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-[#406B5B] text-white rounded-lg hover:bg-[#406B5B]/90 transition-colors font-medium"
              >
                Entrar
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-[#406B5B] mb-6 leading-tight">
              Gestão médica
              <span className="block text-[#B89D83]">simplificada e elegante</span>
            </h1>
            <p className="text-lg md:text-xl text-[#406B5B]/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Plataforma completa para médicos e clínicas. Agenda inteligente, prontuário digital, 
              WhatsApp integrado e muito mais.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-[#406B5B] text-white rounded-xl hover:bg-[#406B5B]/90 transition-all font-semibold text-lg shadow-lg shadow-[#406B5B]/20 hover:shadow-xl"
              >
                Começar Gratuitamente
              </Link>
              <a
                href="#features"
                className="px-8 py-4 border-2 border-[#406B5B] text-[#406B5B] rounded-xl hover:bg-[#406B5B]/5 transition-all font-semibold text-lg"
              >
                Conhecer Recursos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#406B5B] mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-[#406B5B]/60 text-lg max-w-2xl mx-auto">
              Uma plataforma completa para transformar a gestão do seu consultório
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Agenda Inteligente', desc: 'Calendário com confirmação automática, bloqueios e reagendamento por WhatsApp.' },
              { title: 'Prontuário Digital', desc: 'Prontuário completo com anamnese, evolução clínica e upload de imagens.' },
              { title: 'WhatsApp Integrado', desc: 'Lembretes automáticos, confirmação e cancelamento direto pelo WhatsApp.' },
              { title: 'Gestão de Pacientes', desc: 'Cadastro completo, histórico clínico, timeline de atendimentos.' },
              { title: 'Financeiro', desc: 'Cobranças automáticas, PIX, cartão, emissão de nota fiscal.' },
              { title: 'Multi-clínica', desc: 'Gerencie múltiplas unidades com isolamento total de dados.' },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl border border-[#E4D5C3] hover:border-[#91AE9E] transition-all hover:shadow-lg group">
                <div className="w-12 h-12 bg-[#91AE9E]/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#91AE9E]/30 transition-colors">
                  <div className="w-5 h-5 bg-[#406B5B] rounded-full" />
                </div>
                <h3 className="text-xl font-semibold text-[#406B5B] mb-3">{feature.title}</h3>
                <p className="text-[#406B5B]/60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-20 bg-[#E4D5C3]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#406B5B] mb-4">
              Planos
            </h2>
            <p className="text-[#406B5B]/60 text-lg">Escolha o plano ideal para seu consultório</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard */}
            <div className="bg-white rounded-2xl p-8 border border-[#E4D5C3] shadow-sm">
              <h3 className="text-2xl font-heading font-bold text-[#406B5B] mb-2">Standard</h3>
              <p className="text-[#406B5B]/60 mb-6">Para médicos independentes</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-[#406B5B]">R$ 197</span>
                <span className="text-[#406B5B]/60">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Agenda completa', 'Gestão de pacientes', 'Prontuário digital', 'Anamnese', 'Lembretes automáticos', 'Evolução clínica', 'Lista de aniversariantes'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#406B5B]">
                    <div className="w-5 h-5 bg-[#91AE9E] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=standard" className="block w-full text-center py-3.5 border-2 border-[#406B5B] text-[#406B5B] rounded-xl font-semibold hover:bg-[#406B5B] hover:text-white transition-all">
                Começar Agora
              </Link>
            </div>

            {/* Plus */}
            <div className="bg-[#406B5B] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-[#B89D83] text-white text-xs font-semibold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <h3 className="text-2xl font-heading font-bold mb-2">Plus</h3>
              <p className="text-white/70 mb-6">Para clínicas em crescimento</p>
              <div className="mb-8">
                <span className="text-4xl font-bold">R$ 397</span>
                <span className="text-white/70">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Tudo do Standard', 'WhatsApp Business integrado', 'Automações inteligentes', 'Reagendamento automático', 'Cancelamento automático', 'Campanhas WhatsApp', 'Recuperação pacientes 90 dias'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-[#91AE9E] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=plus" className="block w-full text-center py-3.5 bg-white text-[#406B5B] rounded-xl font-semibold hover:bg-white/90 transition-all">
                Escolher Plus
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#406B5B] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-heading text-sm font-bold">V</span>
              </div>
              <span className="font-heading text-xl tracking-wide">VITALLE</span>
            </div>
            <p className="text-white/60 text-sm">
              &copy; 2024 Vitalle. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
