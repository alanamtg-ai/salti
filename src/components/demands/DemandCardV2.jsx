import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getStepLight, getStepLabel } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";

const priorityConfig = {
  baixa: { label: "Baixa", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  media: { label: "Média", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  alta: { label: "Alta", cls: "bg-orange-100 text-orange-700 border-orange-200" },
  urgente: { label: "Urgente", cls: "bg-red-100 text-red-700 border-red-200" },
};

export default function DemandCardV2({ demand, onClick }) {
  const p = priorityConfig[demand.priority] || priorityConfig.media;
  const stepDeadline = demand.step_deadlines?.[demand.current_step];
  const deadlineDate = stepDeadline ? new Date(stepDeadline) : demand.deadline ? new Date(demand.deadline) : null;
  const isOverdue = deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate) && demand.current_step !== "publicado";
  const daysLeft = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null;

  return (
    <div
      onClick={() => onClick?.(demand)}
      className="bg-card rounded-xl border border-border p-3.5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
          {demand.title}
        </h4>
        <Badge variant="outline" className={cn("text-[9px] shrink-0 border", p.cls)}>{p.label}</Badge>
      </div>

      {demand.rejection_note && (
        <div className="text-[10px] text-red-600 bg-red-50 rounded px-2 py-1 mb-2 line-clamp-1">
          ↩ {demand.rejection_note}
        </div>
      )}

      {/* Data de postagem */}
      {demand.scheduled_date && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2 mb-2">
          <Calendar className="w-3 h-3" />
          {format(new Date(demand.scheduled_date), "dd/MMM", { locale: ptBR })}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", getStepLight(demand.current_step))}>
          {getStepLabel(demand.current_step)}
        </span>
        {deadlineDate && (
          <span className={cn("flex items-center gap-1 text-[10px]",
            isOverdue ? "text-red-500 font-bold" : daysLeft !== null && daysLeft <= 2 ? "text-amber-500" : "text-muted-foreground"
          )}>
            <Clock className="w-3 h-3" />
            {isOverdue ? "Atrasado" : daysLeft === 0 ? "Hoje" : `${daysLeft}d`}
          </span>
        )}
      </div>
    </div>
  );
}