// components/Header.tsx
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Logo / Title */}
        <Link href="/" className="text-xl font-semibold text-gray-800 hover:text-black">
          CartaListo
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/planes" className="hover:text-black">Planes</Link>
          <Link href="/arregla-mi-curriculum" className="hover:text-black">Currículum</Link>
          <Link href="/carta-de-presentacion" className="hover:text-black">Carta</Link>
        </nav>

        {/* Auth */}
        <div className="text-sm">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user.email}</span>
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
