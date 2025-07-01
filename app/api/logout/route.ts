import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = createClient(); // ✅ DO NOT use await here

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to homepage after logout
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL));
}
