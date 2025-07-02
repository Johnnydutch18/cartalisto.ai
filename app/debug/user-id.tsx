'use client';

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  supabase.auth.getUser().then(({ data }) => {
    console.log("🧑‍💻 Supabase User ID:", data.user?.id);
  });

  return <div className="p-10">Check console for User ID</div>;
}
