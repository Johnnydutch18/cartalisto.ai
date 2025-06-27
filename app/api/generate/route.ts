import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const chat = await openai.chat.completions.create({
    model: "gpt-4o", // or "gpt-4o-mini" for cheaper plan
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
}
