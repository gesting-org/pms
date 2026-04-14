"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Category2,
  Buildings2,
  Profile2User,
  Calendar,
  TaskSquare,
  MessageText,
  Setting2,
  LogoutCurve,
  Home2,
  DocumentText,
  Wallet3,
  DocumentCloud,
  MoneyRecive,
  Global,
  ShoppingBag,
} from "iconsax-react";

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Dashboard",          icon: Category2 },
  { href: "/properties",         label: "Propiedades",         icon: Buildings2 },
  { href: "/owners",             label: "Propietarios",        icon: Home2 },
  { href: "/reservations",       label: "Inquilinos",          icon: Profile2User },
  { href: "/contracts",          label: "Contratos",           icon: DocumentText },
  { href: "/liquidations",       label: "Pagos y Finanzas",    icon: MoneyRecive },
  { href: "/calendar",           label: "Calendario",          icon: Calendar },
  { href: "/tasks",              label: "Tareas",              icon: TaskSquare },
  { href: "/orders",             label: "Pedidos",             icon: ShoppingBag },
  { href: "/documents",          label: "Documentos",          icon: DocumentCloud },
  { href: "/messages",           label: "Mensajes",            icon: MessageText },
  { href: "/owner-portal/login", label: "Portal Propietario",  icon: Global, external: true },
  { href: "/settings",           label: "Configuración",       icon: Setting2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const name = session?.user?.name ?? "Administrador";
  const email = session?.user?.email ?? "admin@gesting.com";
  const initials = name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();

  return (
    <aside className="hidden md:flex flex-col h-screen w-[210px] shrink-0 bg-[#111827] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.06] shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/40 animate-pulse-glow">
          <Buildings2 size={14} color="white" variant="Bold" />
        </div>
        <span className="text-[14px] font-bold text-white tracking-tight">Gesting PMS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const isActive = !item.external && (pathname === item.href || pathname.startsWith(item.href + "/"));
          const cls = cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative overflow-hidden",
            isActive
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.07]"
          );
          const inner = (
            <>
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
              )}
              <item.icon
                size={16}
                color={isActive ? "#ffffff" : "currentColor"}
                variant={isActive ? "Bulk" : "Linear"}
                className="shrink-0 transition-all duration-200"
              />
              <span className="truncate relative z-10">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 animate-pulse" />
              )}
            </>
          );
          return item.external ? (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
              {inner}
            </a>
          ) : (
            <Link key={item.href} href={item.href} className={cls}>
              {inner}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-white/[0.06] space-y-1">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="group flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[13px] font-medium text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
        >
          <LogoutCurve
            size={16}
            color="currentColor"
            variant="Linear"
            className="shrink-0 transition-all duration-200 group-hover:translate-x-0.5"
          />
          <span>Cerrar sesión</span>
        </button>

        {/* User card */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] mt-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 ring-2 ring-white/10">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white/90 leading-none truncate">{name}</p>
            <p className="text-[10px] text-white/30 leading-none mt-0.5 truncate">{email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ── Mobile bottom nav ─────────────────────────── */
const MOBILE_NAV = [
  { href: "/dashboard",    label: "Inicio",   icon: Category2 },
  { href: "/properties",   label: "Props.",    icon: Buildings2 },
  { href: "/reservations", label: "Reservas",  icon: Calendar },
  { href: "/liquidations", label: "Finanzas",  icon: MoneyRecive },
  { href: "/tasks",        label: "Tareas",    icon: TaskSquare },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200/60 shadow-[0_-2px_12px_rgba(16,24,40,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {MOBILE_NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl transition-all min-w-[60px] relative",
                isActive ? "text-blue-600" : "text-slate-400 active:text-slate-600"
              )}
            >
              {isActive && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
              )}
              <item.icon
                size={24}
                color="currentColor"
                variant={isActive ? "Bulk" : "Linear"}
                className={cn("transition-all duration-200", isActive && "scale-110")}
              />
              <span className={cn(
                "text-[11px] leading-none transition-all",
                isActive ? "font-bold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
