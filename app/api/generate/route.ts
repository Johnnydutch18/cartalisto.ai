import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("✅ Loaded OpenAI key:", process.env.OPENAI_API_KEY ? "Found" : "Missing");

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      console.error("❌ No prompt received.");
      return NextResponse.json(
        { result: "No prompt provided." },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ result: chat.choices[0].message.content });
  } catch (error: any) {
    console.error("❌ Error in /api/generate:", error.message || error);
    return NextResponse.json(
      { result: "Ocurrió un error al generar el currículum. Inténtalo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
