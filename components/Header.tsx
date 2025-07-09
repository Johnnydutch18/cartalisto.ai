"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setSession(null);
    router.refresh();
    router.push("/");
  };

  return (
    <header className="w-full px-4 py-3 border-b">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
        {/* Left: Brand */}
        <Link href="/" className="text-lg font-bold">
          CartaListo
        </Link>

        {/* Center Nav */}
        <nav className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-sm">
          <Link href="/arregla-mi-curriculum" className="hover:underline">
            Currículum
          </Link>
          <Link href="/carta-de-presentacion" className="hover:underline">
            Carta
          </Link>
          <Link href="/planes" className="hover:underline">
            Planes
          </Link>
        </nav>

        {/* Right: Auth */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-sm">
          {session?.user ? (
            <>
              <span className="text-xs sm:text-sm truncate max-w-[150px]">{session.user.email}</span>
              <button onClick={handleLogout} className="text-blue-600 hover:underline">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/login?mode=signin" className="text-blue-600 hover:underline">
                Iniciar sesión
              </Link>
              <Link href="/login?mode=signup" className="text-blue-600 hover:underline">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
