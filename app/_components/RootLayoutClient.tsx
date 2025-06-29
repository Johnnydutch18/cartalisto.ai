'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    router.refresh(); // refresh UI
  };

  return (
    <>
      <header className="w-full bg-white shadow-sm py-4">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-6">
          <Link href="/" className="text-xl font-bold text-gray-800">
            CartaListo
          </Link>

          <div className="flex gap-4 text-sm text-gray-700">
            <Link href="/arregla-mi-curriculum" className="hover:underline">CV</Link>
            <Link href="/carta-de-presentacion" className="hover:underline">Carta</Link>
            <Link href="/planes" className="hover:underline font-semibold text-blue-600">Planes</Link>

            {!user ? (
              <>
                <Link href="/login" className="hover:underline">Iniciar sesión</Link>
                <Link href="/sign-up" className="hover:underline">Crear cuenta</Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                disabled={loading}
                className="hover:underline text-red-600"
              >
                {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-6">{children}</main>
    </>
  );
}
