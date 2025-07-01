// utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

export const createClient = () => {
  // DO NOT await here — we await inside each method instead
  const cookieStorePromise = nextCookies();

  const cookieAdapter = {
    get: async (name: string) => {
      const cookieStore = await cookieStorePromise;
      return cookieStore.get(name)?.value;
    },
    getAll: async () => {
      const cookieStore = await cookieStorePromise;
      return Array.from(cookieStore.getAll()).map((c: any) => ({
        name: c.name,
        value: c.value,
      }));
    },
    set: async (name: string, value: string, options: any) => {
      const cookieStore = await cookieStorePromise;
      cookieStore.set({ name, value, ...options });
    },
    remove: async (name: string, options: any) => {
      const cookieStore = await cookieStorePromise;
      cookieStore.set({ name, value: "", ...options });
    },
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: cookieAdapter,
    }
  );
};
