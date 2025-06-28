import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const cookieStore = await nextCookies(); // ✅ Await here

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () =>
      cookieStore.getAll().map(({ name, value }) => ({ name, value })),
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
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ result: "No estás autenticado." }, { status: 401 });
  }

  const userId = user.id;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data: generationsToday, error: countError } = await supabase
    .from("generations")
    .select("*", { count: "exact" })
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

  const { prompt, type = "cv" } = await req.json();

  if (!prompt) {
    return NextResponse.json({ result: "No se proporcionó el prompt." }, { status: 400 });
  }

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un asistente experto en redacción de currículums. Responde solo con el contenido mejorado.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const result = chat.choices[0].message.content;

    await supabase.from("generations").insert([
      {
        user_id: userId,
        type: type === "cover" ? "cover" : "cv",
      },
    ]);

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("❌ Error generating with OpenAI:", error.message || error);
    return NextResponse.json(
      { result: "❌ Error al generar. Inténtalo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
