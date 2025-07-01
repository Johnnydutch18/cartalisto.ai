// /components/Header.tsx
import { cookies as getCookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import Link from "next/link";
import AccountMenu from "./AccountMenu";

export default async function Header() {
  const cookieStore = await getCookies();

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value,
    getAll: () =>
      cookieStore.getAll().map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
      })),
    set: (name: string, value: string, options?: CookieOptions) =>
      cookieStore.set({ name, value, ...options }),
    delete: (name: string, options?: CookieOptions) =>
      cookieStore.set({ name, value: "", ...options }),
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex justify-between items-center px-4 py-2 border-b">
      <Link href="/" className="text-lg font-semibold">
        CartaListo
      </Link>
      {user ? (
        <AccountMenu email={user.email ?? "Cuenta"} />
      ) : (
        <Link href="/login" className="text-sm hover:underline">
          Iniciar sesión
        </Link>
      )}
    </header>
  );
}
