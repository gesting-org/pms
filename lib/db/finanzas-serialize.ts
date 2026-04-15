/**
 * Serialization for financial management (Gestión Financiera) data.
 * Converts Prisma CompanyExpense objects to plain JS for client components.
 */

import type { CompanyExpense as PrismaCompanyExpense } from "@prisma/client";

function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  return parseFloat(String(v));
}

function toDateStr(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

export interface SerializedCompanyExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

export function serializeCompanyExpense(e: PrismaCompanyExpense): SerializedCompanyExpense {
  return {
    id: e.id,
    category: e.category as string,
    description: e.description,
    amount: toNum(e.amount),
    date: toDateStr(e.date),
    receiptUrl: e.receiptUrl ?? undefined,
    notes: e.notes ?? undefined,
    createdAt: toDateStr(e.createdAt),
  };
}
