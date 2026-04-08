import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { startOfMonth, startOfWeek, differenceInDays } from "date-fns";

export default function ProductivityGoalCard({ demands, member }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const weekStart = startOfWeek(now);
  const daysIntoMonth = differenceInDays(now, monthStart) + 1;
  const daysIntoWeek = differenceInDays(now, weekStart) + 1;

  // Meta mensal (pode ser configurável, aqui usando monthly_goal do member)
  const monthlyGoal = member?.monthly_goal || 25;

  // Finalizadas no mês
  const completedThisMonth = demands.filter((d) => {
    if (d.status !== "finalizado") return false;
    const updated = d.updated_date ? new Date(d.updated_date) : null;
    return updated && updated >= monthStart;
  }).length;

  // Finalizadas na semana
  const completedThisWeek = demands.filter((d) => {
    if (d.status !== "finalizado") return false;
    const updated = d.updated_date ? new Date(d.updated_date) : null;
    return updated && updated >= weekStart;
  }).length;

  // Cálculo de progresso
  const monthlyProgress = Math.round((completedThisMonth / monthlyGoal) * 100);
  const remaining = Math.max(0, monthlyGoal - completedThisMonth);

  // Progresso esperado (linear até o fim do mês)
  const expectedDaysInMonth = 30;
  const expectedProgressPercent = Math.round((daysIntoMonth / expectedDaysInMonth) * 100);
  const isAboveExpected = monthlyProgress >= expectedProgressPercent;

  // Status e cor
  const getStatusColor = () => {
    if (monthlyProgress >= 100) return "bg-emerald-50 border-emerald-200";
    if (isAboveExpected) return "bg-emerald-50 border-emerald-200";
    if (monthlyProgress >= expectedProgressPercent * 0.8) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const getProgressColor = () => {
    if (monthlyProgress >= 100) return "bg-emerald-500";
    if (isAboveExpected) return "bg-emerald-500";
    if (monthlyProgress >= expectedProgressPercent * 0.8) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusText = () => {
    if (monthlyProgress >= 100) return "✨ Meta atingida! Excelente desempenho";
    if (isAboveExpected) return "🚀 Ótimo ritmo! Continue assim";
    if (monthlyProgress >= expectedProgressPercent * 0.8) return "⚠️ Atenção: abaixo da meta ideal";
    return "🔴 Urgente: recuperar o ritmo";
  };

  const getStatusTextColor = () => {
    if (monthlyProgress >= 100) return "text-emerald-600";
    if (isAboveExpected) return "text-emerald-600";
    if (monthlyProgress >= expectedProgressPercent * 0.8) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className={cn("rounded-xl border p-5 space-y-4", getStatusColor())}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold">🎯 Meta Mensal</h3>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-background/50">
          {daysIntoMonth}/{expectedDaysInMonth} dias
        </span>
      </div>

      {/* Progresso */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-foreground">
            {completedThisMonth} / {monthlyGoal} concluídas
          </span>
          <span className="text-2xl font-bold">{monthlyProgress}%</span>
        </div>

        {/* Barra de progresso */}
        <div className="h-3 bg-background rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", getProgressColor())}
            style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
          />
        </div>

        {/* Texto complementar */}
        {remaining > 0 ? (
          <p className="text-xs text-muted-foreground">
            Faltam <strong>{remaining} demanda{remaining > 1 ? "s" : ""}</strong> para atingir a meta
          </p>
        ) : (
          <p className="text-xs text-emerald-600 font-medium">Meta alcançada! 🎉</p>
        )}
      </div>

      {/* Status */}
      <div className={cn("p-3 rounded-lg bg-background/50 border-l-4", 
        isAboveExpected ? "border-l-emerald-500" : "border-l-amber-500"
      )}>
        <p className={cn("text-sm font-medium", getStatusTextColor())}>
          {getStatusText()}
        </p>
      </div>

      {/* Meta semanal opcional */}
      {completedThisWeek > 0 && (
        <div className="pt-2 border-t border-border/30 text-xs">
          <p className="text-muted-foreground">
            Essa semana: <strong className="text-foreground">{completedThisWeek} concluída{completedThisWeek > 1 ? "s" : ""}</strong>
          </p>
        </div>
      )}
    </div>
  );
}