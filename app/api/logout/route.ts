import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Manually nuke Supabase SSR cookies
  cookieStore.set({
    name: "sb-access-token",
    value: "",
    path: "/",
    expires: new Date(0),
  });

  cookieStore.set({
    name: "sb-refresh-token",
    value: "",
    path: "/",
    expires: new Date(0),
  });

  // Manually nuke Supabase SSR helper cookie (if exists)
  cookieStore.set({
    name: "__Host-next-auth.session-token",
    value: "",
    path: "/",
    expires: new Date(0),
  });

  return NextResponse.json({ success: true });
}
