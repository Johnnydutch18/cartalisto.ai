// app/planes/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Planes de Precios | CartaListo",
  description: "Elige el plan que más te convenga. Desde gratis hasta opciones premium para optimizar tu currículum y carta de presentación con IA.",
  alternates: {
    canonical: "https://cartalisto.com/planes",
  },
  openGraph: {
    title: "Planes de Precios | CartaListo",
    description: "Desde gratis hasta opciones premium para mejorar tu CV y carta con IA.",
    url: "https://cartalisto.com/planes",
    images: ["/og-image.jpg"],
    type: "website",
  },
};

export default function Planes() {
 const plans = [
  {
    name: "Gratis",
    price: "0€",
    features: [
      "1 generación al día",
      "GPT‑4o‑mini",
      "Descarga en PDF",
    ],
    highlight: false,
    url: null,
  },
  {
    name: "Estándar",
    price: "6,95€/mes",
    features: [
      "Generaciones ilimitadas",
      "GPT‑4o",
      "PDF + Copiar",
      "Selector de tono",
    ],
    highlight: true,
    url: "https://buy.stripe.com/test_7sY28t9QN5mU8DH0a1frW00", 
  },
  {
    name: "Pro",
    price: "8,95€/mes",
    features: [
      "GPT‑4.1 (alta calidad)",
      "Inglés y Español",
      "Todo de Estándar",
      "Editor inline (próx.)",
      "Historial de documentos (próx.)",
      "Soporte prioritario",
    ],
    highlight: false,
    url: "https://buy.stripe.com/test_pro_plan_urlhttps://buy.stripe.com/test_28E9AVbYVdTq7zD2i9frW01", // Replace with your live Stripe Checkout link
  },
];


  return (
    <main className="min-h-screen px-4 py-12 bg-gray-50 text-gray-800">
      <h1 className="text-4xl font-bold text-center mb-10">Planes de Precios</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`relative rounded-xl border shadow-sm p-6 flex flex-col items-center ${plan.highlight ? "bg-blue-50 border-blue-500" : "bg-white"}`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow">
                Recomendado
              </div>
            )}
            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-xl font-bold text-blue-600 mb-4">{plan.price}</p>
            <ul className="mb-6 space-y-2 text-center">
              {plan.features.map((f, i) => (
                <li key={i} className="text-sm text-gray-700">✔️ {f}</li>
              ))}
            </ul>
            <button
{plan.url ? (
  <a
    href={plan.url}
    target="_blank"
    rel="noopener noreferrer"
    className={`mt-auto px-4 py-2 rounded-xl font-semibold text-white ${plan.highlight ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"}`}
  >
    Elegir plan
  </a>
) : (
  <button
    className="mt-auto px-4 py-2 rounded-xl font-semibold text-white bg-gray-400 cursor-not-allowed"
    disabled
  >
    Próximamente
  </button>
)}
              disabled
            >
              Próximamente
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
