"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { useGlow } from "@/components/ui/glow-card";

/* ─── Smokey canvas particles ──────────────────── */
function SmokeyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; color: string;
    }[] = [];

    const COLORS = ["#1E40AF", "#1D4ED8", "#2563EB", "#3B82F6", "#60A5FA", "#0EA5E9", "#0284C7"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2 - 0.1,
        r: Math.random() * 120 + 40,
        alpha: Math.random() * 0.12 + 0.03,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, p.color + Math.round(p.alpha * 255).toString(16).padStart(2, "0"));
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -p.r) p.x = canvas.width + p.r;
        if (p.x > canvas.width + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = canvas.height + p.r;
        if (p.y > canvas.height + p.r) p.y = -p.r;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ─── Floating label input ───────────────────── */
function FloatingInput({
  id, label, type = "text", value, onChange, disabled, suffix, error,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; disabled?: boolean;
  suffix?: React.ReactNode; error?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;

  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={id}
        className={`
          w-full pt-5 pb-2 px-3.5 rounded-lg text-sm text-white caret-white bg-white/8 [color-scheme:dark]
          border transition-all outline-none
          placeholder-transparent disabled:opacity-50
          ${error
            ? "border-red-400/60 focus:border-red-400 focus:ring-1 focus:ring-red-400/30"
            : focused
            ? "border-blue-400/60 focus:border-blue-400 ring-1 ring-blue-400/20"
            : "border-white/15 hover:border-white/25"
          }
          ${suffix ? "pr-10" : ""}
        `}
        placeholder={label}
      />
      <label
        htmlFor={id}
        className={`
          absolute left-3.5 transition-all duration-150 pointer-events-none select-none
          ${floating
            ? "top-1.5 text-[10px] font-semibold tracking-wide"
            : "top-1/2 -translate-y-1/2 text-sm"
          }
          ${error ? "text-red-400" : focused ? "text-blue-300" : "text-white/40"}
        `}
      >
        {label}
      </label>
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const { ref: cardRef, onMouseMove: cardMove, onMouseLeave: cardLeave, glowStyle } = useGlow({
    color: "255,255,255",
    size: 300,
    opacity: 0.06,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos. Verificá tus datos e intentá de nuevo.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="login-bg min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Animated smokey background */}
      <SmokeyCanvas />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-[400px] z-10">
        {/* Glass card */}
        <div
          ref={cardRef}
          className="rounded-2xl border border-white/12 p-8 overflow-hidden relative"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          onMouseMove={cardMove}
          onMouseLeave={cardLeave}
        >
          <div aria-hidden style={glowStyle} />
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/30 mb-4">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Gesting PMS</h1>
            <p className="text-sm text-white/50 mt-1">Gestión profesional de alquileres</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <FloatingInput
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => { setForm({ ...form, email: v }); setError(""); }}
              disabled={loading}
              error={!!error}
            />

            <FloatingInput
              id="password"
              label="Contraseña"
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(v) => { setForm({ ...form, password: v }); setError(""); }}
              disabled={loading}
              error={!!error}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/15 border border-red-400/30">
                <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="
                w-full mt-2 h-10 flex items-center justify-center gap-2 rounded-lg
                bg-blue-500 hover:bg-blue-400 active:bg-blue-600
                text-white text-sm font-semibold
                transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-blue-500/25
              "
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar al sistema
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-5 pt-5 border-t border-white/8 text-center">
            <p className="text-xs text-white/30">
              ¿Olvidaste tu contraseña? Contactá al administrador del sistema.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/25 mt-5">
          Gesting PMS · Sistema de gestión de alquileres · Argentina
        </p>
      </div>
    </div>
  );
}
