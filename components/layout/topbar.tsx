"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SearchNormal1, Notification, ArrowRight2 } from "iconsax-react";

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard:    "Dashboard",
  properties:   "Propiedades",
  owners:       "Propietarios",
  reservations: "Reservas",
  contracts:    "Contratos",
  finanzas:     "Gestión Financiera",
  liquidations: "Liquidaciones",
  expenses:     "Gastos",
  analytics:    "Analíticas",
  calendar:     "Calendario",
  tasks:        "Tareas",
  orders:       "Pedidos",
  messages:     "Mensajes",
  settings:     "Configuración",
  new:          "Nuevo",
  edit:         "Editar",
};

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_MAP[seg] ?? (seg.length === 36 ? "Detalle" : seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  const initials = (session?.user?.name ?? "Admin")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const name = session?.user?.name ?? "Administrador";

  return (
    <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-6 gap-3 sticky top-0 z-40 shrink-0 shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
      {/* Left: breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0 flex-1">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && (
              <ArrowRight2
                size={12}
                color="currentColor"
                variant="Linear"
                className="text-slate-300 shrink-0 hidden sm:block"
              />
            )}
            {c.isLast ? (
              <span className={cn(
                "font-semibold text-slate-800 truncate",
                i === 0 ? "text-base sm:text-sm" : "text-sm"
              )}>
                {title ?? c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="text-slate-400 hover:text-slate-700 transition-colors truncate font-medium hidden sm:block"
              >
                {c.label}
              </Link>
            )}
          </span>
        ))}
        {subtitle && (
          <span className="text-slate-400 hidden md:block ml-0.5 font-normal text-sm">
            — {subtitle}
          </span>
        )}
      </nav>

      {/* Center: search */}
      <div className="hidden md:flex flex-1 justify-center max-w-xs mx-4">
        <div className="relative w-full group">
          <SearchNormal1
            size={14}
            color="currentColor"
            variant="Linear"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-500"
          />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 h-9 text-sm bg-slate-100/80 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white placeholder:text-slate-400 text-slate-700 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 shrink-0">
        {actions}

        {/* Search — mobile only */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
          aria-label="Buscar"
        >
          <SearchNormal1 size={18} color="currentColor" variant="Linear" />
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all group"
          aria-label="Notificaciones"
        >
          <Notification
            size={18}
            color="currentColor"
            variant="Linear"
            className="transition-transform duration-300 group-hover:rotate-12"
          />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 ml-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0 ring-2 ring-white shadow-sm hover:ring-blue-300 transition-all duration-200 cursor-pointer">
            {initials}
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-slate-800 leading-none">{name}</p>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  );
}
