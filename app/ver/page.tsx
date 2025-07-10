// app/ver/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

export default async function VerPage({ searchParams }: { searchParams: { id?: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { id } = searchParams;
  if (!id) return <p className="p-6">ID no proporcionado.</p>;

  const { data: generation } = await supabase
    .from("generations")
    .select("output, type, created_at")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!generation) return <p className="p-6">Generación no encontrada.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        {generation.type === "cv" ? "Currículum generado" : "Carta generada"}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        Generado el {new Date(generation.created_at).toLocaleString("es-ES")}
      </p>
      <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded-lg">{generation.output}</pre>
    </div>
  );
}
