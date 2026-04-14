import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatARS, RESERVATION_STATUS_LABELS } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface RecentReservation {
  id: string;
  checkIn: string;
  checkOut: string;
  grossAmount: number;
  status: string;
  platform: string;
  property: { name: string; colorTag: string };
  guest: { firstName: string; lastName: string };
}

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "info" | "secondary" | "destructive"> = {
  CONFIRMED: "info",
  IN_PROGRESS: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export function RecentReservations({ reservations }: { reservations: RecentReservation[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EBEBEB] shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBEBEB]">
        <h2 className="text-[15px] font-semibold text-[#222222]">Últimas reservas</h2>
        <Link href="/reservations" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {reservations.length === 0 ? (
        <p className="text-sm text-[#717171] text-center py-10">No hay reservas aún</p>
      ) : (
        <div className="divide-y divide-[#EBEBEB]">
          {reservations.map((r) => (
            <Link
              key={r.id}
              href={`/reservations/${r.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-[#F7F7F7] transition-colors group"
            >
              {/* Avatar con inicial del huésped */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ backgroundColor: r.property.colorTag }}
              >
                {r.guest.firstName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#222222] truncate">
                  {r.guest.firstName} {r.guest.lastName}
                </p>
                <p className="text-xs text-[#717171] truncate mt-0.5">
                  {r.property.name} · {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                </p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-sm font-bold text-[#222222]">{formatARS(r.grossAmount)}</p>
                <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"} className="text-[10px]">
                  {RESERVATION_STATUS_LABELS[r.status] ?? r.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
