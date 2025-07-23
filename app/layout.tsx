// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CartaListo',
  description: 'Optimiza tu CV y cartas con IA en español.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-gray-800 font-sans`}>
        <Header />
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
