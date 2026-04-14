"use client";

import { useState } from "react";
import { Building2, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from "lucide-react";

export default function OwnerPortalLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/owner-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // Hard navigation so the server component picks up the new httpOnly cookie
      window.location.href = "/owner-portal";
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f7f6f3" }}>
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 mb-4">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Gesting</h1>
          <p className="text-sm text-stone-400 mt-1">Portal de propietarios</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-7">
          <h2 className="text-base font-bold text-stone-800 mb-1">Iniciar sesión</h2>
          <p className="text-xs text-stone-400 mb-6">Ingresá con el email y contraseña que te proporcionó Gesting.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(""); }}
                disabled={loading}
                autoComplete="email"
                className="w-full h-10 px-3.5 rounded-xl border border-stone-200 text-sm text-stone-800 bg-stone-50 focus:bg-white focus:border-stone-400 focus:outline-none transition-colors disabled:opacity-50"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(""); }}
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full h-10 px-3.5 pr-10 rounded-xl border border-stone-200 text-sm text-stone-800 bg-stone-50 focus:bg-white focus:border-stone-400 focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Ingresando...</>
                : <><ArrowRight className="h-4 w-4" />Ingresar</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-stone-400 mt-6">
          ¿Problemas para acceder? Contactá a Gesting.
        </p>
      </div>
    </div>
  );
}
