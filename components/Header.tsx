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

  // ✅ Get session on load & listen for changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) setSession(newSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut(); // ✅ client-side
      await fetch("/api/logout", { method: "POST" }); // ✅ server-side cookie
      setSession(null); // ✅ clear local session
      window.location.href = "/"; // ✅ redirect
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="w-full p-4 flex justify-between items-center border-b">
      {/* Left spacer */}
      <div className="w-1/3" />

      {/* Center nav */}
      <nav className="flex gap-6 justify-center w-1/3 text-sm">
        <Link href="/arregla-mi-curriculum" className="hover:underline">Currículum</Link>
        <Link href="/carta-de-presentacion" className="hover:underline">Carta</Link>
        <Link href="/planes" className="hover:underline">Planes</Link>
      </nav>

      {/* Right: login or session */}
      <div className="w-1/3 flex justify-end items-center gap-4">
        {session?.user ? (
          <>
            <span className="text-sm">{session.user.email}</span>
            <button
              onClick={handleLogout}
              className="text-blue-600 hover:underline"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link href="/login" className="text-blue-600 hover:underline">Iniciar sesión</Link>
        )}
      </div>
    </header>
  );
}
