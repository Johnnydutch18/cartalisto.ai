"use client";

import { useState } from "react";

export default function CoverLetterPage() {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [experience, setExperience] = useState("");
  const [format, setFormat] = useState("formal"); // ← new format toggle
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setOutput("");

    const prompt = `Redacta una carta de presentación en español para el mercado laboral de España.
Debe ser personalizada, convincente, bien estructurada y adaptada al formato "${format}".

Nombre: ${name}
Puesto deseado: ${position}
Experiencia previa: ${experience}`;

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
      console.error("❌ Error:", error);
      setOutput("Hubo un error al generar la carta. Inténtalo de nuevo.");
    }

    setLoading(false);
  }

  return (
    <main style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>
        Generador de Cartas de Presentación
      </h1>
      <p style={{ color: "#555" }}>
        Personaliza tu carta de presentación para destacar en tus aplicaciones.
      </p>

      <div style={{ marginTop: "1rem" }}>
        <label><strong>Nombre:</strong></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ejemplo: Laura García"
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        />

        <label><strong>Puesto deseado:</strong></label>
        <input
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Ejemplo: Administrativa, Diseñadora UX, etc."
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        />

        <label><strong>Experiencia previa:</strong></label>
        <textarea
          rows={4}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="Describe tu experiencia o habilidades relevantes..."
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        />

        <label><strong>Formato de carta:</strong></label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
        >
          <option value="formal">Formal / Tradicional</option>
          <option value="moderno">Moderno / Actual</option>
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
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
