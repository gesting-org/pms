import Link from "next/link";
import { FileText, DollarSign, ArrowRight } from "lucide-react";

interface AlertsPanelProps {
  pendingLiquidations: number;
  expiringContracts: number;
}

export function AlertsPanel({ pendingLiquidations, expiringContracts }: AlertsPanelProps) {
  const alerts = [
    pendingLiquidations > 0 && {
      href: "/liquidations",
      icon: DollarSign,
      message: `${pendingLiquidations} liquidación${pendingLiquidations > 1 ? "es" : ""} pendiente${pendingLiquidations > 1 ? "s" : ""} de pago`,
    },
    expiringContracts > 0 && {
      href: "/contracts",
      icon: FileText,
      message: `${expiringContracts} contrato${expiringContracts > 1 ? "s" : ""} próximo${expiringContracts > 1 ? "s" : ""} a vencer`,
    },
  ].filter(Boolean) as { href: string; icon: any; message: string }[];

  return (
    <div
      className="rounded-2xl border-l-4 px-5 py-4 space-y-2"
      style={{ backgroundColor: "#FFF8E7", borderLeftColor: "#F59E0B", borderWidth: "1px", borderLeftWidth: "4px", borderColor: "#FDE68A" }}
    >
      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Requiere atención</p>
      <div className="space-y-1.5">
        {alerts.map((alert) => (
          <Link
            key={alert.href}
            href={alert.href}
            className="flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-2.5">
              <alert.icon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-sm text-amber-900 font-medium">{alert.message}</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
