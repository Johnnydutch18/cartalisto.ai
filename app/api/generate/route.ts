import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
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

  if (!user || userError) {
    return NextResponse.json({ result: "No estás autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, cvCount, letterCount, lastGeneratedAt, email")
    .eq("id", user.id)
    .single();

  let type: "cv" | "cover" = "cv";
  let prompt: string;

  try {
    const body = await req.json();
    prompt = body.prompt;
    const rawType = (body.type || "").toLowerCase().trim();
    if (rawType.includes("letter") || rawType === "cover") {
      type = "cover";
    }
  } catch {
    return NextResponse.json({ result: "Error al procesar tu solicitud." }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const isSameDay = profile?.lastGeneratedAt?.split("T")[0] === today;
  const cvCount = isSameDay ? profile.cvCount ?? 0 : 0;
  const letterCount = isSameDay ? profile.letterCount ?? 0 : 0;

  const plan = profile?.plan ?? "free";
  const isFree = plan === "free";

  if (isFree && cvCount + letterCount >= 1) {
    return NextResponse.json(
      { error: "Daily usage limit reached." },
      { status: 429 }
    );
  }

  const systemPrompt =
    type === "cover"
      ? `Eres un experto en cartas de presentación laborales. Genera una carta en HTML editable y visualmente estructurada. Usa solo <div>, <h1>, <h2>, <ul>, <li>, <p>, <strong>, <em>. No incluyas <html>, <head> ni CSS externo. No escribas explicaciones.`
      : `Eres un redactor profesional de currículums. Genera solo el contenido del currículum en HTML editable y bien estructurado. Usa <div>, <h1>, <h2>, <ul>, <li>, <p>, <strong>, <em>. No incluyas <html>, <head> ni comentarios ni explicaciones.`

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    const result = chat.choices?.[0]?.message?.content?.trim();

    if (!result || result.length < 100) {
      return NextResponse.json(
        { result: "⚠️ El contenido generado fue demasiado corto o inválido." },
        { status: 502 }
      );
    }

    await supabase.from("generations").insert([
      { user_id: user.id, type, output: result },
    ]);

    const updates: any = { lastGeneratedAt: new Date().toISOString() };
    if (type === "cv") {
      updates.cvCount = isSameDay ? cvCount + 1 : 1;
      updates.letterCount = isSameDay ? letterCount : 0;
    } else {
      updates.letterCount = isSameDay ? letterCount + 1 : 1;
      updates.cvCount = isSameDay ? cvCount : 0;
    }
    if (!profile?.email && user.email) updates.email = user.email;

    await supabase.from("profiles").update(updates).eq("id", user.id);

    return NextResponse.json({
      result,
      usage: {
        cvCount: updates.cvCount,
        letterCount: updates.letterCount,
        limit: plan === "free" ? 1 : 999,
      },
    });
  } catch (err: any) {
    console.error("❌ OpenAI error:", err);
    return NextResponse.json(
      { result: "Error al generar. Intenta más tarde." },
      { status: 500 }
    );
  }
}
