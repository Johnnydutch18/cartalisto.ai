"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Session } from "@supabase/supabase-js";
import Link from "next/link";

// ✅ Pass env vars directly
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // ✅ Get current session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // ✅ Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="w-full p-4 flex justify-between items-center border-b">
      <Link href="/" className="text-lg font-bold">CartaListo</Link>

      {session?.user ? (
        <div className="flex gap-4 items-center">
          <span className="text-sm">{session.user.email}</span>
          <Link href="/api/logout" className="text-blue-600 hover:underline">Logout</Link>
        </div>
      ) : (
        <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
      )}
    </header>
  );
}
