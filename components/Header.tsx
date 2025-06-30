// components/Header.tsx
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies as nextCookies } from 'next/headers';

export default async function Header() {
  const cookieStore = await nextCookies();

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () =>
      cookieStore.getAll().map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
      })),
    set: () => {},
    remove: () => {},
  } as const;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b bg-white">
      <Link href="/" className="text-xl font-bold">
        CartaListo
      </Link>

      <nav className="flex items-center gap-4">
        <Link href="/arregla-mi-curriculum">Currículum</Link>
        <Link href="/carta-de-presentacion">Carta</Link>

        {user ? (
          <>
            <span className="text-sm text-gray-700">👋 {user.email}</span>
            <form action="/logout" method="POST">
              <button
                type="submit"
                className="text-red-600 hover:underline text-sm"
              >
                Cerrar sesión
              </button>
            </form>
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
