import { clsx, type ClassValue } from "clsx";
import crypto from "crypto";
import { twMerge } from "tailwind-merge";
import { format, addDays, isWeekend } from "date-fns";
import { es } from "date-fns/locale";

// ─── Booking code generator ───────────────────────────────────────────────────

const BOOKING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no 0/O/1/I/l

export function generateBookingCode(): string {
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes).map((b) => BOOKING_ALPHABET[b % 32]).join("");
}

// ─── Tailwind class merge ──────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Formateo de moneda argentina ─────────────────────────────────────────────

export function formatARS(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(num);
}

// ─── Formateo de fechas Argentina DD/MM/YYYY ──────────────────────────────────

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: es });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
}

// ─── Días hábiles Argentina ───────────────────────────────────────────────────

const FERIADOS_FIJOS = [
  "01-01", "02-24", "02-25", "03-24", "04-02",
  "05-01", "05-25", "06-17", "06-20", "07-09",
  "08-17", "10-12", "11-20", "12-08", "12-25",
];

function isFeriado(date: Date): boolean {
  return FERIADOS_FIJOS.includes(format(date, "MM-dd"));
}

function isDiaHabil(date: Date): boolean {
  return !isWeekend(date) && !isFeriado(date);
}

function getNthBusinessDay(year: number, month: number, n: number): Date {
  let date = new Date(year, month - 1, 1);
  let count = 0;
  while (count < n) {
    if (isDiaHabil(date)) count++;
    if (count < n) date = addDays(date, 1);
  }
  return date;
}

export function getLiquidationDueDate(year: number, month: number): Date {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return getNthBusinessDay(nextYear, nextMonth, 5);
}

// ─── Noches entre fechas ──────────────────────────────────────────────────────

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const ci = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const co = typeof checkOut === "string" ? new Date(checkOut) : checkOut;
  return Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const PLATFORM_LABELS: Record<string, string> = {
  AIRBNB: "Airbnb",
  BOOKING: "Booking.com",
  DIRECT: "Directo",
  OTHER: "Otro",
};

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export const LIQUIDATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  SENT: "Enviada",
  PAID: "Pagada",
  OVERDUE: "Mora",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  CLEANING: "Limpieza",
  LAUNDRY: "Lavandería",
  SUPPLIES: "Insumos",
  REPAIR: "Reparación",
  UTILITY: "Servicios",
  MAINTENANCE: "Mantenimiento",
  OTHER: "Otro",
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  CLEANING: "Limpieza",
  MAINTENANCE: "Mantenimiento",
  INSPECTION: "Inspección",
  RESTOCKING: "Reposición",
  REPAIR: "Reparación",
  OTHER: "Otro",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const COMPANY_EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  MARKETING: "Marketing",
  SOFTWARE: "Software",
  SALARY: "Sueldos",
  SUBSCRIPTION: "Suscripciones",
  TOOLS: "Herramientas",
  HONORARIOS: "Honorarios",
  OFFICE: "Oficina",
  OTHER: "Otro",
};

// ─── Formato corto de moneda (para gráficos) ──────────────────────────────────

export function formatARSShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}
