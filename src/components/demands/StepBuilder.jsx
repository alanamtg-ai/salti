import { STEPS } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";
import { GripVertical, X, Plus } from "lucide-react";
import { useState } from "react";

// Etapas disponíveis para adicionar (finalizado é fixo no fim)
const AVAILABLE_STEPS = [
  "estrategia",
  "redacao",
  "design",
  "aprovacao_cliente",
  "agendamento",
  "criar_campanha",
  "distribuicao",
  "trafego",
  "revisao_financeira",
];

export default function StepBuilder({ value = [], onChange }) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  // value sempre começa com as etapas escolhidas e termina com finalizado
  const steps = value.length > 0 ? value : ["finalizado"];

  const activeSteps = steps.filter((s) => s !== "finalizado");
  const unusedSteps = AVAILABLE_STEPS.filter((s) => !activeSteps.includes(s));

  const addStep = (step) => {
    onChange([...activeSteps, step, "finalizado"]);
  };

  const removeStep = (step) => {
    onChange([...activeSteps.filter((s) => s !== step), "finalizado"]);
  };

  const handleDragStart = (e, idx) => {
    setDragging(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    setDragOver(idx);
  };

  const handleDrop = (e, toIdx) => {
    e.preventDefault();
    if (dragging === null || dragging === toIdx) return;
    const reordered = [...activeSteps];
    const [moved] = reordered.splice(dragging, 1);
    reordered.splice(toIdx, 0, moved);
    onChange([...reordered, "finalizado"]);
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Finalizado é fixo. Adicione etapas e arraste para reordenar.</p>

      {/* Etapas ativas */}
      <div className="space-y-1.5">
        {/* Etapas arrastáveis */}
        {activeSteps.map((step, idx) => (
          <div
            key={step}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={() => { setDragging(null); setDragOver(null); }}
            className={cn(
              "flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing transition-all",
              dragOver === idx && dragging !== idx && "border-primary bg-primary/5"
            )}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className={cn("w-2 h-2 rounded-full shrink-0", STEPS[step]?.color || "bg-slate-400")} />
            <span className="text-xs font-medium flex-1">{STEPS[step]?.label || step}</span>
            <button
              type="button"
              onClick={() => removeStep(step)}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Finalizado fixo */}
        <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 opacity-60">
          <span className={cn("w-2 h-2 rounded-full shrink-0", STEPS.finalizado.color)} />
          <span className="text-xs font-medium flex-1">{STEPS.finalizado.label}</span>
          <span className="text-[10px] text-muted-foreground">fixo</span>
        </div>
      </div>

      {/* Etapas disponíveis para adicionar */}
      {unusedSteps.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Adicionar etapa</p>
          <div className="flex flex-wrap gap-1.5">
            {unusedSteps.map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => addStep(step)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-dashed border-border hover:border-primary hover:text-primary transition-colors bg-background"
              >
                <Plus className="w-3 h-3" />
                {STEPS[step]?.label || step}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}