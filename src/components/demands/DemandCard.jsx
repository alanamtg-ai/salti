import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock } from "lucide-react";
import { format, isPast, isToday, differenceInDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const priorityConfig = {
  baixa: { label: "Baixa", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  media: { label: "Média", class: "bg-amber-100 text-amber-700 border-amber-200" },
  alta: { label: "Alta", class: "bg-orange-100 text-orange-700 border-orange-200" },
  urgente: { label: "Urgente", class: "bg-red-100 text-red-700 border-red-200" },
};

const categoryLabels = {
  social_media: "Social Media",
  video: "Vídeo",
  design: "Design",
  copy: "Copy",
  website: "Website",
  estrategia: "Estratégia",
  outro: "Outro",
};

export default function DemandCard({ demand, onClick }) {
  const priority = priorityConfig[demand.priority] || priorityConfig.media;
  const deadlineDate = demand.deadline ? new Date(demand.deadline) : null;
  const isOverdue = deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate) && demand.status !== "concluido";
  const daysLeft = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null;

  // Para cards de redação: calcula prazos baseado na data de postagem
  const scheduledDate = demand.scheduled_date ? new Date(demand.scheduled_date) : null;
  const redacaoDueDate = scheduledDate ? subDays(scheduledDate, 30) : null;
  const designDueDate = scheduledDate ? subDays(scheduledDate, 25) : null;
  const estrategiaDueDate = scheduledDate ? subDays(scheduledDate, 45) : null;

  const redacaoDaysLeft = redacaoDueDate ? differenceInDays(redacaoDueDate, new Date()) : null;
  const designDaysLeft = designDueDate ? differenceInDays(designDueDate, new Date()) : null;
  const estrategiaDaysLeft = estrategiaDueDate ? differenceInDays(estrategiaDueDate, new Date()) : null;

  const isRedacaoOverdue = redacaoDueDate && isPast(redacaoDueDate) && !isToday(redacaoDueDate);
  const isDesignOverdue = designDueDate && isPast(designDueDate) && !isToday(designDueDate);
  const isEstrategiaOverdue = estrategiaDueDate && isPast(estrategiaDueDate) && !isToday(estrategiaDueDate);

  return (
    <div
      onClick={() => onClick?.(demand)}
      className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1 mr-2">
          {demand.title}
        </h3>
        <Badge variant="outline" className={cn("text-[10px] shrink-0 border", priority.class)}>
          {priority.label}
        </Badge>
      </div>

      {demand.client && (
        <p className="text-xs text-muted-foreground mb-2 truncate">{demand.client}</p>
      )}

      {demand.category && (
        <Badge variant="secondary" className="text-[10px] mb-3">
          {categoryLabels[demand.category] || demand.category}
        </Badge>
      )}

      {/* Datas de postagem e entrega (visível em cards de redação/design) */}
      {scheduledDate && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px]">
            <Calendar className="w-3 h-3 text-blue-500" />
            <span className="font-semibold text-blue-600">Postagem:</span>
            <span className="text-foreground">{format(scheduledDate, "dd/MMM", { locale: ptBR })}</span>
          </div>

          {redacaoDueDate && (
            <div className={cn(
              "flex items-center gap-1.5 text-[10px]",
              isRedacaoOverdue ? "text-red-600" : ""
            )}>
              <Clock className="w-3 h-3" />
              <span className="font-semibold">Redação:</span>
              <span>{format(redacaoDueDate, "dd/MMM", { locale: ptBR })}</span>
              {redacaoDaysLeft !== null && (
                <span className={cn("font-medium ml-auto", isRedacaoOverdue ? "text-red-600" : redacaoDaysLeft <= 2 ? "text-amber-500" : "text-muted-foreground")}>
                  {isRedacaoOverdue ? "⚠️" : redacaoDaysLeft === 0 ? "Hoje" : `${redacaoDaysLeft}d`}
                </span>
              )}
            </div>
          )}

          {designDueDate && (
            <div className={cn(
              "flex items-center gap-1.5 text-[10px]",
              isDesignOverdue ? "text-red-600" : ""
            )}>
              <Clock className="w-3 h-3" />
              <span className="font-semibold">Design:</span>
              <span>{format(designDueDate, "dd/MMM", { locale: ptBR })}</span>
              {designDaysLeft !== null && (
                <span className={cn("font-medium ml-auto", isDesignOverdue ? "text-red-600" : designDaysLeft <= 2 ? "text-amber-500" : "text-muted-foreground")}>
                  {isDesignOverdue ? "⚠️" : designDaysLeft === 0 ? "Hoje" : `${designDaysLeft}d`}
                </span>
              )}
            </div>
          )}

          {estrategiaDueDate && (
            <div className={cn(
              "flex items-center gap-1.5 text-[10px]",
              isEstrategiaOverdue ? "text-red-600" : ""
            )}>
              <Clock className="w-3 h-3" />
              <span className="font-semibold">Estratégia:</span>
              <span>{format(estrategiaDueDate, "dd/MMM", { locale: ptBR })}</span>
              {estrategiaDaysLeft !== null && (
                <span className={cn("font-medium ml-auto", isEstrategiaOverdue ? "text-red-600" : estrategiaDaysLeft <= 2 ? "text-amber-500" : "text-muted-foreground")}>
                  {isEstrategiaOverdue ? "⚠️" : estrategiaDaysLeft === 0 ? "Hoje" : `${estrategiaDaysLeft}d`}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Deadline genérico (fallback para demandas sem scheduled_date) */}
      {!scheduledDate && deadlineDate && (
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          {demand.assignee_name && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary">
                  {demand.assignee_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
                {demand.assignee_name}
              </span>
            </div>
          )}

          <div className={cn(
            "flex items-center gap-1 text-[11px]",
            isOverdue ? "text-red-500 font-medium" : daysLeft <= 2 ? "text-amber-500" : "text-muted-foreground"
          )}>
            <Clock className="w-3 h-3" />
            <span>
              {isOverdue
                ? "Atrasado"
                : daysLeft === 0
                ? "Hoje"
                : `${daysLeft}d`}
            </span>
          </div>
        </div>
      )}

      {/* Caso não tenha deadline nem scheduled_date, mostra assignee */}
      {!scheduledDate && !deadlineDate && demand.assignee_name && (
        <div className="flex items-center gap-1.5 pt-3 border-t border-border/60">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-[9px] font-bold text-primary">
              {demand.assignee_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
            {demand.assignee_name}
          </span>
        </div>
      )}
    </div>
  );
}