// app/fix-my-resume/page.tsx
"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function FixMyResume() {
  const [resume, setResume] = useState("");
  const [jobType, setJobType] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setOutput("");

    const prompt = `Eres un experto en redacción de currículums para el mercado laboral de España. Tu tarea es mejorar el siguiente CV en cuanto a claridad, profesionalismo, gramática y presentación, manteniendo los datos esenciales. Utiliza un tono formal y profesional.\n\nEste es el CV original:\n${resume}\n\nTipo de empleo: ${jobType}`;

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    setOutput(data.result);
    setLoading(false);
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Arregla Mi Currículum</h1>
      <p className="text-gray-600">
        Mejora tu CV para destacar en tus postulaciones laborales.
      </p>

      <div className="space-y-4">
        <Label htmlFor="resume">Pega aquí tu currículum actual:</Label>
        <Textarea
          id="resume"
          rows={8}
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="Ejemplo: Experiencia laboral, educación, habilidades..."
        />

        <Label htmlFor="jobType">¿A qué tipo de empleo estás aplicando? (opcional)</Label>
        <Textarea
          id="jobType"
          rows={2}
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          placeholder="Ejemplo: Administrativo, Marketing, Atención al cliente..."
        />

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Generando..." : "Mejorar con IA"}
        </Button>
      </div>

      {output && (
        <Card className="mt-6">
          <CardContent className="whitespace-pre-wrap p-4">
            <h2 className="text-xl font-semibold mb-2">Versión Mejorada</h2>
            {output}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
