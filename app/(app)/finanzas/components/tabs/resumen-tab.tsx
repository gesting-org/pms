"use client";

import { formatARS, formatARSShort } from "@/lib/utils";
import { FinancialKpiCard } from "../financial-kpi-card";
import { ProfitWaterfall } from "../profit-waterfall";
import type { FinancialData } from "@/lib/db/finanzas-queries";
import {
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Percent,
  Moon,
  BadgeDollarSign,
  Wallet,
} from "lucide-react";

interface ResumenTabProps {
  data: FinancialData;
}

export function ResumenTab({ data }: ResumenTabProps) {
  const {
    grossTotal,
    grossThisMonth,
    ownerPaid,
    ownerPending,
    companyRevenue,
    companyExpensesTotal,
    netProfit,
    margin,
    totalReservations,
    totalNights,
    activeProperties,
    platformFeeTotal,
  } = data;

  return (
    <div className="space-y-6">
      {/* Universe separation header */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-center">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Universe 1</p>
          <p className="text-xs font-semibold text-blue-800 mt-0.5">Reservas</p>
          <p className="text-[10px] text-blue-500 mt-0.5">Flujo bruto total</p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-center">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Universe 2</p>
          <p className="text-xs font-semibold text-emerald-800 mt-0.5">Propietario</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">Lo que les corresponde</p>
        </div>
        <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-2 text-center">
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Universe 3</p>
          <p className="text-xs font-semibold text-violet-800 mt-0.5">Empresa</p>
          <p className="text-[10px] text-violet-500 mt-0.5">Lo que gana Gesting</p>
        </div>
      </div>

      {/* KPI grid — 3 columns per universe */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Universe 1 — Reservas */}
        <FinancialKpiCard
          universe="reservas"
          label="Ingreso bruto total"
          value={formatARSShort(grossTotal)}
          sub={`${totalReservations} reservas · ${totalNights} noches`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <FinancialKpiCard
          universe="reservas"
          label="Ingreso bruto este mes"
          value={formatARSShort(grossThisMonth)}
          sub="Reservas completadas / en curso"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <FinancialKpiCard
          universe="reservas"
          label="Fees plataformas"
          value={formatARSShort(platformFeeTotal)}
          sub="Airbnb, Booking, etc."
          icon={<BadgeDollarSign className="h-4 w-4" />}
        />

        {/* Universe 2 — Propietario */}
        <FinancialKpiCard
          universe="propietario"
          label="Total liquidado a propietarios"
          value={formatARSShort(ownerPaid)}
          sub="Liquidaciones PAID"
          icon={<Users className="h-4 w-4" />}
        />
        <FinancialKpiCard
          universe="propietario"
          label="Pendiente propietarios"
          value={formatARSShort(ownerPending)}
          sub="PENDING + SENT + OVERDUE"
          icon={<Wallet className="h-4 w-4" />}
          trend={ownerPending > 0 ? -1 : 0}
          trendLabel={ownerPending > 0 ? "Requiere atención" : "Al día"}
        />
        <FinancialKpiCard
          universe="propietario"
          label="Propiedades activas"
          value={String(activeProperties)}
          sub="En gestión"
          icon={<Building2 className="h-4 w-4" />}
        />

        {/* Universe 3 — Empresa */}
        <FinancialKpiCard
          universe="empresa"
          label="Revenue empresa"
          value={formatARSShort(companyRevenue)}
          sub="Comisiones cobradas (PAID)"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <FinancialKpiCard
          universe="empresa"
          label="Gastos empresa"
          value={formatARSShort(companyExpensesTotal)}
          sub="Marketing, software, sueldos, etc."
          icon={<Moon className="h-4 w-4" />}
          trend={companyExpensesTotal > companyRevenue ? -1 : 1}
          trendLabel={`${companyExpensesTotal > 0 ? Math.round((companyExpensesTotal / Math.max(companyRevenue, 1)) * 100) : 0}% del revenue`}
        />
        <FinancialKpiCard
          universe="empresa"
          label="Utilidad neta empresa"
          value={formatARSShort(netProfit)}
          sub={`Margen: ${margin}%`}
          icon={<Percent className="h-4 w-4" />}
          trend={netProfit >= 0 ? 1 : -1}
          trendLabel={netProfit >= 0 ? `+${margin}% margen` : `${margin}% margen`}
        />
      </div>

      {/* Profit waterfall */}
      <ProfitWaterfall
        grossTotal={grossTotal}
        platformFees={platformFeeTotal}
        ownerPaid={ownerPaid}
        companyRevenue={companyRevenue}
        netProfit={netProfit}
      />

      {/* Important disclaimer */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
        <p className="text-xs font-semibold text-amber-800 mb-1">Regla financiera clave</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          Los gastos operativos de las propiedades (limpieza, mantenimiento, insumos, amenities) son
          gastos del <strong>propietario</strong> y se descuentan en la liquidación correspondiente.{" "}
          <strong>No impactan en la utilidad de Gesting.</strong> Solo se consideran gastos de empresa
          los costos propios: marketing, software, sueldos, honorarios, suscripciones y estructura operativa.
        </p>
      </div>
    </div>
  );
}
