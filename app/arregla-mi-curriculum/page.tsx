"use client";

import { useState } from "react";

export default function FixMyResume() {
  const [resume, setResume] = useState("");
  const [jobType, setJobType] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setOutput("");

const prompt = `Actúa como un experto redactor de currículums con experiencia en el mercado laboral español. Tu tarea es:

1. Corregir errores gramaticales y mejorar la redacción.
2. Reorganizar la información para mayor claridad y fluidez.
3. Aplicar un formato profesional, claro y moderno.
4. Incluir mejoras compatibles con sistemas ATS (palabras clave, estructura).

Conserva todos los datos importantes proporcionados por el usuario, pero expresa las ideas con mayor impacto profesional.

CV original:
${resume}

Tipo de empleo (si se indicó): ${jobType}
`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("OpenAI API failed");

      const data = await response.json();
      setOutput(data.result);
    } catch (error) {
      setOutput("Hubo un problema al generar tu currículum. Intenta de nuevo más tarde.");
      console.error("❌ Error calling API:", error);
    }

    setLoading(false);
  }

  return (
  <main style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem" }}>
    <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Arregla Mi Currículum</h1>
    <p style={{ color: "#555" }}>
      Mejora tu CV para destacar en tus postulaciones laborales.
    </p>

    <div style={{ marginTop: "1rem" }}>
      <label htmlFor="resume"><strong>Currículum actual:</strong></label>
      <textarea
        id="resume"
        rows={8}
        value={resume}
        onChange={(e) => setResume(e.target.value)}
        placeholder="Ejemplo: Experiencia laboral, educación, habilidades..."
        style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
      />

      <label htmlFor="jobType" style={{ marginTop: "1rem", display: "block" }}>
        <strong>Tipo de empleo (opcional):</strong>
      </label>
      <textarea
        id="jobType"
        rows={2}
        value={jobType}
        onChange={(e) => setJobType(e.target.value)}
        placeholder="Ejemplo: Administrativo, Marketing, Atención al cliente..."
        style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        {loading ? "✍️ Mejorando tu CV con IA..." : "Mejorar con IA"}
      </button>

      {loading && (
        <p style={{ color: "#888", marginTop: "0.5rem" }}>
          Esto puede tardar unos segundos... tu CV está siendo mejorado por IA.
        </p>
      )}
    </div>

    {output && (
      <div style={{ marginTop: "2rem", background: "#f9f9f9", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>Versión Mejorada</h2>
        <p>{output}</p>
      </div>
    )}
   </main>
); 

} 
