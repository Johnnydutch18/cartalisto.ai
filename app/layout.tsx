import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Next.js SaaS Starter',
  description: 'Get started quickly with Next.js, Postgres, and Stripe.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            fallback: {
              '/api/user': getUser(),
              '/api/team': getTeamForUser()
            }
          }}
        >
          {/* ✅ Header Nav */}
          <header className="w-full bg-white shadow-sm py-4">
            <nav className="max-w-7xl mx-auto flex justify-between items-center px-6">
              <Link href="/" className="text-xl font-bold text-gray-800">
                CartaListo
              </Link>
              <div className="flex gap-4 text-sm text-gray-700">
                <Link href="/arregla-mi-curriculum" className="hover:underline">CV</Link>
                <Link href="/carta-de-presentacion" className="hover:underline">Carta</Link>
                <Link href="/planes" className="hover:underline font-semibold text-blue-600">Planes</Link>
              </div>
            </nav>
          </header>

          {/* ✅ Page Content */}
          <main className="pt-6">{children}</main>
        </SWRConfig>
      </body>
    </html>
  );
}
