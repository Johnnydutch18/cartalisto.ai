import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const cookieStore = await nextCookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { prompt, type } = body;

  if (type !== "cv") {
    return NextResponse.json({ error: "Invalid generation type" }, { status: 400 });
  }

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un generador experto de currículums profesionales. Devuelve SOLO HTML editable, sin etiquetas <html> o bloques de markdown. Nunca pongas `html` ni ``` en la salida. Si faltan datos personales, genera etiquetas como {Tu nombre aquí}. Asegúrate de que la salida esté en español neutro.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const raw = chatResponse.choices[0].message.content || "";
    const cleaned = raw
      .replace(/```html/g, "")
      .replace(/```/g, "")
      .replace(/<html>|<body>|<\/html>|<\/body>/gi, "")
      .trim();

    return NextResponse.json({ result: cleaned });
  } catch (error) {
    console.error("OpenAI error:", error);
    return NextResponse.json({ error: "Error generating CV" }, { status: 500 });
  }
}
