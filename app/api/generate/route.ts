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
    getAll: () => {
      return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
    },
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

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, cvCount, letterCount, lastGeneratedAt")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("❌ Error fetching profile:", profileError);
    return NextResponse.json({ result: "Error al cargar tu perfil." }, { status: 500 });
  }

  const plan = profile.plan ?? "free";
  const maxPerDay = plan === "pro" ? Infinity : plan === "estandar" ? 5 : 1;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const lastGenerated = new Date(profile.lastGeneratedAt);
  const shouldReset = lastGenerated < today;

  const cvCount = shouldReset ? 0 : profile.cvCount ?? 0;
  const letterCount = shouldReset ? 0 : profile.letterCount ?? 0;

  // Parse body
  let prompt: string;
  let type: string;

  try {
    const body = await req.json();
    prompt = body.prompt;
    type = body.type || "cv";

    if (!prompt) {
      return NextResponse.json({ result: "No se proporcionó el prompt." }, { status: 400 });
    }
  } catch (err) {
    console.error("❌ Error parsing JSON body:", err);
    return NextResponse.json({ result: "Error al procesar la solicitud." }, { status: 400 });
  }

  const isCV = type !== "cover";
  const currentCount = isCV ? cvCount : letterCount;

  if (currentCount >= maxPerDay) {
    return NextResponse.json(
      { result: "⚠️ Has alcanzado tu límite diario. Actualiza tu plan para más usos." },
      { status: 429 }
    );
  }

  const systemPrompt = isCV
    ? "Eres un asistente experto en redacción de currículums. Responde solo con el contenido mejorado."
    : "Eres un experto en cartas de presentación para el mercado laboral español. Responde solo con la carta generada.";

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

    // Log usage
    await supabase.from("generations").insert([
      {
        user_id: userId,
        type: isCV ? "cv" : "cover",
      },
    ]);

    const updates: Record<string, any> = {
      lastGeneratedAt: new Date().toISOString(),
    };

    if (isCV) {
      updates.cvCount = cvCount + 1;
    } else {
      updates.letterCount = letterCount + 1;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (updateError) {
      console.error("❌ Error updating profile counts:", updateError);
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("❌ Error generating with OpenAI:", error.message || error);
    return NextResponse.json(
      { result: "❌ Error al generar. Inténtalo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
