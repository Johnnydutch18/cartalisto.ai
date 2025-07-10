"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchUserPlan(data.session.user.id);
      }
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchUserPlan(newSession.user.id);
      } else {
        setPlan(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserPlan = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    if (!error && data?.plan) {
      setPlan(data.plan);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setSession(null);
    setPlan(null);
    router.refresh();
    router.push("/");
  };

  return (
    <header className="w-full px-4 py-4 border-b flex justify-between items-center relative z-50">
      {/* Logo */}
      <Link href="/" className="text-xl font-bold">
        CartaListo
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex gap-6 text-sm">
        <Link href="/arregla-mi-curriculum" className="hover:underline">Currículum</Link>
        <Link href="/carta-de-presentacion" className="hover:underline">Carta</Link>
        <Link href="/planes" className="hover:underline">Planes</Link>
        {session?.user ? (
          <>
            <span>{session.user.email} {plan && <span className="text-xs text-gray-500">({plan})</span>}</span>
            <button onClick={handleLogout} className="text-blue-600 hover:underline">Cerrar sesión</button>
          </>
        ) : (
          <>
            <Link href="/login?mode=signin" className="text-blue-600 hover:underline">Iniciar sesión</Link>
            <Link href="/login?mode=signup" className="text-blue-600 hover:underline">Crear cuenta</Link>
          </>
        )}
      </nav>

      {/* Mobile Hamburger */}
      <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
        <Menu className="w-6 h-6" />
      </button>

      {/* Slide-In Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 flex flex-col gap-4 text-sm">
          <button className="self-end" onClick={() => setMenuOpen(false)}>✕</button>
          <Link href="/arregla-mi-curriculum" onClick={() => setMenuOpen(false)} className="hover:underline">Currículum</Link>
          <Link href="/carta-de-presentacion" onClick={() => setMenuOpen(false)} className="hover:underline">Carta</Link>
          <Link href="/planes" onClick={() => setMenuOpen(false)} className="hover:underline">Planes</Link>
          {session?.user ? (
            <>
              <span>
                {session.user.email}
                {plan && <span className="block text-xs text-gray-500">Plan: {plan}</span>}
              </span>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="text-blue-600 hover:underline"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/login?mode=signin" onClick={() => setMenuOpen(false)} className="text-blue-600 hover:underline">Iniciar sesión</Link>
              <Link href="/login?mode=signup" onClick={() => setMenuOpen(false)} className="text-blue-600 hover:underline">Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
