// Type definitions for PMS entities.
// These are used as type annotations across client components.
// Runtime data comes from Supabase via Prisma (lib/db/queries.ts).

export type Platform         = "AIRBNB" | "BOOKING" | "DIRECT" | "OTHER";
export type PropertyStatus   = "ACTIVE" | "MAINTENANCE" | "PAUSED" | "INACTIVE";
export type ReservationStatus = "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type LiquidationStatus = "PENDING" | "SENT" | "PAID" | "OVERDUE";
export type TaskStatus       = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskPriority     = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskType         = "CLEANING" | "MAINTENANCE" | "INSPECTION" | "RESTOCKING" | "REPAIR" | "OTHER";
export type ExpenseCategory  = "CLEANING" | "LAUNDRY" | "SUPPLIES" | "REPAIR" | "UTILITY" | "MAINTENANCE" | "OTHER";
export type ExpenseStatus    = "PENDING" | "ADVANCED_BY_GESTING" | "DEDUCTED" | "REIMBURSED";
export type MessageChannel   = "EMAIL" | "WHATSAPP" | "SISTEMA";

export interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuit?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  bankName?: string;
  bankAccount?: string;
  bankAlias?: string;
  portalToken?: string | null;
  portalTokenExp?: string | null;
  portalPassword?: string | null; // only present as boolean indicator (never the hash)
  mustChangePassword?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface PropertyPlatform {
  id: string;
  platform: Platform;
  listingUrl?: string;
  externalId?: string;
  isActive: boolean;
}

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  province: string;
  description?: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  platforms: PropertyPlatform[];
  status: PropertyStatus;
  colorTag: string;
  commissionRate: number;
  cleaningFee: number;
  nightlyRate: number;
  notes?: string;
  createdAt: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality?: string;
  dni?: string;
  notes?: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  propertyId: string;
  guestId: string;
  platform: Platform;
  externalId?: string;
  checkIn: string;
  checkInTime?: string;
  checkOut: string;
  checkOutTime?: string;
  nights: number;
  adults: number;
  children: number;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  cleaningFee: number;
  commissionAmount: number;
  netToOwner: number;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
}

export interface Liquidation {
  id: string;
  propertyId: string;
  ownerId: string;
  periodLabel: string;
  periodYear: number;
  periodMonth: number;
  reservationIds: string[];
  grossRevenue: number;
  totalExpenses: number;
  commissionAmount: number;
  netToOwner: number;
  dueDate: string;
  paidDate?: string;
  status: LiquidationStatus;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  propertyId: string;
  reservationId?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  notes?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  propertyId: string;
  reservationId?: string;
  type: TaskType;
  title: string;
  description?: string;
  priority: TaskPriority;
  scheduledDate: string;
  completedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  provider?: string;
  status: TaskStatus;
  createdAt: string;
}

export interface ManagementContract {
  id: string;
  propertyId: string;
  ownerId: string;
  ownerFullName: string;
  ownerDni: string;
  ownerCuit?: string;
  ownerAddress?: string;
  propertyAddress: string;
  commissionRate: number;
  startDate: string;
  endDate: string;
  durationMonths: number;
  city: string;
  gestingRepName: string;
  contractNumber: string;
  specialClauses?: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "TERMINATED";
  signedAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  guestId?: string;
  reservationId?: string;
  propertyId?: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: MessageChannel;
  subject: string;
  body: string;
  isRead: boolean;
  sentAt: string;
}
