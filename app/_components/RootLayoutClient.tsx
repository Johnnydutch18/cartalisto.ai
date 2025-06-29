'use client';

import { SWRConfig } from 'swr';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
import Link from 'next/link';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <SWRConfig value={{}}>
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

        <main className="pt-6">{children}</main>
      </SWRConfig>
    </SessionContextProvider>
  );
}
