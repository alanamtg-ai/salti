import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Layers, Clock, CheckCircle2, AlertTriangle, Plus, TrendingUp } from "lucide-react";
import { isPast, isToday, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import StatsCard from "@/components/dashboard/StatsCard";
import DemandForm from "@/components/demands/DemandForm";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityConfig = {
  baixa: { label: "Baixa", class: "bg-emerald-100 text-emerald-700" },
  media: { label: "Média", class: "bg-amber-100 text-amber-700" },
  alta: { label: "Alta", class: "bg-orange-100 text-orange-700" },
  urgente: { label: "Urgente", class: "bg-red-100 text-red-700" },
};

const statusLabels = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  em_revisao: "Em Revisão",
  concluido: "Concluído",
};

export default function Dashboard() {
  const [formOpen, setFormOpen] = useState(false);

  const { data: demands = [], refetch } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 200),
  });

  const total = demands.length;
  const completed = demands.filter((d) => d.status === "concluido").length;
  const inProgress = demands.filter((d) => d.status === "em_andamento").length;
  const overdue = demands.filter((d) => {
    if (!d.deadline || d.status === "concluido") return false;
    return isPast(new Date(d.deadline)) && !isToday(new Date(d.deadline));
  }).length;

  const recentDemands = demands
    .filter((d) => d.status !== "concluido")
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral das suas demandas</p>
        </div>
        <div className="flex gap-2">
          <Link to="/kanban">
            <Button variant="outline" size="sm">Ver Kanban</Button>
          </Link>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Demanda
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total" value={total} icon={Layers} iconBg="bg-primary/10" />
        <StatsCard title="Em Andamento" value={inProgress} icon={Clock} iconBg="bg-blue-100" />
        <StatsCard title="Concluídas" value={completed} subtitle={total > 0 ? `${Math.round((completed / total) * 100)}% do total` : undefined} icon={CheckCircle2} iconBg="bg-emerald-100" />
        <StatsCard title="Atrasadas" value={overdue} icon={AlertTriangle} iconBg="bg-red-100" />
      </div>

      {/* Recent active demands */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Demandas Ativas</h2>
          <Link to="/kanban" className="text-xs text-primary font-medium hover:underline">Ver todas →</Link>
        </div>
        <div className="divide-y divide-border">
          {recentDemands.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma demanda ativa. Crie sua primeira demanda!
            </div>
          )}
          {recentDemands.map((d) => {
            const deadlineDate = d.deadline ? new Date(d.deadline) : null;
            const isOverdue = deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate);
            return (
              <div key={d.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {d.client && `${d.client} · `}{statusLabels[d.status]}
                  </p>
                </div>
                {d.assignee_name && (
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">{d.assignee_name.charAt(0)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{d.assignee_name}</span>
                  </div>
                )}
                <Badge variant="outline" className={cn("text-[10px] shrink-0", priorityConfig[d.priority]?.class)}>
                  {priorityConfig[d.priority]?.label}
                </Badge>
                {deadlineDate && (
                  <span className={cn("text-[11px] shrink-0", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
                    {format(deadlineDate, "dd MMM", { locale: ptBR })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DemandForm open={formOpen} onClose={() => setFormOpen(false)} onSave={refetch} />
    </div>
  );
}