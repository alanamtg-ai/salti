import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import KanbanColumn from "@/components/demands/KanbanColumn";
import DemandForm from "@/components/demands/DemandForm";
import { format } from "date-fns";

const COLUMNS = ["pendente", "em_andamento", "em_revisao", "concluido"];

export default function Kanban() {
  const [formOpen, setFormOpen] = useState(false);
  const [editDemand, setEditDemand] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: demands = [], refetch } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
  });

  const filtered = demands.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.title?.toLowerCase().includes(q) ||
      d.client?.toLowerCase().includes(q) ||
      d.assignee_name?.toLowerCase().includes(q)
    );
  });

  const handleDrop = async (demandId, newStatus) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand || demand.status === newStatus) return;

    const updateData = { status: newStatus };
    if (newStatus === "concluido" && !demand.completed_date) {
      updateData.completed_date = format(new Date(), "yyyy-MM-dd");
    }
    if (newStatus !== "concluido") {
      updateData.completed_date = "";
    }

    await base44.entities.Demand.update(demandId, updateData);
    refetch();
  };

  const handleCardClick = (demand) => {
    setEditDemand(demand);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditDemand(null);
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Kanban</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Arraste para mover entre colunas</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button size="sm" onClick={() => { setEditDemand(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Nova
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            demands={filtered.filter((d) => d.status === status)}
            onCardClick={handleCardClick}
            onDrop={handleDrop}
          />
        ))}
      </div>

      <DemandForm
        open={formOpen}
        onClose={handleFormClose}
        onSave={refetch}
        demand={editDemand}
      />
    </div>
  );
}