import { Suspense } from "react";
import VerContent from "./VerContent";

export default function VerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 flex justify-center items-center h-screen text-lg text-gray-500">
          Cargando generación...
        </div>
      }
    >
      <VerContent />
    </Suspense>
  );
}
