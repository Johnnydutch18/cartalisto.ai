import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

export const createClient = () => {
  const cookieStore = nextCookies(); // ✅ DO NOT await

  const cookieAdapter = {
    get: async (name: string) => {
      const cookies = await cookieStore;
      return cookies.get(name)?.value;
    },
    set: async (name: string, value: string, options: any) => {
      const cookies = await cookieStore;
      cookies.set({ name, value, ...options });
    },
    remove: async (name: string, options: any) => {
      const cookies = await cookieStore;
      cookies.set({ name, value: "", ...options });
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
