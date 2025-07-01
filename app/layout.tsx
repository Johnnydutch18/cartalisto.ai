// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import { createClient } from '@/utils/supabase/server';
import { Session } from '@supabase/supabase-js';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CartaListo - Optimiza tu CV y Carta de Presentación',
  description: 'Mejora tu currículum y carta con inteligencia artificial.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  }: { data: { session: Session | null } } = await supabase.auth.getSession();

  return (
    <html lang="es">
      <body className={inter.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}
