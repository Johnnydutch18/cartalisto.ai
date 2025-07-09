import { createServerClient } from '@supabase/ssr'
import { cookies as nextCookies } from 'next/headers'
import UpgradeButton from '../../components/UpgradeButton' // ✅ Corrected path

export default async function PlansPage() {
  const cookieStore = await nextCookies()

  const cookieAdapter = {
    get: (name: string) => cookieStore.get(name)?.value ?? undefined,
    getAll: () => {
      const all: { name: string; value: string }[] = []
      for (const c of cookieStore.getAll()) {
        all.push({ name: c.name, value: c.value })
      }
      return all
    },
    set: () => {},
    remove: () => {},
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieAdapter,
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">Elige tu plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className="border rounded-lg p-6 shadow-sm text-center">
          <h2 className="text-xl font-semibold mb-2">Free</h2>
          <p className="text-3xl font-bold mb-4">0€</p>
          <ul className="text-sm mb-6 space-y-2">
            <li>✔️ 1 generación al día</li>
            <li>✔️ GPT‑4o‑mini</li>
            <li>✔️ Descargar PDF</li>
          </ul>
          <button className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300">
            Usar gratis
          </button>
        </div>

        {/* Estándar Plan */}
        <div className="border rounded-lg p-6 shadow-md text-center bg-yellow-50">
          <h2 className="text-xl font-semibold mb-2">Estándar</h2>
          <p className="text-3xl font-bold mb-4">6,95€/mes</p>
          <ul className="text-sm mb-6 space-y-2">
            <li>✔️ Generaciones ilimitadas</li>
            <li>✔️ GPT‑4o</li>
            <li>✔️ PDF + Copiar</li>
            <li>✔️ Selector de tono</li>
          </ul>
          <UpgradeButton plan="standard" />
        </div>

        {/* Pro Plan */}
        <div className="border rounded-lg p-6 shadow-sm text-center">
          <h2 className="text-xl font-semibold mb-2">Pro</h2>
          <p className="text-3xl font-bold mb-4">8,95€/mes</p>
          <ul className="text-sm mb-6 space-y-2">
            <li>✔️ GPT‑4.1 (alta calidad)</li>
            <li>✔️ Español + Inglés</li>
            <li>✔️ Todo lo del Estándar</li>
            <li>✔️ Historial + Editor Próximamente</li>
          </ul>
          <UpgradeButton plan="pro" />
        </div>
      </div>
    </div>
  )
}
