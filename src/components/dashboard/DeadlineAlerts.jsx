import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeadlineAlerts() {
  const { data: demands = [] } = useQuery({
    queryKey: ["demands_for_alerts"],
    queryFn: () => base44.entities.Demand.filter({ status: "ativo" }),
  });

  // Agrupa alertas por tipo
  const alerts = {
    overdue: [],
    urgent: [], // 0-2 dias
    warning: [], // 3-5 dias
  };

  demands.forEach((demand) => {
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
        deadline: deadlineDate,
        type: "overdue",
      });
    } else if (daysLeft <= 2) {
      alerts.urgent.push({
        demand,
        daysLeft,
        deadline: deadlineDate,
        type: "urgent",
      });
    } else if (daysLeft <= 5) {
      alerts.warning.push({
        demand,
        daysLeft,
        deadline: deadlineDate,
        type: "warning",
      });
    }
  });

  const totalAlerts =
    alerts.overdue.length + alerts.urgent.length + alerts.warning.length;

  if (totalAlerts === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">Tudo em dia!</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Nenhuma demanda com prazo vencido ou próximo de vencer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Atrasadas */}
      {alerts.overdue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              {alerts.overdue.length} Demanda{alerts.overdue.length > 1 ? "s" : ""} Atrasada{alerts.overdue.length > 1 ? "s" : ""}
            </p>
          </div>
          {alerts.overdue.map((alert) => (
            <div
              key={alert.demand.id}
              className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 truncate">
                  {alert.demand.title}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  ⚠️ Atrasado há {alert.daysOverdue} dia{alert.daysOverdue > 1 ? "s" : ""} • Prazo: {format(alert.deadline, "dd/MM", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Urgentes (0-2 dias) */}
      {alerts.urgent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {alerts.urgent.length} Demanda{alerts.urgent.length > 1 ? "s" : ""} Urgente{alerts.urgent.length > 1 ? "s" : ""}
            </p>
          </div>
          {alerts.urgent.map((alert) => (
            <div
              key={alert.demand.id}
              className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-3"
            >
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 truncate">
                  {alert.demand.title}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  ⏰ {alert.daysLeft === 0 ? "Vence hoje" : `Vence em ${alert.daysLeft} dia${alert.daysLeft > 1 ? "s" : ""}`} • {format(alert.deadline, "dd/MM", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Avisos (3-5 dias) */}
      {alerts.warning.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {alerts.warning.length} Demanda{alerts.warning.length > 1 ? "s" : ""} com Prazo Próximo
            </p>
          </div>
          {alerts.warning.slice(0, 3).map((alert) => (
            <div
              key={alert.demand.id}
              className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-3"
            >
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 truncate">
                  {alert.demand.title}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  📅 Vence em {alert.daysLeft} dias • {format(alert.deadline, "dd/MM", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
          {alerts.warning.length > 3 && (
            <p className="text-xs text-muted-foreground text-center py-1">
              +{alerts.warning.length - 3} outra{alerts.warning.length - 3 > 1 ? "s" : ""} com prazo próximo
            </p>
          )}
        </div>
      )}

      {/* Resumo */}
      <div className="bg-muted/40 rounded-lg p-3 text-center">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{totalAlerts}</span> alerta{totalAlerts > 1 ? "s" : ""} ativo{totalAlerts > 1 ? "s" : ""}
          {alerts.overdue.length > 0 && (
            <span className="text-red-600 font-semibold"> • {alerts.overdue.length} atrasado{alerts.overdue.length > 1 ? "s" : ""}</span>
          )}
        </p>
      </div>
    </div>
  );
}