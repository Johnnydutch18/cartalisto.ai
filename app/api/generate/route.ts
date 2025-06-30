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
      const all = [];
      for (const { name, value } of cookieStore.getAll()) {
        all.push({ name, value });
      }
      return all;
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
  console.log("🧪 User:", user);

  if (!user) {
    return NextResponse.json({ result: "No estás autenticado." }, { status: 401 });
  }

  const userId = user.id;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data: generationsToday, error: countError } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString());

  if (countError) {
    console.error("❌ Error counting generations:", countError);
  }

  const usageCount = generationsToday?.length ?? 0;
  const isPaidUser = false;

  if (usageCount >= 1 && !isPaidUser) {
    return NextResponse.json(
      { result: "⚠️ Límite alcanzado. Actualiza tu plan para más usos diarios." },
      { status: 429 }
    );
  }

  let prompt: string;
  let type: string;

  try {
    const body = await req.json();
    console.log("📥 Body received:", body);
    prompt = body.prompt;
    type = body.type || "cv";

    if (!prompt) {
      return NextResponse.json({ result: "No se proporcionó el prompt." }, { status: 400 });
    }
  } catch (err) {
    console.error("❌ Error parsing JSON body:", err);
    return NextResponse.json({ result: "Error al procesar la solicitud." }, { status: 400 });
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
    console.log("✅ OpenAI result received");

    const { error: insertError } = await supabase.from("generations").insert([
      {
        user_id: userId,
        type: type === "cover" ? "cover" : "cv",
      },
    ]);

    if (insertError) {
      console.error("❌ Error logging generation to Supabase:", insertError);
    }

    return NextResponse.json({ result });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ Error generating with OpenAI:", err.message || err);
    return NextResponse.json(
      { result: "❌ Error al generar. Inténtalo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
