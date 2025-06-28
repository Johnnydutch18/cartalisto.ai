"use client";

import { useState } from "react";

export default function CartaPresentacion() {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [tone, setTone] = useState("Formal");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setOutput("");

    const prompt = `Redacta una carta de presentación profesional en español basada en la siguiente información:

Nombre: ${name}
Puesto deseado: ${position}
Experiencia relevante: ${experience}
Habilidades clave: ${skills || "No especificado"}
Tono: ${tone}

La carta debe ser clara, persuasiva y con formato adecuado para el mercado laboral español.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setOutput(data.result);
    } catch (error) {
      console.error("❌ Error:", error);
      setOutput("Ocurrió un error. Inténtalo de nuevo más tarde.");
    }

    setLoading(false);
  }

  return (
    <main style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Generador de Carta de Presentación</h1>
      <p style={{ color: "#555" }}>Completa el formulario para generar tu carta personalizada.</p>

      <div style={{ marginTop: "1rem" }}>
        <label><strong>Nombre completo:</strong></label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", marginBottom: "0.5rem" }} />

        <label><strong>Puesto deseado:</strong></label>
        <input value={position} onChange={(e) => setPosition(e.target.value)} style={{ width: "100%", marginBottom: "0.5rem" }} />

        <label><strong>Experiencia relevante:</strong></label>
        <textarea rows={3} value={experience} onChange={(e) => setExperience(e.target.value)} style={{ width: "100%", marginBottom: "0.5rem" }} />

        <label><strong>Habilidades clave (opcional):</strong></label>
        <textarea rows={2} value={skills} onChange={(e) => setSkills(e.target.value)} style={{ width: "100%", marginBottom: "0.5rem" }} />

        <label><strong>Tono:</strong></label>
        <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }}>
          <option value="Formal">Formal</option>
          <option value="Profesional">Profesional</option>
          <option value="Creativo">Creativo</option>
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ padding: "0.75rem 1.5rem", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          {loading ? "Generando..." : "Generar Carta"}
        </button>
      </div>

      {output && (
        <div style={{ marginTop: "2rem", background: "#f9f9f9", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>Carta Generada</h2>
          <p>{output}</p>
        </div>
      )}
    </main>
  );
}
