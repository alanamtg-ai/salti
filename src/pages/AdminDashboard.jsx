import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Layers, AlertTriangle, Clock, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import DemandCardV2 from "@/components/demands/DemandCardV2";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import NewDemandForm from "@/components/demands/NewDemandForm";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { getStepLabel, getStepLight } from "@/lib/flowConfig";

const STEP_ORDER = ["estrategista", "redator", "designer", "aprovacao_interna", "aprovacao_cliente", "social_media", "publicado"];

export default function AdminDashboard() {
  const { member } = useCurrentMember();
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: demands = [], refetch } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
  });
  const { data: members = [] } = useQuery({ queryKey: ["team_members"], queryFn: () => base44.entities.TeamMember.list() });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });

  const active = demands.filter((d) => d.current_step !== "publicado");
  const overdue = active.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    return dl && isPast(new Date(dl)) && !isToday(new Date(dl));
  });

  // Por etapa
  const byStep = STEP_ORDER.map((step) => ({
    step,
    demands: demands.filter((d) => d.current_step === step),
  })).filter((s) => s.demands.length > 0);

  // Por membro
  const byMember = members
    .filter((m) => m.role !== "cliente")
    .map((m) => ({
      member: m,
      demands: active.filter((d) => {
        const stepForMember = Object.keys(d.assignees || {}).find(
          (s) => d.assignees[s] === m.email && d.current_step === s
        );
        return !!stepForMember;
      }),
    }))
    .filter((x) => x.demands.length > 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">Controle completo de todas as demandas</p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nova Demanda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Ativas", value: active.length, icon: Layers, bg: "bg-primary/10" },
          { label: "Atrasadas", value: overdue.length, icon: AlertTriangle, bg: "bg-red-100" },
          { label: "Clientes", value: clients.length, icon: Users, bg: "bg-emerald-100" },
          { label: "Publicadas", value: demands.filter(d => d.current_step === "publicado").length, icon: CheckCircle2, bg: "bg-sky-100" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.bg)}>
                <s.icon className="w-5 h-5 text-foreground/60" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Por etapa */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Por Etapa</h2>
          <Link to="/clientes" className="text-xs text-primary hover:underline">Ver por cliente →</Link>
        </div>
        <div className="divide-y divide-border">
          {byStep.map(({ step, demands: stepDemands }) => (
            <div key={step} className="px-5 py-3 flex items-center gap-4">
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full w-36 text-center shrink-0", getStepLight(step))}>
                {getStepLabel(step)}
              </span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {stepDemands.slice(0, 5).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDemand(d)}
                    className="text-xs bg-muted rounded-lg px-2 py-1 hover:bg-muted/80 transition-colors truncate max-w-[160px]"
                    title={d.title}
                  >
                    {d.title}
                  </button>
                ))}
                {stepDemands.length > 5 && (
                  <span className="text-xs text-muted-foreground px-2 py-1">+{stepDemands.length - 5}</span>
                )}
              </div>
              <span className="text-sm font-bold text-muted-foreground shrink-0">{stepDemands.length}</span>
            </div>
          ))}
          {byStep.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma demanda ativa</div>
          )}
        </div>
      </div>

      {/* Por membro */}
      {byMember.length > 0 && (
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Aguardando por Membro</h2>
          </div>
          <div className="divide-y divide-border">
            {byMember.map(({ member: m, demands: md }) => (
              <div key={m.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2 w-36 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{m.name.charAt(0)}</span>
                  </div>
                  <span className="text-xs font-medium truncate">{m.name}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {md.slice(0, 4).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDemand(d)}
                      className="text-xs bg-muted rounded-lg px-2 py-1 hover:bg-muted/80 transition-colors truncate max-w-[140px]"
                    >
                      {d.title}
                    </button>
                  ))}
                  {md.length > 4 && <span className="text-xs text-muted-foreground px-2 py-1">+{md.length - 4}</span>}
                </div>
                <span className="text-sm font-bold text-muted-foreground shrink-0">{md.length}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DemandDetailModal demand={selectedDemand} member={member} onClose={() => setSelectedDemand(null)} onUpdated={refetch} />
      <NewDemandForm open={formOpen} onClose={() => setFormOpen(false)} onSave={refetch} />
    </div>
  );
}