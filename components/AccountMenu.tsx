"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AccountMenu({ email }: { email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "GET" });
      router.refresh(); // Refresh server-side layout (Header)
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">👋 {email}</span>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {loading ? "Saliendo..." : "Cerrar sesión"}
      </button>
    </div>
  );
}
