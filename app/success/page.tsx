'use client';

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const router = useRouter();

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    fetch(`/api/stripe/confirm?session_id=${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to confirm");
        return res.json();
      })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [sessionId]);

  if (status === "loading") {
    return <p className="text-center mt-20">⏳ Confirmando tu compra…</p>;
  }

  if (status === "error") {
    return (
      <div className="text-center mt-20">
        <h1 className="text-xl font-bold text-red-600">❌ Algo salió mal</h1>
        <p className="mt-2">No pudimos confirmar tu plan. Intenta de nuevo o contáctanos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto text-center mt-20">
      <h1 className="text-2xl font-bold text-green-600">¡Gracias por tu compra!</h1>
      <p className="mt-4">Tu plan ha sido actualizado correctamente. Ya puedes disfrutar de todas las funciones premium.</p>
      <button
        onClick={() => router.push("/")}
        className="mt-6 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        Volver al inicio
      </button>
    </div>
  );
}
