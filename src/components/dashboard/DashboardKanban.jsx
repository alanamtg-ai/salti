import { useState, useMemo, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OFFICIAL_FLOW, getStepLabel, getStepLight } from "@/lib/flowConfig";

const priorityConfig = {
  baixa: "bg-emerald-100 text-emerald-700",
  media: "bg-amber-100 text-amber-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

function DemandCard({ demand, index, onUpdated }) {
  const stepDeadline = demand.step_deadlines?.[demand.current_step];
  const deadlineDate = stepDeadline || demand.deadline;
  const isOverdue = deadlineDate && isPast(new Date(deadlineDate)) && !isToday(new Date(deadlineDate));
  const daysLeft = deadlineDate ? differenceInDays(new Date(deadlineDate), new Date()) : null;

  return (
    <Draggable draggableId={demand.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-white rounded-lg border p-3 cursor-move transition-all",
            snapshot.isDragging
              ? "shadow-lg border-primary opacity-90"
              : "border-border hover:border-primary/50 hover:shadow-md"
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-xs font-semibold text-foreground line-clamp-2 flex-1">{demand.title}</h4>
            <Badge variant="outline" className={cn("text-[9px] shrink-0", priorityConfig[demand.priority])}>
              {demand.priority}
            </Badge>
          </div>

          <p className="text-[10px] text-muted-foreground mb-2 truncate">{demand.client_name}</p>

          {demand.rejection_note && (
            <div className="text-[9px] text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-1 mb-2 line-clamp-1">
              ↩ {demand.rejection_note}
            </div>
          )}

          <div className="flex items-center justify-between">
            {deadlineDate ? (
              <span className={cn("flex items-center gap-1 text-[9px] font-medium",
                isOverdue ? "text-red-600" : daysLeft !== null && daysLeft <= 2 ? "text-amber-600" : "text-muted-foreground"
              )}>
                <Clock className="w-2.5 h-2.5" />
                {isOverdue ? `Atrasado ${Math.abs(daysLeft)}d` : daysLeft === 0 ? "Vence hoje" : `${daysLeft}d`}
              </span>
            ) : (
              <span className="text-[9px] text-muted-foreground">Sem prazo</span>
            )}
            {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500" />}
          </div>
        </div>
      )}
    </Draggable>
  );
}

function KanbanColumn({ step, demands, onDragEnd, isLoading }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 flex-shrink-0 w-72 h-fit">
      <div className="mb-3">
        <h3 className={cn("text-xs font-bold px-2.5 py-1 rounded-full w-fit", getStepLight(step))}>
          {getStepLabel(step)}
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">{demands.length} demanda{demands.length !== 1 ? "s" : ""}</p>
      </div>

      <Droppable droppableId={step} type="DEMAND">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "space-y-2 min-h-[400px] rounded-lg transition-colors p-2",
              snapshot.isDraggingOver ? "bg-primary/5 border-2 border-dashed border-primary" : "bg-transparent"
            )}
          >
            {demands.map((demand, idx) => (
              <DemandCard key={demand.id} demand={demand} index={idx} onUpdated={() => {}} />
            ))}
            {provided.placeholder}
            {demands.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-20 text-muted-foreground text-[10px]">
                Nenhuma demanda
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function DashboardKanban({ demands = [], member, onUpdated, flowSteps = OFFICIAL_FLOW }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const demandsByStep = useMemo(() => {
    const grouped = {};
    flowSteps.forEach((step) => { grouped[step] = []; });
    demands.forEach((d) => {
      if (d.status !== "ativo") return;
      const step = d.current_step;
      if (grouped[step]) grouped[step].push(d);
    });
    return grouped;
  }, [demands, flowSteps]);

  const handleDragEnd = useCallback(async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const demand = demands.find((d) => d.id === draggableId);
    if (!demand) return;

    const newStep = destination.droppableId;
    const stepIndex = flowSteps.indexOf(newStep);

    if (stepIndex === -1) return;

    setIsUpdating(true);
    await base44.entities.Demand.update(draggableId, {
      current_step: newStep,
      current_step_index: stepIndex,
      step_started_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      rejection_note: "",
      history: [
        ...(demand.history || []),
        {
          etapa_origem: demand.current_step,
          etapa_destino: newStep,
          acao: "movido",
          usuario_nome: member?.name || "Sistema",
          usuario_email: member?.email || "sistema",
          date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        }
      ]
    });
    setIsUpdating(false);
    onUpdated?.();
  }, [demands, flowSteps, member, onUpdated]);

  return (
    <div className="relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center z-50 backdrop-blur-sm">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4 -mx-6 px-6">
          <div className="flex gap-4 min-w-max">
            {flowSteps.map((step) => (
              <KanbanColumn
                key={step}
                step={step}
                demands={demandsByStep[step] || []}
                onDragEnd={handleDragEnd}
                isLoading={isUpdating}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}