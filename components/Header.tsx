import Link from 'next/link';
import { cookies as nextCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export default async function Header() {
  const cookieStore = await nextCookies();

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value,
    getAll: () =>
      cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
    set: () => {},
    remove: () => {},
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
