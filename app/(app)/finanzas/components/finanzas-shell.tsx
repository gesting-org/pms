"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PeriodSelector } from "./period-selector";
import { ResumenTab } from "./tabs/resumen-tab";
import { IngresosTab } from "./tabs/ingresos-tab";
import { GastosTab } from "./tabs/gastos-tab";
import { LiquidacionesTab } from "./tabs/liquidaciones-tab";
import { AnaliticaTab } from "./tabs/analitica-tab";
import type { FinancialData } from "@/lib/db/finanzas-queries";
import type { SerializedCompanyExpense } from "@/lib/db/finanzas-serialize";
import { Loader2 } from "lucide-react";

interface FinanzasShellProps {
  financialData: FinancialData;
  liquidations: any[];
  expenses: any[];
  properties: any[];
  companyExpenses: SerializedCompanyExpense[];
  currentYear: number;
  currentMonth: number;
}

export function FinanzasShell({
  financialData: initialData,
  liquidations,
  expenses,
  companyExpenses: initialCompanyExpenses,
  currentYear,
  currentMonth,
}: FinanzasShellProps) {
  const [data, setData] = useState<FinancialData>(initialData);
  const [companyExpenses, setCompanyExpenses] = useState(initialCompanyExpenses);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(0); // 0 = all months
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("resumen");

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: String(y) });
      if (m > 0) params.set("month", String(m));
      const [finRes, expRes] = await Promise.all([
        fetch(`/api/finanzas?${params}`),
        fetch(`/api/finanzas/company-expenses?${params}`),
      ]);
      if (finRes.ok) {
        const json = await finRes.json();
        if (json.ok) setData(json.data);
      }
      if (expRes.ok) {
        const json = await expRes.json();
        if (json.ok) setCompanyExpenses(json.data);
      }
    } catch (err) {
      console.error("[FinanzasShell] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleYearChange(y: number) {
    setYear(y);
    fetchData(y, month);
  }

  function handleMonthChange(m: number) {
    setMonth(m);
    fetchData(year, m);
  }

  return (
    <div className="space-y-5">
      {/* Global period filter */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <PeriodSelector
            year={year}
            month={month}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
            loading={loading}
          />
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Actualizando...
            </div>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="h-9 text-sm shrink-0 w-full sm:w-auto">
            <TabsTrigger value="resumen" className="text-xs px-3">Resumen</TabsTrigger>
            <TabsTrigger value="ingresos" className="text-xs px-3">Ingresos</TabsTrigger>
            <TabsTrigger value="gastos" className="text-xs px-3">Gastos</TabsTrigger>
            <TabsTrigger value="liquidaciones" className="text-xs px-3">Liquidaciones</TabsTrigger>
            <TabsTrigger value="analitica" className="text-xs px-3">Analítica</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resumen" className="mt-0">
          <ResumenTab data={data} />
        </TabsContent>

        <TabsContent value="ingresos" className="mt-0">
          <IngresosTab data={data} />
        </TabsContent>

        <TabsContent value="gastos" className="mt-0">
          <GastosTab
            companyExpenses={companyExpenses}
            propertyExpenses={expenses}
            companyRevenue={data.companyRevenue}
            netProfit={data.netProfit}
          />
        </TabsContent>

        <TabsContent value="liquidaciones" className="mt-0">
          <LiquidacionesTab
            liquidations={liquidations}
            summary={data.liquidationSummary}
          />
        </TabsContent>

        <TabsContent value="analitica" className="mt-0">
          <AnaliticaTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
