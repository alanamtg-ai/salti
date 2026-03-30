import { useMemo } from "react";
import { format, isToday, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getStepLabel, getStepLight } from "@/lib/flowConfig";
import { CalendarDays, AlertTriangle, Clock } from "lucide-react";

const priorityDot = {
  urgente: "bg-red-500",
  alta: "bg-orange-400",
  media: "bg-amber-400",
  baixa: "bg-emerald-400",
};

function getDeadlineForDemand(demand) {
  return demand.step_deadlines?.[demand.current_step] || demand.deadline || null;
}

export default function TodayCalendar({ demands, onOpenDetail }) {
  const today = new Date();

  // Agrupar por data de prazo (etapa atual ou geral)
  const grouped = useMemo(() => {
    // Pega todos os prazos dos próximos 7 dias + atrasados
    const map = {}; // "YYYY-MM-DD" -> []

    demands
      .filter((d) => d.current_step !== "publicado")
      .forEach((d) => {
        const dl = getDeadlineForDemand(d);
        if (!dl) return;
        const key = dl.slice(0, 10); // "YYYY-MM-DD"
        if (!map[key]) map[key] = [];
        map[key].push(d);
      });

    // Ordena as chaves
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 14); // máximo 14 dias
  }, [demands]);

  // Separa atrasadas
  const overdue = demands.filter((d) => {
    if (d.current_step === "publicado") return false;
    const dl = getDeadlineForDemand(d);
    if (!dl) return false;
    const date = parseISO(dl);
    return isPast(date) && !isToday(date);
  });

  const todayStr = format(today, "yyyy-MM-dd");

  return (
    <div className="bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        <div>
          <h2 className="font-semibold">Calendário de Atividades</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {/* Atrasadas */}
        {overdue.length > 0 && (
          <div className="px-5 py-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600">Atrasadas ({overdue.length})</span>
            </div>
            <div className="space-y-1.5">
              {overdue.map((d) => (
                <DemandChip key={d.id} demand={d} onClick={() => onOpenDetail(d)} overdue />
              ))}
            </div>
          </div>
        )}

        {/* Por data */}
        {grouped.length === 0 && overdue.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
            Nenhuma atividade com prazo definido
          </div>
        )}

        {grouped.map(([dateStr, dayDemands]) => {
          const dateObj = parseISO(dateStr);
          const isOverdueBucket = isPast(dateObj) && !isToday(dateObj);
          if (isOverdueBucket) return null; // já mostradas acima

          const isTodayBucket = dateStr === todayStr;
          const label = isTodayBucket
            ? "Hoje"
            : format(dateObj, "EEE, d 'de' MMM", { locale: ptBR });

          return (
            <div key={dateStr} className={cn("px-5 py-3", isTodayBucket && "bg-primary/5")}>
              <div className="flex items-center gap-2 mb-2">
                {isTodayBucket && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
                <span className={cn(
                  "text-xs font-semibold capitalize",
                  isTodayBucket ? "text-primary" : "text-muted-foreground"
                )}>
                  {label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {dayDemands.length} item{dayDemands.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1.5">
                {dayDemands.map((d) => (
                  <DemandChip key={d.id} demand={d} onClick={() => onOpenDetail(d)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DemandChip({ demand, onClick, overdue }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all hover:shadow-sm group",
        overdue
          ? "bg-red-50 border-red-100 hover:border-red-300"
          : "bg-background border-border hover:border-primary/30 hover:bg-primary/5"
      )}
    >
      <span className={cn("w-2 h-2 rounded-full shrink-0", priorityDot[demand.priority] || "bg-muted")} />
      <span className="text-xs font-medium flex-1 truncate group-hover:text-primary transition-colors">
        {demand.title}
      </span>
      <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">{demand.client_name}</span>
      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full shrink-0", getStepLight(demand.current_step))}>
        {getStepLabel(demand.current_step)}
      </span>
    </button>
  );
}