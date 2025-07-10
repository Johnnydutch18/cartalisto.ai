// app/success/page.tsx

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-green-600">¡Gracias por tu compra!</h1>
        <p className="mb-6">Tu plan ha sido actualizado correctamente. Ya puedes disfrutar de todas las funciones premium.</p>
        <a
          href="/"
          className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
