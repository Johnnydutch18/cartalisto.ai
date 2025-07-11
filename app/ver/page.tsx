import { Suspense } from "react";
import VerContent from "./VerContent";

export default function VerPage() {
  return (
    <Suspense fallback={<p className="p-6">Cargando...</p>}>
      <VerContent />
    </Suspense>
  );
}
