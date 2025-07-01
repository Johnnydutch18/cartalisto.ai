"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Session } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut(); // clear client session
      await fetch("/api/logout", { method: "POST" }); // clear server cookies
      window.location.href = "/"; // redirect
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <header className="w-full p-4 flex justify-between items-center border-b">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold">CartaListo</Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="hover:underline">Inicio</Link>
          <Link href="/arregla-mi-curriculum" className="hover:underline">CV</Link>
          <Link href="/carta-de-presentacion" className="hover:underline">Carta</Link>
          <Link href="/planes" className="hover:underline">Planes</Link>
        </nav>
      </div>

      {session?.user ? (
        <div className="flex gap-4 items-center">
          <span className="text-sm">{session.user.email}</span>
          <button
            onClick={handleLogout}
            className="text-blue-600 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      ) : (
        <Link href="/login" className="text-blue-600 hover:underline">Iniciar sesión</Link>
      )}
    </header>
  );
}
