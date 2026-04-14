import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, TASK_TYPE_LABELS, PRIORITY_LABELS } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface UpcomingTask {
  id: string;
  title: string;
  type: string;
  priority: string;
  scheduledDate: string;
  status: string;
  property: { name: string };
}

const PRIORITY_BADGE: Record<string, "default" | "warning" | "destructive" | "secondary"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  URGENT: "#ef4444",
};

export function UpcomingTasks({ tasks }: { tasks: UpcomingTask[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EBEBEB] shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBEBEB]">
        <h2 className="text-[15px] font-semibold text-[#222222]">Tareas urgentes</h2>
        <Link href="/tasks" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-[#717171] text-center py-10">Sin tareas urgentes</p>
      ) : (
        <div className="divide-y divide-[#EBEBEB]">
          {tasks.map((t) => (
            <Link
              key={t.id}
              href="/tasks"
              className="flex items-center gap-4 px-6 py-4 hover:bg-[#F7F7F7] transition-colors"
            >
              <div
                className="w-2 h-8 rounded-full shrink-0"
                style={{ backgroundColor: PRIORITY_DOT[t.priority] ?? "#94a3b8" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#222222] truncate">{t.title}</p>
                <p className="text-xs text-[#717171] mt-0.5">
                  {t.property.name} · {TASK_TYPE_LABELS[t.type] ?? t.type} · {formatDate(t.scheduledDate)}
                </p>
              </div>
              <Badge variant={PRIORITY_BADGE[t.priority] ?? "secondary"} className="text-[10px] shrink-0">
                {PRIORITY_LABELS[t.priority] ?? t.priority}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
