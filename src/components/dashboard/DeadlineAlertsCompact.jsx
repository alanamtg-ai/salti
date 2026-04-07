import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { differenceInDays, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeadlineAlertsCompact({ userEmail }) {
  const { data: demands = [] } = useQuery({
    queryKey: ["my_deadline_alerts", userEmail],
    queryFn: () =>
      base44.entities.Demand.filter({
        status: "ativo",
      }),
  });

  // Filtra apenas demandas atribuídas ao usuário
  const myDemands = demands.filter(
    (d) => d.assignees?.[d.current_step] === userEmail
  );

  const alerts = {
    overdue: [],
    urgent: [],
  };

  myDemands.forEach((demand) => {
    const stepDeadline = demand.step_deadlines?.[demand.current_step];
    const deadline = stepDeadline || demand.deadline;

    if (!deadline) return;

    const deadlineDate = new Date(deadline);
    const daysLeft = differenceInDays(deadlineDate, new Date());
    const isOverdue = isPast(deadlineDate) && !isToday(deadlineDate);

    if (isOverdue) {
      alerts.overdue.push({
        demand,
        daysOverdue: Math.abs(daysLeft),
      });
    } else if (daysLeft <= 3) {
      alerts.urgent.push({
        demand,
        daysLeft,
      });
    }
  });

  const totalAlerts = alerts.overdue.length + alerts.urgent.length;

  if (totalAlerts === 0) return null;

  return (
    <div className="space-y-3">
      {/* Atrasadas */}
      {alerts.overdue.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-300">
                {alerts.overdue.length} demanda{alerts.overdue.length > 1 ? "s" : ""} atrasada{alerts.overdue.length > 1 ? "s" : ""}!
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {alerts.overdue.map((a) => a.demand.title).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Urgentes */}
      {alerts.urgent.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                {alerts.urgent.length} prazo próximo!
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                {alerts.urgent.map((a) => `${a.demand.title} (${a.daysLeft}d)`).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}