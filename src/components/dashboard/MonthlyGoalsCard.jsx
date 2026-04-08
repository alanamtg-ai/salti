import { startOfMonth, endOfMonth } from "date-fns";
import { TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_MONTHLY_GOAL = 25;

export default function MonthlyGoalsCard({ demands, member, concludedThisMonth }) {
  if (!member || member.role === "cliente") return null;

  const monthlyGoal = DEFAULT_MONTHLY_GOAL;
  const completed = concludedThisMonth;
  const remaining = Math.max(0, monthlyGoal - completed);
  const progressPercent = Math.min(100, Math.round((completed / monthlyGoal) * 100));

  const now = new Date();
  const month = now.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const daysInMonth = endOfMonth(now).getDate();
  const dayOfMonth = now.getDate();
  const expectedProgress = Math.round((dayOfMonth / daysInMonth) * monthlyGoal);
  const isAheadOfSchedule = completed >= expectedProgress;

  const statusText = isAheadOfSchedule
    ? "Ótimo ritmo! Continue assim 🚀"
    : "Atenção: abaixo da meta ideal ⚠️";

  const statusColor = progressPercent >= 80
    ? "text-emerald-600"
    : progressPercent >= 50
    ? "text-amber-600"
    : "text-red-600";

  const barColor = progressPercent >= 80
    ? "bg-emerald-500"
    : progressPercent >= 50
    ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Meta do Mês</h3>
        </div>
        <span className="text-xs text-muted-foreground capitalize">{month}</span>
      </div>

      {/* Progress text */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground">{completed}</span>
        <span className="text-lg text-muted-foreground">/ {monthlyGoal}</span>
        <span className={cn("text-sm font-semibold ml-auto", statusColor)}>
          {progressPercent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Status message */}
      <div className={cn("flex items-start gap-2 p-3 rounded-lg border",
        isAheadOfSchedule
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-amber-50 border-amber-200 text-amber-700"
      )}>
        {!isAheadOfSchedule && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
        <div className="text-sm">
          <p className="font-semibold">{statusText}</p>
          {remaining > 0 && (
            <p className="text-xs opacity-75 mt-1">
              Faltam {remaining} demanda{remaining !== 1 ? "s" : ""} para atingir a meta
            </p>
          )}
          {remaining <= 0 && (
            <p className="text-xs opacity-75 mt-1">
              Meta atingida! 🎉
            </p>
          )}
        </div>
      </div>

      {/* Extra info */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
        <div>
          <p className="text-muted-foreground">Esperado para hoje</p>
          <p className="font-semibold text-foreground">{expectedProgress}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ritmo ideal/dia</p>
          <p className="font-semibold text-foreground">{(monthlyGoal / daysInMonth).toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}