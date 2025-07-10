import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log("✅ /api/generate route hit");

  const cookieStore = await nextCookies();

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
    set: () => {},
    remove: () => {},
  } as const;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) console.error("❌ Supabase auth error:", userError);
  if (!user) {
    return NextResponse.json({ result: "No estás autenticado." }, { status: 401 });
  }

  const userId = user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, cvCount, letterCount, lastGeneratedAt")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("❌ Error fetching profile:", profileError);
    return NextResponse.json({ result: "Error al cargar tu perfil." }, { status: 500 });
  }

  // ✅ Parse body
  let type: "cv" | "cover" = "cv";
  let prompt: string;

  try {
    const body = await req.json();
    prompt = body.prompt;
    type = ((body.type || "cv").toLowerCase() === "cover" ? "cover" : "cv") as "cv" | "cover";

    if (!prompt) {
      return NextResponse.json({ result: "No se proporcionó el prompt." }, { status: 400 });
    }
  } catch (err) {
    console.error("❌ Error parsing JSON body:", err);
    return NextResponse.json({ result: "Error al procesar la solicitud." }, { status: 400 });
  }

  // ✅ Limit logic by plan
  const plan = (profile.plan ?? "free") as "free" | "estandar" | "pro";
  const isFree = plan === "free";

  const today = new Date().toISOString().split("T")[0];
  const lastDate = profile.lastGeneratedAt?.split("T")[0] ?? "";
  const isSameDay = today === lastDate;

  const cvCount = isSameDay ? profile.cvCount ?? 0 : 0;
  const letterCount = isSameDay ? profile.letterCount ?? 0 : 0;

  if (isFree && (cvCount + letterCount) >= 1) {
    return NextResponse.json(
      { result: "⚠️ Has alcanzado tu límite diario. Actualiza tu plan para más usos." },
      { status: 429 }
    );
  }

  const systemPrompt =
    type === "cover"
      ? "Eres un experto en cartas de presentación para el mercado laboral español. Responde solo con la carta generada."
      : "Eres un asistente experto en redacción de currículums. Responde solo con el contenido mejorado.";

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const result = chat.choices[0].message.content;

    // Log usage to generations table
    await supabase.from("generations").insert([
      {
        user_id: userId,
        type,
      },
    ]);

    // ✅ Update correct usage count
    const updates: Record<string, any> = {
      lastGeneratedAt: new Date().toISOString(),
    };

    if (type === "cv") {
      updates.cvCount = isSameDay ? cvCount + 1 : 1;
      updates.letterCount = isSameDay ? letterCount : 0;
    } else {
      updates.cvCount = isSameDay ? cvCount : 0;
      updates.letterCount = isSameDay ? letterCount + 1 : 1;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (updateError) {
      console.error("❌ Error updating usage:", updateError);
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("❌ OpenAI Error:", error.message || error);
    return NextResponse.json(
      { result: "❌ Error al generar. Inténtalo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
