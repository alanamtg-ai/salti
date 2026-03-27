import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight, AlertTriangle, User, Zap } from "lucide-react";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { getStepLabel, getStepLight, STEPS } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useState } from "react";

const priorityConfig = {
  baixa: { label: "Baixa", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  media: { label: "Média", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  alta: { label: "Alta", cls: "bg-orange-100 text-orange-700 border-orange-200" },
  urgente: { label: "Urgente", cls: "bg-red-100 text-red-700 border-red-200" },
};

export default function MyTaskCard({ demand, member, onUpdated, onOpenDetail }) {
  const [loading, setLoading] = useState(false);

  const p = priorityConfig[demand.priority] || priorityConfig.media;
  const stepDeadline = demand.step_deadlines?.[demand.current_step];
  const deadlineDate = stepDeadline ? new Date(stepDeadline) : demand.deadline ? new Date(demand.deadline) : null;
  const isOverdue = deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate);
  const daysLeft = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null;

  // Qual é o próximo passo
  const stepsFlow = demand.steps_flow || [];
  const currentIndex = demand.current_step_index ?? 0;
  const nextStep = stepsFlow[currentIndex + 1];
  const isLastStep = currentIndex >= stepsFlow.length - 1;

  const handleFinish = async (e) => {
    e.stopPropagation();
    setLoading(true);
    const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    const newIndex = currentIndex + 1;
    const newStep = stepsFlow[newIndex] || "publicado";
    await base44.entities.Demand.update(demand.id, {
      current_step: newStep,
      current_step_index: newIndex,
      status: newStep === "publicado" ? "publicado" : "ativo",
      rejection_note: "",
      history: [
        ...(demand.history || []),
        {
          step: demand.current_step,
          action: "avançado",
          by: member?.email || "sistema",
          by_name: member?.name || "Sistema",
          date: now,
          note: "",
        },
      ],
    });
    setLoading(false);
    onUpdated();
  };

  return (
    <div
      onClick={() => onOpenDetail(demand)}
      className={cn(
        "bg-card rounded-xl border p-4 cursor-pointer transition-all group hover:shadow-md",
        isOverdue ? "border-red-300 bg-red-50/30" : "border-border hover:border-primary/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
            <span className="text-xs font-medium text-muted-foreground truncate">{demand.client_name}</span>
          </div>
          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {demand.title}
          </h4>
        </div>
        <Badge variant="outline" className={cn("text-[9px] shrink-0 border", p.cls)}>{p.label}</Badge>
      </div>

      {/* Nota de devolução */}
      {demand.rejection_note && (
        <div className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 mb-3 line-clamp-2">
          ↩ <strong>Devolvido:</strong> {demand.rejection_note}
        </div>
      )}

      {/* Etapa atual + próxima */}
      <div className="flex items-center gap-1.5 mb-3 text-xs">
        <span className={cn("px-2 py-0.5 rounded-full font-medium text-[10px]", getStepLight(demand.current_step))}>
          {getStepLabel(demand.current_step)}
        </span>
        {nextStep && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
              {getStepLabel(nextStep)}
            </span>
          </>
        )}
      </div>

      {/* Footer: prazo + botão */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
        {deadlineDate ? (
          <span className={cn("flex items-center gap-1 text-[10px] font-medium",
            isOverdue ? "text-red-600" : daysLeft !== null && daysLeft <= 2 ? "text-amber-600" : "text-muted-foreground"
          )}>
            <Clock className="w-3 h-3" />
            {isOverdue ? `Atrasado ${Math.abs(daysLeft)}d` : daysLeft === 0 ? "Vence hoje" : `${daysLeft}d restantes`}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">Sem prazo</span>
        )}

        <Button
          size="sm"
          className="h-7 text-[11px] px-3 gap-1"
          onClick={handleFinish}
          disabled={loading || isLastStep}
        >
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            <>
              <Zap className="w-3 h-3" />
              {isLastStep ? "Último passo" : "Finalizar Etapa"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}