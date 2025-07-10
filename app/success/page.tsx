'use client';

import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto text-center mt-20">
      <h1 className="text-2xl font-bold text-green-600">¡Gracias por tu compra!</h1>
      <p className="mt-4">
        Tu plan ha sido actualizado correctamente. Ya puedes disfrutar de todas las funciones premium.
      </p>
      <button
        onClick={() => router.push("/")}
        className="mt-6 px-4 py-2 bg-black text-white rounded hover:opacity-80"
      >
        Volver al inicio
      </button>
    </div>
  );
}
