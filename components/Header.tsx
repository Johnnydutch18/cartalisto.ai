'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUserEmail(session?.user?.email ?? null);

      // Optional: Listen to session changes
      supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email ?? null);
      });
    };

    fetchUser();
  }, []);

  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-semibold text-gray-800 hover:text-black">
          CartaListo
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/planes" className="hover:text-black">Planes</Link>
          <Link href="/arregla-mi-curriculum" className="hover:text-black">Currículum</Link>
          <Link href="/carta-de-presentacion" className="hover:text-black">Carta</Link>
        </nav>

        <div className="text-sm">
          {userEmail ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{userEmail}</span>
              <form action="/api/logout" method="post">
                <button type="submit" className="text-red-500 hover:text-red-700 font-medium">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
