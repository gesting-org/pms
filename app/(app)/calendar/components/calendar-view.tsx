"use client";

import { useState, useRef } from "react";
import { Property } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

interface CalEvent {
  id: string;
  type: "reservation" | "task" | "contract";
  title: string;
  subtitle: string;
  start: string;
  startTime?: string;
  end: string;
  endTime?: string;
  color: string;
  propertyId: string;
  status: string;
  priority?: string;
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAY_ABBR = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const PLATFORM_COLORS: Record<string, string> = {
  AIRBNB: "#FF5A5F",
  BOOKING: "#003580",
  DIRECT: "#10b981",
  OTHER: "#8b5cf6",
};

function toDateStr(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

const CELL_W = 72; // px per day column
const ROW_H = 80; // px per property row
const LABEL_W = 180; // px for property label column

export function CalendarView({ events, properties }: { events: CalEvent[]; properties: Property[] }) {
  const today = new Date();
  const todayStr = toDateStr(today);

  // Show 14 days starting from a given date
  const [startDate, setStartDate] = useState(() => {
    // Start from Monday of current week
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() + 1);
    return toDateStr(d);
  });

  const [tooltip, setTooltip] = useState<{ event: CalEvent; x: number; y: number; flipped: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const VISIBLE_DAYS = 14;

  // Build array of visible dates
  const visibleDates: string[] = [];
  for (let i = 0; i < VISIBLE_DAYS; i++) {
    visibleDates.push(addDays(startDate, i));
  }

  const endDate = visibleDates[visibleDates.length - 1];

  function prevPeriod() {
    setStartDate(addDays(startDate, -7));
  }
  function nextPeriod() {
    setStartDate(addDays(startDate, 7));
  }
  function goToday() {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() + 1);
    setStartDate(toDateStr(d));
  }

  // Group dates by month for header
  const monthGroups: { month: string; days: string[] }[] = [];
  for (const dateStr of visibleDates) {
    const d = new Date(dateStr);
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const last = monthGroups[monthGroups.length - 1];
    if (last && last.month === label) {
      last.days.push(dateStr);
    } else {
      monthGroups.push({ month: label, days: [dateStr] });
    }
  }

  // Filter only reservation events (tasks/contracts shown as small dots)
  const reservationEvents = events.filter((e) => e.type === "reservation");
  const otherEvents = events.filter((e) => e.type !== "reservation");

  // For each property row, find overlapping reservations in visible window
  function getReservationsForProperty(propertyId: string) {
    return reservationEvents.filter((e) => {
      if (e.propertyId !== propertyId) return false;
      // overlaps with visible window
      return e.start <= endDate && e.end >= startDate;
    });
  }

  function getOtherEventsForProperty(propertyId: string) {
    return otherEvents.filter((e) => {
      if (e.propertyId !== propertyId) return false;
      return e.start >= startDate && e.start <= endDate;
    });
  }

  // Compute bar position and width for a reservation
  function getBarGeometry(event: CalEvent) {
    const clampedStart = event.start < startDate ? startDate : event.start;
    const clampedEnd = event.end > endDate ? endDate : event.end;
    const offsetDays = daysBetween(startDate, clampedStart);
    const spanDays = daysBetween(clampedStart, clampedEnd) + 1;
    return {
      left: offsetDays * CELL_W,
      width: spanDays * CELL_W - 4,
      cutLeft: event.start < startDate,
      cutRight: event.end > endDate,
    };
  }

  const totalWidth = VISIBLE_DAYS * CELL_W;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {monthGroups.map((g) => (
              <span key={g.month} className="text-sm font-semibold text-foreground">
                {g.month}
              </span>
            ))}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToday}>Hoy</Button>
        </div>
        <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
          <Link href="/reservations/new">
            <Plus className="h-3.5 w-3.5" />Nueva reserva
          </Link>
        </Button>
      </div>

      {/* Timeline grid */}
      <div className="relative rounded-xl border border-border/70 overflow-hidden bg-card shadow-sm">
        <div ref={containerRef} className="overflow-x-auto">
          <div style={{ width: LABEL_W + totalWidth, minWidth: LABEL_W + totalWidth }}>

            {/* Header: month groups */}
            <div className="flex border-b border-border/60 bg-muted/30">
              <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground border-r border-border/60 shrink-0">
                Propiedades
              </div>
              <div className="flex shrink-0" style={{ width: totalWidth }}>
                {monthGroups.map((g) => (
                  <div
                    key={g.month}
                    style={{ width: g.days.length * CELL_W, minWidth: g.days.length * CELL_W }}
                    className="py-2 text-center text-xs font-semibold text-primary border-r border-border/40 last:border-r-0 shrink-0"
                  >
                    {g.month}
                  </div>
                ))}
              </div>
            </div>

            {/* Header: day numbers */}
            <div className="flex border-b border-border/60 bg-muted/20">
              <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="border-r border-border/60 shrink-0" />
              <div className="flex shrink-0" style={{ width: totalWidth }}>
                {visibleDates.map((dateStr) => {
                  const d = new Date(dateStr);
                  const isToday = dateStr === todayStr;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={dateStr}
                      style={{ width: CELL_W, minWidth: CELL_W }}
                      className={cn(
                        "flex flex-col items-center justify-center py-1.5 border-r border-border/40 last:border-r-0 shrink-0",
                        isWeekend && "bg-muted/30"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-medium",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}>
                        {DAY_ABBR[d.getDay()]}
                      </span>
                      <span className={cn(
                        "text-base font-bold w-8 h-8 flex items-center justify-center rounded-full",
                        isToday ? "bg-primary text-white" : isWeekend ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Property rows */}
            {properties.map((property, rowIdx) => {
              const propReservations = getReservationsForProperty(property.id);
              const propOther = getOtherEventsForProperty(property.id);

              return (
                <div
                  key={property.id}
                  className={cn(
                    "flex border-b border-border/40 last:border-b-0",
                    rowIdx % 2 === 0 ? "bg-card" : "bg-muted/10"
                  )}
                  style={{ height: ROW_H }}
                >
                  {/* Property label */}
                  <div
                    style={{ width: LABEL_W, minWidth: LABEL_W, maxWidth: LABEL_W }}
                    className="flex items-center gap-2.5 px-3 border-r border-border/60 shrink-0"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: property.colorTag }}
                    />
                    <span className="text-sm font-medium truncate text-foreground">
                      {property.name}
                    </span>
                  </div>

                  {/* Timeline area */}
                  <div className="relative shrink-0" style={{ width: totalWidth }}>
                    {/* Day column backgrounds */}
                    <div className="absolute inset-0 flex">
                      {visibleDates.map((dateStr) => {
                        const d = new Date(dateStr);
                        const isToday = dateStr === todayStr;
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        return (
                          <div
                            key={dateStr}
                            style={{ width: CELL_W, minWidth: CELL_W }}
                            className={cn(
                              "h-full border-r border-border/30 last:border-r-0 shrink-0",
                              isToday && "bg-primary/5",
                              isWeekend && !isToday && "bg-muted/20"
                            )}
                          />
                        );
                      })}
                    </div>

                    {/* Reservation bars */}
                    {propReservations.map((event) => {
                      const { left, width, cutLeft, cutRight } = getBarGeometry(event);

                      return (
                        <div
                          key={event.id}
                          className="absolute cursor-pointer group"
                          style={{
                            left: left + 3,
                            width: width - 2,
                            height: 44,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                          onMouseEnter={(e) => {
                            const rect = containerRef.current?.getBoundingClientRect();
                            if (rect) {
                              const relY = e.clientY - rect.top;
                              const flipped = relY > rect.height - 140;
                              setTooltip({ event, x: e.clientX - rect.left, y: relY, flipped });
                            }
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <div
                            className="w-full h-full flex items-center px-3 gap-2 shadow-md transition-all group-hover:brightness-110"
                            style={{
                              backgroundColor: event.color,
                              borderRadius: cutLeft && cutRight
                                ? "0"
                                : cutLeft
                                ? "0 999px 999px 0"
                                : cutRight
                                ? "999px 0 0 999px"
                                : "999px",
                            }}
                          >
                            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-white/25 text-[10px] font-bold text-white uppercase">
                              {event.title?.charAt(0) ?? "?"}
                            </span>
                            <span className="text-white text-xs font-semibold truncate leading-none">
                              {event.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Task / contract dots */}
                    {propOther.map((event) => {
                      const offsetDays = daysBetween(startDate, event.start);
                      if (offsetDays < 0 || offsetDays >= VISIBLE_DAYS) return null;
                      return (
                        <div
                          key={event.id}
                          className="absolute bottom-2 flex items-center justify-center"
                          style={{ left: offsetDays * CELL_W + CELL_W / 2 - 7 }}
                          title={event.title}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full border-2 border-background shadow"
                            style={{ backgroundColor: event.color }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-lg p-3 text-xs"
            style={{
              left: tooltip.x + 12,
              top: tooltip.flipped ? undefined : tooltip.y + 12,
              bottom: tooltip.flipped ? (containerRef.current?.clientHeight ?? 0) - tooltip.y + 8 : undefined,
              maxWidth: 220,
            }}
          >
            <p className="font-semibold text-foreground">{tooltip.event.title}</p>
            <p className="text-muted-foreground mt-0.5">{tooltip.event.subtitle}</p>
            <div className="flex gap-3 mt-1.5 text-muted-foreground">
              <span>Check-in: {tooltip.event.start}{tooltip.event.startTime ? ` · ${tooltip.event.startTime}hs` : ""}</span>
            </div>
            <div className="flex gap-3 text-muted-foreground">
              <span>Check-out: {tooltip.event.end}{tooltip.event.endTime ? ` · ${tooltip.event.endTime}hs` : ""}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground px-1">
        {properties.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.colorTag }} />
            {p.name}
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-border bg-amber-400" />Tareas/Contratos
        </div>
      </div>
    </div>
  );
}
