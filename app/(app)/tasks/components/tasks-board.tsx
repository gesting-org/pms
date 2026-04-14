"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { Task, Property, TaskStatus } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_TYPE_LABELS, PRIORITY_LABELS, formatDate, formatARS, cn } from "@/lib/utils";
import { Plus, CheckSquare, Clock, AlertCircle, Check, ChevronRight, ChevronLeft, X, ShoppingBag, CalendarDays, Package } from "lucide-react";
import Link from "next/link";
import type { GuestOrderRow } from "@/app/api/orders/route";

type TaskWithProp = Task & { property: Property };

const COLUMNS: { status: TaskStatus; label: string; icon: any; color: string; bg: string; border: string }[] = [
  { status: "PENDING",     label: "Pendientes", icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/30",   border: "border-amber-200 dark:border-amber-800" },
  { status: "IN_PROGRESS", label: "En curso",   icon: AlertCircle,   color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/30",     border: "border-blue-200 dark:border-blue-800" },
  { status: "COMPLETED",   label: "Completadas",icon: Check,         color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "border-l-slate-300",
  MEDIUM: "border-l-blue-400",
  HIGH: "border-l-orange-400",
  URGENT: "border-l-red-500",
};
const PRIORITY_BADGE: Record<string, any> = {
  LOW: "secondary", MEDIUM: "default", HIGH: "warning", URGENT: "destructive",
};

function getTransitions(status: TaskStatus): { prev?: TaskStatus; next?: TaskStatus } {
  if (status === "PENDING")     return { next: "IN_PROGRESS" };
  if (status === "IN_PROGRESS") return { prev: "PENDING", next: "COMPLETED" };
  if (status === "COMPLETED")   return { prev: "IN_PROGRESS" };
  return {};
}

const TRANSITION_LABELS: Record<string, string> = {
  PENDING: "Iniciar", IN_PROGRESS: "Completar", COMPLETED: "Reabrir",
};

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

// ─── Order urgency helpers ────────────────────────────────────────────────────

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysUntilCheckin(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseLocalDate(dateStr).getTime() - today.getTime()) / 86400000);
}

function daysLabel(dateStr: string): string {
  const d = daysUntilCheckin(dateStr);
  if (d === 0) return "hoy";
  if (d === 1) return "mañana";
  return `en ${d} días`;
}

function orderUrgencyBorder(dateStr: string): string {
  const d = daysUntilCheckin(dateStr);
  if (d === 0) return "border-l-red-500";
  if (d <= 3)  return "border-l-amber-400";
  return "border-l-violet-400";
}

function orderUrgencyBadge(dateStr: string): string {
  const d = daysUntilCheckin(dateStr);
  if (d === 0) return "bg-red-50 text-red-600 border-red-200";
  if (d <= 3)  return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-violet-50 text-violet-600 border-violet-200";
}

// ─── Main board ───────────────────────────────────────────────────────────────

export function TasksBoard({ tasks: initialTasks, properties, orders = [] }: { tasks: TaskWithProp[]; properties: Property[]; orders?: GuestOrderRow[] }) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [propertyFilter, setPropertyFilter] = useState("ALL");
  const [overrides, setOverrides] = useState<Record<string, { status: TaskStatus; completedAt?: string }>>({});
  const [orderStatuses, setOrderStatuses] = useState<Record<string, TaskStatus>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const tasks = useMemo(() => {
    const now = Date.now();
    return initialTasks
      .map((t) => {
        const ov = overrides[t.id];
        if (!ov) return t;
        return { ...t, status: ov.status, completedAt: ov.completedAt ?? t.completedAt };
      })
      .filter((t) => {
        if (t.status !== "COMPLETED") return true;
        const completedAt = t.completedAt ? new Date(t.completedAt).getTime() : null;
        if (!completedAt) return true;
        return now - completedAt < TWO_DAYS_MS;
      });
  }, [initialTasks, overrides]);

  function changeStatus(taskId: string, newStatus: TaskStatus) {
    setOverrides((prev) => ({
      ...prev,
      [taskId]: {
        status: newStatus,
        completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : prev[taskId]?.completedAt,
      },
    }));
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).then(async (res) => {
      if (!res.ok) {
        // Revert optimistic update on failure
        const data = await res.json().catch(() => ({}));
        console.error("[tasks-board] Error updating task:", data.error ?? res.status);
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
      }
    }).catch((err) => {
      console.error("[tasks-board] Network error:", err);
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function changeOrderStatus(orderId: string, newStatus: TaskStatus) {
    setOrderStatuses((prev) => ({ ...prev, [orderId]: newStatus }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    const validStatuses: TaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];
    if (!validStatuses.includes(newStatus)) return;
    const activeIdStr = String(active.id);

    // Check if it's an order (prefixed with "order-")
    if (activeIdStr.startsWith("order-")) {
      const orderId = activeIdStr.slice(6);
      const currentStatus = orderStatuses[orderId] ?? "PENDING";
      if (currentStatus !== newStatus) changeOrderStatus(orderId, newStatus);
      return;
    }

    const task = tasks.find((t) => t.id === activeIdStr);
    if (!task || task.status === newStatus) return;
    changeStatus(activeIdStr, newStatus);
  }

  const filtered = tasks.filter((t) => propertyFilter === "ALL" || t.propertyId === propertyFilter);
  const activeTask = activeId && !activeId.startsWith("order-") ? tasks.find((t) => t.id === activeId) : null;
  const activeOrder = activeId?.startsWith("order-") ? orders.find((o) => o.id === activeId.slice(6)) : null;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")}>Kanban</Button>
          <Button size="sm" variant={view === "list"   ? "default" : "outline"} onClick={() => setView("list")}>Lista</Button>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button asChild size="sm">
          <Link href="/tasks/new"><Plus className="h-4 w-4" />Nueva tarea</Link>
        </Button>
      </div>

      {/* Kanban */}
      {view === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const colTasks = filtered.filter((t) => t.status === col.status);
              const colOrders = orders.filter((o) => (orderStatuses[o.id] ?? "PENDING") === col.status);
              return (
                <DroppableColumn key={col.status} col={col} tasks={colTasks} orders={colOrders} onChangeStatus={changeStatus} onChangeOrderStatus={changeOrderStatus} isDragging={!!activeId} />
              );
            })}
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
            {activeTask ? <TaskCardGhost task={activeTask} /> : null}
            {activeOrder ? <OrderCardGhost order={activeOrder} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List view */
        <div className="space-y-2">
          {orders.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 px-1">
                <ShoppingBag className="h-3.5 w-3.5 text-violet-500" />Pedidos de huéspedes
              </p>
              {orders.map((o) => <OrderListRow key={o.id} order={o} status={orderStatuses[o.id] ?? "PENDING"} onChangeStatus={changeOrderStatus} />)}
              {filtered.length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 px-1 pt-2">
                  <CheckSquare className="h-3.5 w-3.5" />Tareas
                </p>
              )}
            </>
          )}
          {filtered.length === 0 && orders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin tareas</p>
            </div>
          ) : filtered.map((t) => (
            <ListRow key={t.id} task={t} onChangeStatus={changeStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Droppable column ─────────────────────────────────────────────────────────

function DroppableColumn({
  col, tasks, orders = [], onChangeStatus, onChangeOrderStatus, isDragging,
}: {
  col: typeof COLUMNS[number];
  tasks: TaskWithProp[];
  orders?: GuestOrderRow[];
  onChangeStatus: (id: string, s: TaskStatus) => void;
  onChangeOrderStatus: (id: string, s: TaskStatus) => void;
  isDragging: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status });
  const total = tasks.length + orders.length;

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg", col.bg)}>
        <col.icon className={`h-4 w-4 ${col.color}`} />
        <span className="text-sm font-semibold">{col.label}</span>
        <span className="ml-auto text-xs font-medium text-muted-foreground bg-background/70 px-1.5 py-0.5 rounded-full">
          {total}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-2 min-h-[80px] rounded-xl transition-colors p-1 -m-1",
          isDragging && "min-h-[120px]",
          isOver && cn("ring-2", col.border, col.bg),
        )}
      >
        {orders.map((o) => (
          <DraggableOrderCard key={`order-${o.id}`} order={o} status={col.status} onChangeStatus={onChangeOrderStatus} />
        ))}
        {tasks.map((t) => (
          <DraggableCard key={t.id} task={t} onChangeStatus={onChangeStatus} />
        ))}
        {total === 0 && (
          <div className={cn(
            "rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground transition-colors",
            isOver && cn(col.bg, col.border),
          )}>
            {isOver ? "Soltar aquí" : "Sin tareas"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Draggable card wrapper ───────────────────────────────────────────────────

function DraggableCard({ task, onChangeStatus }: { task: TaskWithProp; onChangeStatus: (id: string, s: TaskStatus) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "transition-opacity cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-30",
      )}
    >
      <TaskCard
        task={task}
        onChangeStatus={onChangeStatus}
      />
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({
  task: t,
  onChangeStatus,
}: {
  task: TaskWithProp;
  onChangeStatus: (id: string, s: TaskStatus) => void;
}) {
  const { prev, next } = getTransitions(t.status);

  return (
    <div className={cn("block p-3 rounded-xl border-l-4 bg-card shadow-sm select-none", PRIORITY_COLORS[t.priority])}>
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-tight line-clamp-2">{t.title}</p>
              <Badge variant={PRIORITY_BADGE[t.priority] as any} className="text-[10px] shrink-0">
                {PRIORITY_LABELS[t.priority]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{t.property.name}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
              <span>{TASK_TYPE_LABELS[t.type]}</span>
              <span>{formatDate(t.scheduledDate)}</span>
            </div>
            {t.estimatedCost != null && t.estimatedCost > 0 && (
              <p className="text-xs font-medium text-foreground mt-0.5">{formatARS(t.estimatedCost)}</p>
            )}
            {t.completedAt && (
              <p className="text-[10px] text-emerald-600 mt-0.5">Completada {formatDate(t.completedAt)}</p>
            )}
          </div>
        </div>

        {/* Action buttons — stopPropagation so clicks don't trigger drag */}
        <div
          className="flex items-center gap-1 pt-2 border-t border-border/50"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {prev && (
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground gap-1"
              onClick={() => onChangeStatus(t.id, prev)}>
              <ChevronLeft className="h-3 w-3" />
              {prev === "PENDING" ? "Pendiente" : "En curso"}
            </Button>
          )}
          <div className="flex-1" />
          {next && (
            <Button size="sm" variant={next === "COMPLETED" ? "default" : "outline"} className="h-6 text-[10px] px-2 gap-1"
              onClick={() => onChangeStatus(t.id, next)}>
              {TRANSITION_LABELS[t.status]}
              {next === "COMPLETED" ? <Check className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5 text-muted-foreground hover:text-destructive"
            title="Cancelar tarea"
            onClick={() => onChangeStatus(t.id, "CANCELLED")}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Ghost card shown while dragging ─────────────────────────────────────────

function TaskCardGhost({ task: t }: { task: TaskWithProp }) {
  return (
    <div className={cn(
      "p-3 rounded-xl border-l-4 bg-card shadow-2xl ring-2 ring-primary/30 opacity-95 rotate-1 select-none",
      PRIORITY_COLORS[t.priority],
    )}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-tight line-clamp-2">{t.title}</p>
            <Badge variant={PRIORITY_BADGE[t.priority] as any} className="text-[10px] shrink-0">
              {PRIORITY_LABELS[t.priority]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{t.property.name}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
            <span>{TASK_TYPE_LABELS[t.type]}</span>
            <span>{formatDate(t.scheduledDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order card (kanban) ──────────────────────────────────────────────────────

function DraggableOrderCard({ order, status, onChangeStatus }: { order: GuestOrderRow; status: TaskStatus; onChangeStatus: (id: string, s: TaskStatus) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `order-${order.id}` });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn("transition-opacity cursor-grab active:cursor-grabbing touch-none", isDragging && "opacity-30")}
    >
      <OrderCard order={order} status={status} onChangeStatus={onChangeStatus} />
    </div>
  );
}

function OrderCard({ order: o, status, onChangeStatus }: { order: GuestOrderRow; status: TaskStatus; onChangeStatus: (id: string, s: TaskStatus) => void }) {
  const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
  const border = orderUrgencyBorder(o.checkinDate);
  const badgeCls = orderUrgencyBadge(o.checkinDate);
  const { prev, next } = getTransitions(status);

  return (
    <div className={cn(
      "block p-3 rounded-xl border-l-4 bg-violet-50/60 dark:bg-violet-950/20 shadow-sm select-none",
      border,
    )}>
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-violet-500" />
            <p className="text-sm font-medium leading-tight truncate">{o.guestName}</p>
          </div>
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0",
            badgeCls,
          )}>
            {daysLabel(o.checkinDate)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground truncate">{o.propertyName}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />{itemCount} producto{itemCount !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {parseLocalDate(o.checkinDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
          </span>
        </div>

        <div className="pt-1.5 border-t border-violet-200/60 dark:border-violet-800/40">
          <p className="text-[10px] text-violet-600 font-medium font-mono tracking-widest">{o.bookingCode}</p>
        </div>

        {/* Status buttons */}
        <div
          className="flex items-center gap-1 pt-1.5 border-t border-violet-200/60 dark:border-violet-800/40"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {prev && (
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground gap-1"
              onClick={() => onChangeStatus(o.id, prev)}>
              <ChevronLeft className="h-3 w-3" />
              {prev === "PENDING" ? "Pendiente" : "En curso"}
            </Button>
          )}
          <div className="flex-1" />
          {next && (
            <Button size="sm" variant={next === "COMPLETED" ? "default" : "outline"} className="h-6 text-[10px] px-2 gap-1"
              onClick={() => onChangeStatus(o.id, next)}>
              {TRANSITION_LABELS[status]}
              {next === "COMPLETED" ? <Check className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderCardGhost({ order: o }: { order: GuestOrderRow }) {
  const border = orderUrgencyBorder(o.checkinDate);
  const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className={cn(
      "p-3 rounded-xl border-l-4 bg-violet-50/60 dark:bg-violet-950/20 shadow-2xl ring-2 ring-violet-400/30 opacity-95 rotate-1 select-none",
      border,
    )}>
      <div className="flex items-center gap-1.5 min-w-0 mb-1">
        <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-violet-500" />
        <p className="text-sm font-medium leading-tight truncate">{o.guestName}</p>
      </div>
      <p className="text-xs text-muted-foreground truncate">{o.propertyName}</p>
      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
        <Package className="h-3 w-3" />{itemCount} producto{itemCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Order list row ───────────────────────────────────────────────────────────

function OrderListRow({ order: o, status, onChangeStatus }: { order: GuestOrderRow; status: TaskStatus; onChangeStatus: (id: string, s: TaskStatus) => void }) {
  const [expanded, setExpanded] = useState(false);
  const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
  const border = orderUrgencyBorder(o.checkinDate);
  const badgeCls = orderUrgencyBadge(o.checkinDate);
  const { prev, next } = getTransitions(status);

  return (
    <div className={cn("rounded-xl border-l-4 bg-violet-50/60 dark:bg-violet-950/20 shadow-sm overflow-hidden", border)}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors" onClick={() => setExpanded((v) => !v)}>
        <ShoppingBag className="h-4 w-4 shrink-0 text-violet-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{o.guestName}</p>
          <p className="text-xs text-muted-foreground">
            {o.propertyName} · {itemCount} producto{itemCount !== 1 ? "s" : ""} · Check-in {parseLocalDate(o.checkinDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] text-violet-600 font-bold tracking-widest hidden sm:block">{o.bookingCode}</span>
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
            badgeCls,
          )}>
            {daysLabel(o.checkinDate)}
          </span>
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            status === "PENDING"     && "bg-amber-100 text-amber-700",
            status === "IN_PROGRESS" && "bg-blue-100 text-blue-700",
            status === "COMPLETED"   && "bg-emerald-100 text-emerald-700",
          )}>
            {status === "PENDING" ? "Pendiente" : status === "IN_PROGRESS" ? "En curso" : "Completada"}
          </span>
          <span className="text-xs font-semibold text-emerald-600">{formatARS(o.totalARS)}</span>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t border-violet-200/40 pt-2 flex items-center gap-2 flex-wrap">
          {prev && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onChangeStatus(o.id, prev)}>
              <ChevronLeft className="h-3 w-3" />{prev === "PENDING" ? "Mover a Pendiente" : "Mover a En curso"}
            </Button>
          )}
          {next && (
            <Button size="sm" variant={next === "COMPLETED" ? "default" : "outline"} className="h-7 text-xs gap-1" onClick={() => onChangeStatus(o.id, next)}>
              {TRANSITION_LABELS[status]}{next === "COMPLETED" ? <Check className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── List row ─────────────────────────────────────────────────────────────────

function ListRow({ task: t, onChangeStatus }: { task: TaskWithProp; onChangeStatus: (id: string, s: TaskStatus) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { prev, next } = getTransitions(t.status);

  return (
    <div className={cn("rounded-xl border-l-4 bg-card shadow-sm overflow-hidden", PRIORITY_COLORS[t.priority])}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpanded((v) => !v)}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{t.title}</p>
          <p className="text-xs text-muted-foreground">
            {t.property.name} · {TASK_TYPE_LABELS[t.type]} · {formatDate(t.scheduledDate)}
            {t.provider && ` · ${t.provider}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {t.estimatedCost != null && t.estimatedCost > 0 && (
            <span className="text-xs text-muted-foreground hidden sm:block">{formatARS(t.estimatedCost)}</span>
          )}
          <Badge variant={PRIORITY_BADGE[t.priority]} className="text-[10px]">{PRIORITY_LABELS[t.priority]}</Badge>
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            t.status === "PENDING"     && "bg-amber-100 text-amber-700",
            t.status === "IN_PROGRESS" && "bg-blue-100 text-blue-700",
            t.status === "COMPLETED"   && "bg-emerald-100 text-emerald-700",
            t.status === "CANCELLED"   && "bg-slate-100 text-slate-500",
          )}>
            {t.status === "PENDING" ? "Pendiente" : t.status === "IN_PROGRESS" ? "En curso" : t.status === "COMPLETED" ? "Completada" : "Cancelada"}
          </span>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/40 pt-2 flex items-center gap-2 flex-wrap">
          {prev && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onChangeStatus(t.id, prev)}>
              <ChevronLeft className="h-3 w-3" />{prev === "PENDING" ? "Mover a Pendiente" : "Mover a En curso"}
            </Button>
          )}
          {next && (
            <Button size="sm" variant={next === "COMPLETED" ? "default" : "outline"} className="h-7 text-xs gap-1" onClick={() => onChangeStatus(t.id, next)}>
              {TRANSITION_LABELS[t.status]}{next === "COMPLETED" ? <Check className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          {t.status !== "CANCELLED" && (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1" onClick={() => onChangeStatus(t.id, "CANCELLED")}>
              <X className="h-3 w-3" />Cancelar
            </Button>
          )}
          {t.completedAt && (
            <span className="text-[10px] text-emerald-600 ml-auto">Completada {formatDate(t.completedAt)}</span>
          )}
        </div>
      )}
    </div>
  );
}
