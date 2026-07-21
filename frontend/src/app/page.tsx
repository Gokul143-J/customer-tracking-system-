"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Gem } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace("/analytics");
    else router.replace("/login");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-gold-500">
        <Gem className="w-8 h-8" />
        <span className="font-display text-2xl">Jewellery CRM</span>
      </div>
    </div>
  );
}
