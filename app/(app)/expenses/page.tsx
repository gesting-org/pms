import { Topbar } from "@/components/layout/topbar";
import { getExpenses, getProperties } from "@/lib/db/queries";
import { serializeExpense, serializeProperty } from "@/lib/db/serialize";
import { ExpensesList } from "./components/expenses-list";

export const metadata = { title: "Gastos operativos" };

export default async function ExpensesPage({ searchParams }: { searchParams: { propertyId?: string } }) {
  const [rawExpenses, rawProperties] = await Promise.all([getExpenses(), getProperties()]);

  const expenses = rawExpenses
    .filter((e) => !searchParams.propertyId || e.propertyId === searchParams.propertyId)
    .map((e) => serializeExpense(e as any));

  const properties = rawProperties.map((p) => serializeProperty(p as any));

  const totalAdvanced = rawExpenses
    .filter((e) => e.status === "ADVANCED_BY_GESTING")
    .reduce((s, e) => s + parseFloat(String(e.amount)), 0);

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Gastos operativos" subtitle={`${expenses.length} gastos registrados`} />
      <div className="p-4 md:p-6 animate-fade-in">
        <ExpensesList expenses={expenses as any} properties={properties as any} totalAdvanced={totalAdvanced} />
      </div>
    </div>
  );
}
