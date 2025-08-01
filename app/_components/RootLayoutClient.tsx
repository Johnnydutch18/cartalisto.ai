// ✅ Updated RootLayoutClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return <RootLayoutContent>{children}</RootLayoutContent>;
}

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null); // You can replace 'any' with your user type later

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      <header className="w-full bg-white shadow-sm py-4">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-6">
          <Link href="/" className="text-xl font-bold text-gray-800">
            CartaListo
          </Link>

          <div className="flex gap-4 text-sm text-gray-700">
            <Link href="/arregla-mi-curriculum" className="hover:underline">Curriculum</Link>
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
