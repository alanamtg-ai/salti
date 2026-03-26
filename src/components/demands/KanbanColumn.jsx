import DemandCard from "./DemandCard";
import { cn } from "@/lib/utils";

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-slate-400" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500" },
  em_revisao: { label: "Em Revisão", color: "bg-amber-500" },
  concluido: { label: "Concluído", color: "bg-emerald-500" },
};

export default function KanbanColumn({ status, demands, onCardClick, onDrop }) {
  const config = statusConfig[status];

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-primary/5");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("bg-primary/5");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-primary/5");
    const demandId = e.dataTransfer.getData("demandId");
    if (demandId) onDrop(demandId, status);
  };

  return (
    <div
      className="flex-1 min-w-[280px] max-w-[360px] rounded-xl bg-muted/50 transition-colors"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-4 pb-2 flex items-center gap-2">
        <div className={cn("w-2.5 h-2.5 rounded-full", config.color)} />
        <h3 className="font-semibold text-sm text-foreground">{config.label}</h3>
        <span className="ml-auto text-xs font-medium text-muted-foreground bg-background rounded-full px-2 py-0.5">
          {demands.length}
        </span>
      </div>
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-260px)] overflow-y-auto">
        {demands.map((demand) => (
          <div
            key={demand.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("demandId", demand.id);
            }}
          >
            <DemandCard demand={demand} onClick={onCardClick} />
          </div>
        ))}
        {demands.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Nenhuma demanda
          </div>
        )}
      </div>
    </div>
  );
}