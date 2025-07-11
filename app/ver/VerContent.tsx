"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState<string | null>(null);
  const [type, setType] = useState<"cv" | "letter" | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const id = searchParams.get("id");
      if (!id) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login?redirect=/ver?id=" + id);
        return;
      }

      const { data: generation } = await supabase
        .from("generations")
        .select("output, type, created_at")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single();

      if (!generation) {
        setOutput("❌ Generación no encontrada.");
      } else {
        setOutput(generation.output);
        setType(generation.type);
        setCreatedAt(generation.created_at);
      }

      setLoading(false);
    };

    fetchData();
  }, [searchParams, router]);

  const handleDownload = async () => {
    if (!output || !type) return;

    const html2pdf = (await import("html2pdf.js")).default;

    const element = document.getElementById("pdf-content");
    const opt = {
      margin: 10,
      filename: `${type === "cv" ? "curriculum" : "carta"}-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element!).save();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">
            {type === "cv" ? "Currículum generado" : "Carta generada"}
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            Generado el{" "}
            {createdAt && new Date(createdAt).toLocaleString("es-ES")}
          </p>

          <div className="mb-6">
            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Descargar PDF
            </button>
          </div>

          <div
            id="pdf-content"
            className="whitespace-pre-wrap bg-gray-100 p-4 rounded-lg leading-relaxed text-sm"
            style={{ fontFamily: "inherit" }}
          >
            {output}
          </div>
        </>
      )}
    </div>
  );
}
