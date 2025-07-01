// app/api/logout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = createClient();

  await supabase.auth.signOut();

  // Use 303 to safely redirect after POST
  return NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_SITE_URL),
    303
  );
}
