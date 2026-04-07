import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Repeat, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import RecurringDemandForm from "@/components/demands/RecurringDemandForm";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const priorityConfig = {
  baixa:   { label: "Baixa",   cls: "bg-emerald-100 text-emerald-700" },
  media:   { label: "Média",   cls: "bg-amber-100 text-amber-700" },
  alta:    { label: "Alta",    cls: "bg-orange-100 text-orange-700" },
  urgente: { label: "Urgente", cls: "bg-red-100 text-red-700" },
};

const recurrenceLabel = (r) => {
  if (r.recurrence_type === "monthly") return `Todo dia ${r.recurrence_day_of_month} do mês`;
  if (r.recurrence_type === "weekly") {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return `Toda ${days[r.recurrence_day_of_week] || "semana"}`;
  }
  return "Diária";
};

export default function RecurringDemands() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: recurring = [], refetch } = useQuery({
    queryKey: ["recurring_demands"],
    queryFn: () => base44.entities.RecurringDemand.list("-created_date"),
  });

  const handleToggle = async (r) => {
    await base44.entities.RecurringDemand.update(r.id, { active: !r.active });
    refetch();
  };

  const handleDelete = async (id) => {
    await base44.entities.RecurringDemand.delete(id);
    refetch();
  };

  const handleEdit = (r) => { setEditing(r); setFormOpen(true); };

  const openNew = () => { setEditing(null); setFormOpen(true); };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Repeat className="w-6 h-6 text-primary" /> Demandas Recorrentes
          </h1>
          <p className="text-sm text-muted-foreground">Tarefas que se repetem automaticamente no fluxo</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Nova Recorrência
        </Button>
      </div>

      {recurring.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Repeat className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nenhuma demanda recorrente cadastrada.</p>
          <Button size="sm" className="mt-4" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" /> Criar primeira recorrência
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurring.map((r) => (
          <div
            key={r.id}
            className={cn(
              "bg-card border border-border rounded-xl p-4 space-y-3 transition-opacity",
              !r.active && "opacity-50"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">{r.client_name}</p>
              </div>
              <Badge className={cn("text-[10px] shrink-0", priorityConfig[r.priority]?.cls)}>
                {priorityConfig[r.priority]?.label}
              </Badge>
            </div>

            {/* Recorrência */}
            <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
              <Repeat className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-medium text-primary">{recurrenceLabel(r)}</span>
            </div>

            {/* Descrição */}
            {r.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
            )}

            {/* Última geração */}
            {r.last_generated_date && (
              <p className="text-[10px] text-muted-foreground">
                Última geração: {format(new Date(r.last_generated_date), "dd/MM/yyyy HH:mm")}
              </p>
            )}

            {/* Status + ações */}
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <button
                onClick={() => handleToggle(r)}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              >
                {r.active
                  ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                  : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                <span className={r.active ? "text-emerald-600" : "text-muted-foreground"}>
                  {r.active ? "Ativa" : "Pausada"}
                </span>
              </button>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(r)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <RecurringDemandForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={refetch}
        editing={editing}
      />
    </div>
  );
}