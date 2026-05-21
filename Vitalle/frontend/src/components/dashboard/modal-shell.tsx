'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string; // ex: 'max-w-xl', 'max-w-2xl'
}

/**
 * Modal genérico reutilizado pelos modais do dashboard.
 * Sem dependências externas além de Tailwind + lucide-react.
 */
export function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClass = 'max-w-xl',
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#406B5B]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${widthClass} bg-white rounded-2xl shadow-2xl border border-[#E4D5C3] overflow-hidden animate-in fade-in zoom-in-95`}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#E4D5C3]">
          <div>
            <h2 id="modal-title" className="text-xl font-heading font-semibold text-[#406B5B]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[#406B5B]/60 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#406B5B]/50 hover:text-[#406B5B] hover:bg-[#E4D5C3]/30 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-[#E4D5C3] bg-[#E4D5C3]/10 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
