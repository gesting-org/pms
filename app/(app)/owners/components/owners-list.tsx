"use client";

import { useState } from "react";
import Link from "next/link";
import { Owner } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, Search, User, Building2, Mail, Phone, CreditCard, ChevronRight, Copy, Check } from "lucide-react";
import { useGlow } from "@/components/ui/glow-card";

type OwnerWithCount = Owner & { propertiesCount: number };

export function OwnersList({ owners }: { owners: OwnerWithCount[] }) {
  const [search, setSearch] = useState("");

  const filtered = owners.filter((o) =>
    !search ||
    `${o.firstName} ${o.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase()) ||
    o.dni.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar propietario..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Button asChild size="sm">
          <Link href="/owners/new"><Plus className="h-4 w-4" />Nuevo propietario</Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin propietarios</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((o) => <OwnerCard key={o.id} owner={o} />)}
        </div>
      )}
    </div>
  );
}

function OwnerCard({ owner: o }: { owner: OwnerWithCount }) {
  const [copied, setCopied] = useState(false);
  const { ref, onMouseMove, onMouseLeave, glowStyle } = useGlow();

  function copyAlias() {
    if (!o.bankAlias) return;
    navigator.clipboard.writeText(o.bankAlias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Link
      ref={ref}
      href={`/owners/${o.id}`}
      className="group block rounded-xl border bg-card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-4 space-y-3 overflow-hidden relative"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div aria-hidden style={glowStyle} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {o.firstName.charAt(0)}{o.lastName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">
              {o.firstName} {o.lastName}
            </p>
            <p className="text-xs text-muted-foreground">DNI {o.dni}</p>
          </div>
        </div>
        <Badge variant={o.isActive ? "success" : "secondary"} className="text-[10px] shrink-0">
          {o.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{o.email}</p>
        {o.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" />{o.phone}</p>}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span>{o.propertiesCount} propiedad{o.propertiesCount !== 1 ? "es" : ""}</span>
        </div>
        {o.bankAlias && (
          <button
            onClick={(e) => { e.preventDefault(); copyAlias(); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Copiar alias bancario"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            <span className="font-mono text-[10px] truncate max-w-[120px]">{o.bankAlias}</span>
          </button>
        )}
      </div>
    </Link>
  );
}
