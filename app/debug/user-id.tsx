"use client";
import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  "https://dgjkxjxiuruwhcggwqni.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnamt4anhpdXJ1d2hjZ2d3cW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMDIxMzIsImV4cCI6MjA2NjU3ODEzMn0.F4xYQo0IbgyzpkmTAnbNuh7Xk-rXoftd4ctAPG97b28"
);

export default function ShowUserId() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error("❌ Error fetching user:", error);
      } else {
        console.log("🧑‍💻 Supabase User ID:", data.user?.id);
      }
    });
  }, []);

  return null;
}
