import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/lib/query-provider';

export const metadata: Metadata = {
  title: 'Vitalle - Medical Concierge Platform',
  description: 'Plataforma completa para gestão de consultórios e clínicas médicas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
