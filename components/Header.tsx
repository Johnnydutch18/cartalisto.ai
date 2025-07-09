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
    setSession(null);            // clear local state
    router.refresh();            // refresh layout to clear session
    router.push("/");            // redirect home
  };

  return (
    <header className="w-full p-4 flex justify-between items-center border-b">
      {/* Left: Brand title */}
      <div className="w-1/3">
        <Link href="/" className="text-lg font-bold">CartaListo</Link>
      </div>

      {/* Center navigation menu */}
      <nav className="flex justify-center gap-6 w-1/3 text-sm">
        <Link href="/arregla-mi-curriculum" className="hover:underline">Currículum</Link>
        <Link href="/carta-de-presentacion" className="hover:underline">Carta</Link>
        <Link href="/planes" className="hover:underline">Planes</Link>
      </nav>

      {/* Right: Login/Logout */}
      <div className="w-1/3 flex justify-end items-center gap-4 text-sm">
        {session?.user ? (
          <>
            <span>{session.user.email}</span>
            <button
              onClick={handleLogout}
              className="text-blue-600 hover:underline"
            >
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
    </header>
  );
}
