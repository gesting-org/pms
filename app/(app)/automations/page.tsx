"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Zap, Clock, Check, X, AlertTriangle, RefreshCw } from "lucide-react";

const AUTOMATION_RULES = [
  { id: "auto-1", name: "Limpieza post check-out", trigger: "Reserva completada (check-out)", action: "Crear tarea de limpieza automáticamente", isActive: true, lastRun: "Hace 2 días", runs: 12 },
  { id: "auto-2", name: "Alerta vencimiento contrato 30d", trigger: "Contrato vence en 30 días", action: "Enviar email al propietario y notificación push", isActive: true, lastRun: "Hace 5 días", runs: 3 },
  { id: "auto-3", name: "Alerta vencimiento contrato 60d", trigger: "Contrato vence en 60 días", action: "Notificación interna al admin", isActive: true, lastRun: "Hace 8 días", runs: 2 },
  { id: "auto-4", name: "Datos al huésped previo check-in", trigger: "Check-in es mañana", action: "Enviar email con código de acceso y datos de la propiedad", isActive: true, lastRun: "Ayer", runs: 8 },
  { id: "auto-5", name: "Alerta mora de liquidación", trigger: "Liquidación vencida +3 días", action: "Notificar admin y calcular mora automáticamente", isActive: false, lastRun: "Nunca", runs: 0 },
  { id: "auto-6", name: "Recordatorio pago comisión", trigger: "Liquidación pendiente hace 5 días", action: "Email al propietario recordando el pago", isActive: true, lastRun: "Hace 1 día", runs: 5 },
];

const AUTOMATION_LOGS = [
  { id: "log-1", rule: "Datos al huésped previo check-in", entity: "Reserva res-2", status: "success", runAt: "Hoy 08:00", result: "Email enviado a john.smith@email.com" },
  { id: "log-2", rule: "Limpieza post check-out", entity: "Reserva res-1", status: "success", runAt: "Ayer 14:30", result: "Tarea de limpieza creada: ID task-2" },
  { id: "log-3", rule: "Alerta vencimiento contrato 30d", entity: "Contrato GEST-2024-001", status: "success", runAt: "Hace 5 días", result: "Email enviado a carlos.rodriguez@gmail.com" },
  { id: "log-4", rule: "Recordatorio pago comisión", entity: "Liquidación liq-3", status: "error", runAt: "Ayer 09:00", result: "Error: email del propietario no configurado" },
];

export default function AutomationsPage() {
  const [rules, setRules] = useState(AUTOMATION_RULES);

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Automatizaciones" subtitle="Reglas configuradas" />
      <div className="p-4 md:p-6 animate-fade-in">
        <Tabs defaultValue="rules">
          <TabsList className="mb-4">
            <TabsTrigger value="rules">Reglas ({rules.length})</TabsTrigger>
            <TabsTrigger value="logs">Log de ejecuciones</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{rules.filter((r) => r.isActive).length}</span> activas de {rules.length}
              </p>
            </div>
            {rules.map((rule) => (
              <Card key={rule.id} className={cn("border-0 shadow-sm transition-opacity", !rule.isActive && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn("p-2 rounded-lg shrink-0", rule.isActive ? "bg-primary/10" : "bg-muted")}>
                        <Zap className={cn("h-4 w-4", rule.isActive ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{rule.name}</p>
                          <Badge variant={rule.isActive ? "success" : "secondary"} className="text-[10px]">
                            {rule.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium">Trigger:</span> {rule.trigger}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Acción:</span> {rule.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />{rule.lastRun} · {rule.runs} ejecuciones
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <RefreshCw className="h-3 w-3" />Ejecutar
                      </Button>
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                          rule.isActive ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow", rule.isActive ? "translate-x-5" : "translate-x-1")} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="logs" className="space-y-3">
            {AUTOMATION_LOGS.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className={cn("p-1.5 rounded-full shrink-0 mt-0.5", log.status === "success" ? "bg-emerald-100 dark:bg-emerald-950/30" : "bg-red-100 dark:bg-red-950/30")}>
                  {log.status === "success"
                    ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                    : <X className="h-3.5 w-3.5 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{log.rule}</p>
                  <p className="text-xs text-muted-foreground">{log.entity} · {log.runAt}</p>
                  <p className={cn("text-xs mt-0.5", log.status === "error" && "text-red-500")}>{log.result}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
