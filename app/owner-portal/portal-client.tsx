"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Owner, Property, ManagementContract, Reservation, Liquidation, Expense, Task } from "@/lib/mock/data";
import { OwnerPortalClient as PortalContent } from "./[token]/owner-portal-client";
import { Building2, Key, LogOut, X, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  owner: Owner;
  properties: Property[];
  contracts: ManagementContract[];
  reservations: Reservation[];
  liquidations: Liquidation[];
  expenses: Expense[];
  tasks: Task[];
  mustChangePassword: boolean;
}

/* ─── Change Password Modal ─────────────────────────────────────────── */
function ChangePasswordModal({
  isFirstTime,
  onClose,
  onSuccess,
}: {
  isFirstTime: boolean;
  onClose?: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.newPass.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (form.newPass !== form.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/owner-portal/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: isFirstTime ? undefined : form.current,
          newPassword: form.newPass,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Error al cambiar contraseña");
        setLoading(false);
        return;
      }
      setDone(true);
      setTimeout(() => onSuccess(), 1200);
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-800">
              {isFirstTime ? "Crear tu contraseña" : "Cambiar contraseña"}
            </h2>
            {isFirstTime && (
              <p className="text-xs text-stone-400 mt-0.5">Por seguridad, creá tu contraseña personal antes de continuar.</p>
            )}
          </div>
          {!isFirstTime && onClose && (
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="px-6 py-5">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-stone-800">¡Contraseña actualizada!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isFirstTime && (
                <PasswordField
                  label="Contraseña actual"
                  value={form.current}
                  show={show.current}
                  onChange={(v) => setForm({ ...form, current: v })}
                  onToggle={() => setShow({ ...show, current: !show.current })}
                />
              )}
              <PasswordField
                label="Nueva contraseña"
                value={form.newPass}
                show={show.new}
                onChange={(v) => setForm({ ...form, newPass: v })}
                onToggle={() => setShow({ ...show, new: !show.new })}
                hint="Mínimo 8 caracteres"
              />
              <PasswordField
                label="Confirmar contraseña"
                value={form.confirm}
                show={show.confirm}
                onChange={(v) => setForm({ ...form, confirm: v })}
                onToggle={() => setShow({ ...show, confirm: !show.confirm })}
              />

              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !form.newPass || !form.confirm || (!isFirstTime && !form.current)}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</>
                  : "Guardar contraseña"
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, show, onChange, onToggle, hint }: {
  label: string; value: string; show: boolean;
  onChange: (v: string) => void; onToggle: () => void; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 px-3.5 pr-10 rounded-xl border border-stone-200 text-sm text-stone-800 bg-stone-50 focus:bg-white focus:border-stone-400 focus:outline-none transition-colors"
          placeholder="••••••••"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors" tabIndex={-1}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="text-[10px] text-stone-400 mt-1">{hint}</p>}
    </div>
  );
}

/* ─── Root wrapper ──────────────────────────────────────────────────── */
export function OwnerPortalClient({ mustChangePassword, ...props }: Props) {
  const router = useRouter();
  const [showChangePass, setShowChangePass] = useState(false);
  const [forceChange, setForceChange] = useState(mustChangePassword);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/owner-portal/logout", { method: "POST" });
    router.push("/owner-portal/login");
  }

  function handlePasswordSuccess() {
    setForceChange(false);
    setShowChangePass(false);
    router.refresh();
  }

  return (
    <>
      {/* Force password change on first login */}
      {forceChange && (
        <ChangePasswordModal isFirstTime onClose={undefined} onSuccess={handlePasswordSuccess} />
      )}

      {/* Voluntary change password */}
      {!forceChange && showChangePass && (
        <ChangePasswordModal isFirstTime={false} onClose={() => setShowChangePass(false)} onSuccess={handlePasswordSuccess} />
      )}

      {/* The portal content — pass logout/change-pass as action buttons to inject into header */}
      <PortalContentWithActions
        {...props}
        onChangePassword={() => setShowChangePass(true)}
        onLogout={logout}
        loggingOut={loggingOut}
      />
    </>
  );
}

/* ─── Wrapper that injects action buttons into the portal ───────────── */
function PortalContentWithActions({
  onChangePassword,
  onLogout,
  loggingOut,
  ...props
}: {
  onChangePassword: () => void;
  onLogout: () => void;
  loggingOut: boolean;
} & Omit<Props, "mustChangePassword">) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f6f3" }}>
      {/* Header */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-stone-800 tracking-tight">Gesting</span>
              <span className="text-stone-300 text-xs">|</span>
              <span className="text-xs text-stone-400 font-medium hidden sm:block">Portal propietario</span>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-stone-700">{props.owner.firstName} {props.owner.lastName}</p>
                  <p className="text-[10px] text-stone-400">{props.owner.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {props.owner.firstName[0]}{props.owner.lastName[0]}
                </div>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-10 z-20 w-52 bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-700 truncate">{props.owner.firstName} {props.owner.lastName}</p>
                      <p className="text-[10px] text-stone-400 truncate">{props.owner.email}</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); onChangePassword(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 transition-colors text-left"
                    >
                      <Key className="h-4 w-4 text-stone-400" />
                      Cambiar contraseña
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); onLogout(); }}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left border-t border-stone-100"
                    >
                      <LogOut className="h-4 w-4" />
                      {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Portal content — header suppressed, we use our own above */}
      <PortalContent {...props} hideHeader />
    </div>
  );
}
