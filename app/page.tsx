"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Bienvenido a CartaListo
      </h1>
      <p style={{ marginBottom: "2rem", color: "#555" }}>
        Optimiza tu currículum y genera cartas de presentación con IA. Elige una herramienta para comenzar:
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Link href="/arregla-mi-curriculum">
          <button style={buttonStyle}>✍️ Arregla Mi Currículum</button>
        </Link>
        <Link href="/carta-de-presentacion">
          <button style={buttonStyle}>💼 Generador de Carta de Presentación</button>
        </Link>
      </div>
    </main>
  );
}

const buttonStyle = {
  padding: "1rem",
  fontSize: "1rem",
  borderRadius: "6px",
  backgroundColor: "#0070f3",
  color: "white",
  border: "none",
  cursor: "pointer",
};
