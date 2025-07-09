// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CartaListo - Optimiza tu CV y Carta de Presentación',
  description: 'Mejora tu currículum y carta con inteligencia artificial.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className} suppressHydrationWarning={true}>
        <Header /> {/* ✅ Client-side Header, so auth state updates */}
        {children}
      </body>
    </html>
  );
}
