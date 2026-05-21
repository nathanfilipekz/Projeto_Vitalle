export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#E4D5C3] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#406B5B] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#406B5B] via-[#406B5B] to-[#91AE9E]/30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-heading text-lg font-bold">V</span>
            </div>
            <span className="font-heading text-2xl text-white font-semibold tracking-wide">
              VITALLE
            </span>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-heading font-bold text-white leading-tight mb-4">
            Transforme a gestão<br />do seu consultório
          </h2>
          <p className="text-white/70 text-lg max-w-md leading-relaxed">
            Agenda inteligente, prontuário digital e WhatsApp integrado. 
            Tudo em uma plataforma elegante e segura.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-white/50 text-sm">Medical Concierge Platform</p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#91AE9E]/10 rounded-full" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#B89D83]/10 rounded-full" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
