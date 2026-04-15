"use client";

import { formatARSShort } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface ProfitWaterfallProps {
  grossTotal: number;
  platformFees: number;
  ownerPaid: number;
  companyRevenue: number;
  netProfit: number;
}

export function ProfitWaterfall({
  grossTotal,
  platformFees,
  ownerPaid,
  companyRevenue,
  netProfit,
}: ProfitWaterfallProps) {
  const steps = [
    {
      label: "Ingreso bruto",
      value: grossTotal,
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bg: "bg-blue-50 border-blue-200",
      desc: "Total reservas",
    },
    {
      label: "− Fees plataforma",
      value: -platformFees,
      color: "bg-slate-400",
      textColor: "text-slate-600",
      bg: "bg-slate-50 border-slate-200",
      desc: "Airbnb, Booking, etc.",
    },
    {
      label: "Propietarios",
      value: ownerPaid,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
      desc: "Liquidado / pagado",
    },
    {
      label: "Comisión Gesting",
      value: companyRevenue,
      color: "bg-violet-500",
      textColor: "text-violet-700",
      bg: "bg-violet-50 border-violet-200",
      desc: "Revenue empresa",
    },
    {
      label: "Utilidad neta",
      value: netProfit,
      color: netProfit >= 0 ? "bg-violet-700" : "bg-rose-500",
      textColor: netProfit >= 0 ? "text-violet-900" : "text-rose-700",
      bg: netProfit >= 0 ? "bg-violet-50 border-violet-300" : "bg-rose-50 border-rose-200",
      desc: "Empresa − gastos",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Flujo financiero del período
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            <div className={`rounded-xl border px-3 py-2 min-w-[100px] ${step.bg}`}>
              <p className="text-[10px] text-slate-500 leading-none mb-1">{step.label}</p>
              <p className={`text-sm font-bold tabular-nums ${step.textColor}`}>
                {step.value < 0 ? `-${formatARSShort(Math.abs(step.value))}` : formatARSShort(step.value)}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
