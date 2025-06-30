'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUserEmail(session?.user?.email ?? null);
    };

    getSession();
  }, []);

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b bg-white">
      <Link href="/" className="text-xl font-bold">
        CartaListo
      </Link>

      <nav className="flex items-center gap-4">
        <Link href="/arregla-mi-curriculum">Currículum</Link>
        <Link href="/carta-de-presentacion">Carta</Link>

        {userEmail ? (
          <>
            <span className="text-sm text-gray-700">👋 {userEmail}</span>
            <a
              href="/api/logout"
              className="text-sm text-red-600 hover:underline"
            >
              Cerrar sesión
            </a>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm text-blue-600">
              Iniciar sesión
            </Link>
            <Link href="/signup" className="text-sm text-blue-600">
              Crear cuenta
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
