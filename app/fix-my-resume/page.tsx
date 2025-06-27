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
          {loading ? "Generando..." : "Mejorar con IA"}
        </button>
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
