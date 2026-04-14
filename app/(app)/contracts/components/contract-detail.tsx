"use client";

import Link from "next/link";
import { ManagementContract, Property, Owner } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, Building2, User, Calendar,
  Download, AlertTriangle, Check, FileText, Percent,
} from "lucide-react";

function formatDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

type ContractStatus = ManagementContract["status"];

const STATUS_STYLE: Record<ContractStatus, { pill: string; label: string }> = {
  DRAFT:         { pill: "pill-draft",    label: "Borrador"    },
  ACTIVE:        { pill: "pill-active",   label: "Activo"      },
  EXPIRING_SOON: { pill: "pill-warning",  label: "Por vencer"  },
  EXPIRED:       { pill: "pill-danger",   label: "Vencido"     },
  TERMINATED:    { pill: "pill-inactive", label: "Rescindido"  },
};

interface Props {
  contract: ManagementContract;
  property: Property;
  owner: Owner;
}

export function ContractDetail({ contract: c, property, owner }: Props) {
  const daysLeft    = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000);
  const statusStyle = STATUS_STYLE[c.status];

  return (
    <div className="space-y-5">
      <Link href="/contracts" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />Volver a contratos
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-border shadow-xs p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-bold font-mono text-foreground">{c.contractNumber}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{property.name} · {property.address}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("pill", statusStyle.pill)}>{statusStyle.label}</span>
            <Button size="sm" variant="outline">
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
          </div>
        </div>

        {/* Alerta */}
        {(c.status === "EXPIRING_SOON" || c.status === "EXPIRED") && (
          <div className={cn(
            "flex items-center gap-3 mt-4 p-3 rounded-lg text-sm",
            c.status === "EXPIRED"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-amber-50 border border-amber-200 text-amber-700"
          )}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {c.status === "EXPIRING_SOON"
              ? `Este contrato vence en ${daysLeft} días (${formatDate(c.endDate)}). Considerá renovarlo.`
              : `Este contrato venció el ${formatDate(c.endDate)}.`
            }
          </div>
        )}

        {/* Summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Comisión Gesting</p>
            <p className="text-base font-bold text-primary mt-0.5">{c.commissionRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duración</p>
            <p className="text-base font-bold text-foreground mt-0.5">{c.durationMonths} meses</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ciudad</p>
            <p className="text-base font-bold text-foreground mt-0.5">{c.city}</p>
          </div>
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Propiedad */}
        <div className="bg-white rounded-xl border border-border shadow-xs p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-3">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Propiedad</p>
          </div>
          <Link href={`/properties/${property.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors block">
            {property.name}
          </Link>
          <p className="text-xs text-muted-foreground">{property.address}, {property.city}</p>
          <p className="text-xs text-muted-foreground">{property.bedrooms} hab. · {property.bathrooms} baño{property.bathrooms > 1 ? "s" : ""} · {property.maxGuests} huésp. máx.</p>
        </div>

        {/* Propietario */}
        <div className="bg-white rounded-xl border border-border shadow-xs p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-3">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Propietario</p>
          </div>
          <Link href={`/owners/${owner.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors block">
            {c.ownerFullName}
          </Link>
          <p className="text-xs text-muted-foreground">DNI {c.ownerDni}{c.ownerCuit && ` · CUIT ${c.ownerCuit}`}</p>
          {c.ownerAddress && <p className="text-xs text-muted-foreground">{c.ownerAddress}</p>}
          {owner.bankAlias && (
            <p className="text-xs text-muted-foreground">{owner.bankName} · {owner.bankAlias}</p>
          )}
        </div>

        {/* Vigencia */}
        <div className="bg-white rounded-xl border border-border shadow-xs p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-3">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vigencia</p>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inicio</span>
              <span className="font-medium">{formatDate(c.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vencimiento</span>
              <span className={cn("font-medium", daysLeft < 60 && daysLeft > 0 ? "text-amber-600" : "")}>
                {formatDate(c.endDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duración</span>
              <span className="font-medium">{c.durationMonths} meses</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Representante Gesting</span>
              <span className="font-medium">{c.gestingRepName}</span>
            </div>
          </div>
        </div>

        {/* Comisión */}
        <div className="bg-white rounded-xl border border-border shadow-xs p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-3">
            <Percent className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comisión y condiciones</p>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comisión Gesting</span>
              <span className="font-semibold text-primary">{c.commissionRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ciudad del contrato</span>
              <span className="font-medium">{c.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Domicilio propiedad</span>
              <span className="font-medium text-right max-w-[150px]">{c.propertyAddress}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de firma */}
      <div className="bg-white rounded-xl border border-border shadow-xs p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Estado de firma</p>
        {c.signedAt ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Firmado el {formatDate(c.signedAt)}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">El contrato aún no ha sido firmado por las partes.</p>
        )}

        {c.specialClauses && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Cláusulas especiales</p>
            <p className="text-sm text-foreground">{c.specialClauses}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pb-4">
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5" />
          Descargar PDF
        </Button>
        {c.status !== "TERMINATED" && c.status !== "EXPIRED" && (
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-300">
            Rescindir contrato
          </Button>
        )}
        {(c.status === "EXPIRED" || c.status === "EXPIRING_SOON") && (
          <Button asChild size="sm">
            <Link href={`/contracts/new?propertyId=${property.id}`}>
              Renovar contrato
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
