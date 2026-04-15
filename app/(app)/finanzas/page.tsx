export const revalidate = 30;

import { Topbar } from "@/components/layout/topbar";
import { getFinancialData, getCompanyExpenses } from "@/lib/db/finanzas-queries";
import { getLiquidations, getExpenses, getProperties } from "@/lib/db/queries";
import { serializeLiquidation, serializeExpense, serializeProperty } from "@/lib/db/serialize";
import { serializeCompanyExpense } from "@/lib/db/finanzas-serialize";
import { FinanzasShell } from "./components/finanzas-shell";

export const metadata = { title: "Gestión Financiera" };

export default async function FinanzasPage() {
  const [financialData, rawLiquidations, rawExpenses, rawProperties, rawCompanyExpenses] =
    await Promise.all([
      getFinancialData(),
      getLiquidations(),
      getExpenses(),
      getProperties(),
      getCompanyExpenses(),
    ]);

  const liquidations = rawLiquidations.map((l) => serializeLiquidation(l as any));
  const expenses = rawExpenses.map((e) => serializeExpense(e as any));
  const properties = rawProperties.map((p) => serializeProperty(p as any));
  const companyExpenses = rawCompanyExpenses.map(serializeCompanyExpense);

  const now = new Date();

  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title="Gestión Financiera"
        subtitle={`${financialData.activeProperties} propiedades activas`}
      />
      <div className="p-4 md:p-6 animate-fade-in">
        <FinanzasShell
          financialData={financialData}
          liquidations={liquidations as any}
          expenses={expenses as any}
          properties={properties as any}
          companyExpenses={companyExpenses}
          currentYear={now.getFullYear()}
          currentMonth={now.getMonth() + 1}
        />
      </div>
    </div>
  );
}
