"use client";

import { Topbar } from "@/components/layout/topbar";
import { DollarSign } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Pagos" subtitle="Gestión de cobros" />
      <div className="p-4 md:p-6 animate-fade-in flex flex-col items-center justify-center py-20 text-muted-foreground">
        <DollarSign className="h-12 w-12 opacity-20 mb-3" />
        <p className="text-sm font-medium">Módulo de pagos</p>
        <p className="text-xs mt-1">Los pagos se gestionan desde las liquidaciones</p>
      </div>
    </div>
  );
}
