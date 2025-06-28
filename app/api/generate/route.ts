import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from '@supabase/ssr'; // Supabase helper
import { cookies } from 'next/headers'; // Needed for Supabase auth

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const cookieStore = cookies();

  // 1. Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  // 2. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ result: "No estás autenticado." }, { status: 401 });
  }

  const userId = user.id;

  // 3. Count how many generations today
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
  const isPaidUser = false; // You’ll need to integrate your billing logic here later

  if (usageCount >= 1 && !isPaidUser) {
    return NextResponse.json(
      { result: "⚠️ Límite alcanzado. Actualiza tu plan para más usos diarios." },
      { status: 429 }
    );
  }

  // 4. Parse prompt and check validity
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
          content:
            "Eres un asistente experto en redacción de currículums. Responde solo con el contenido mejorado.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const result = chat.choices[0].message.content;

    // 5. Log this generation
    await supabase.from("generations").insert([
      {
        user_id: userId,
        type: type === "cover" ? "cover" : "cv", // default to cv
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
