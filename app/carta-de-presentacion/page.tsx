"use client";

import { useState } from "react";

export default function CoverLetterPage() {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [experience, setExperience] = useState("");
  const [format, setFormat] = useState("formal");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<null | "up" | "down">(null);

  async function handleSubmit() {
    setLoading(true);
    setOutput("");
    setFeedback(null);

    const styleInstruction =
      format === "moderno"
        ? "Utiliza un estilo moderno, con frases activas, lenguaje natural, y una estructura concisa. Evita frases muy formales o anticuadas."
        : "Utiliza un estilo formal y tradicional, con cortesía, estructura clara y un tono profesional apropiado para empresas conservadoras.";

    const prompt = `Redacta una carta de presentación en español para una solicitud de empleo en España.
Debe estar personalizada para la siguiente persona:

Nombre: ${name}
Puesto deseado: ${position}
Experiencia previa: ${experience}

${styleInstruction}

Haz que la carta sea convincente, clara y adecuada para destacar al candidato.`;

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

  async function downloadPDF() {
    if (typeof window === "undefined") return;
    const html2pdf = (await import("html2pdf.js")).default;

    const element = document.getElementById("generated-letter");
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: "carta-de-presentacion.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  }

  function resetForm() {
    setName("");
    setPosition("");
    setExperience("");
    setFormat("formal");
    setOutput("");
    setFeedback(null);
  }

  return (
    <main style={{ maxWidth: "650px", margin: "2rem auto", padding: "1rem" }}>
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

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.75rem",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            {loading ? "✍️ Generando tu carta..." : "Generar Carta"}
          </button>
          <button
            onClick={resetForm}
            style={{
              padding: "0.75rem",
              backgroundColor: "#999",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Limpiar
          </button>
        </div>

        {loading && (
          <p style={{ color: "#888", marginTop: "0.5rem" }}>
            ⏳ Esto puede tardar unos segundos... tu carta está siendo escrita por IA.
          </p>
        )}
      </div>

      {output && (
        <div style={{ marginTop: "2rem" }}>
          <div
            id="generated-letter"
            style={{
              background: "#ffffff",
              padding: "1rem",
              borderRadius: "6px",
              whiteSpace: "pre-wrap",
              border: "1px solid #ccc"
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              ✅ Carta Generada
            </h2>
            <div
              style={{
                fontFamily: "inherit",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word"
              }}
            >
              {output}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              onClick={downloadPDF}
              style={{
                flex: 1,
                padding: "0.5rem",
                backgroundColor: "#333",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Descargar PDF
            </button>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: "0.5rem",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Regenerar
            </button>
          </div>

          <div style={{ marginTop: "1rem", textAlign: "center", color: "#666" }}>
            <p>¿Te fue útil?</p>
            <div style={{ fontSize: "1.5rem", cursor: "pointer" }}>
              <span
                onClick={() => setFeedback("up")}
                style={{ marginRight: "1rem", opacity: feedback === "up" ? 1 : 0.4 }}
              >
                👍
              </span>
              <span
                onClick={() => setFeedback("down")}
                style={{ opacity: feedback === "down" ? 1 : 0.4 }}
              >
                👎
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
