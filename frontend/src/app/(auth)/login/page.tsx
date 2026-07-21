"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gem, Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@jewellerycrm.com");
  const [password, setPassword] = useState("Admin@2026!Secure");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push("/analytics");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-8 shadow-soft">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gold-500 text-white flex items-center justify-center mb-3 shadow-card">
            <Gem className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl text-ink-900">Jewellery CRM</h1>
          <p className="text-sm text-ink-500 mt-1">
            Customer Journey Management
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-ink-500" />
              <input
                type="email"
                className="input pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                suppressHydrationWarning
              />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-ink-500" />
              <input
                type="password"
                className="input pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                suppressHydrationWarning
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5"
            suppressHydrationWarning
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-xs text-ink-500 mt-6 text-center">
          Demo mode — sign in with any email to auto-create an admin account,
          or use <code className="bg-ink-50 px-1 rounded">admin@jewellerycrm.com</code> /{" "}
          <code className="bg-ink-50 px-1 rounded">Admin@2026!Secure</code>
        </p>
      </div>
    </div>
  );
}
