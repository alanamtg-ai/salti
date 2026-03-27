import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { getStepsForRole, getStepLabel, STEPS } from "@/lib/flowConfig";
import MyTaskCard from "@/components/demands/MyTaskCard";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import { useState } from "react";
import { Loader2, Inbox, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";

export default function MyDashboard() {
  const { member, isLoading: loadingMember } = useCurrentMember();
  const [selectedDemand, setSelectedDemand] = useState(null);

  const { data: demands = [], refetch } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
    enabled: !!member,
  });

  if (loadingMember) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!member) return (
    <div className="text-center py-20 text-muted-foreground">
      <p className="text-sm">Seu e-mail não está cadastrado na equipe.</p>
      <p className="text-xs mt-1">Peça ao administrador para te adicionar.</p>
    </div>
  );

  const mySteps = getStepsForRole(member.role);

  // Filtrar demandas que são minhas
  let myDemands;
  if (member.role === "cliente") {
    myDemands = demands.filter(
      (d) => d.current_step === "aprovacao_cliente" && d.client_id === member.client_id
    );
  } else {
    myDemands = demands.filter((d) => {
      if (d.current_step === "publicado") return false;
      if (!mySteps.includes(d.current_step)) return false;
      // Se tem responsável definido, filtra pelo email
      if (d.assignees?.[d.current_step] && d.assignees[d.current_step] !== member.email) return false;
      return true;
    });
  }

  // Separar em urgentes/atrasadas e normais
  const isUrgent = (d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    if (!dl) return false;
    const date = new Date(dl);
    return (isPast(date) && !isToday(date)) || d.priority === "urgente";
  };

  const overdue = myDemands.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    if (!dl) return false;
    return isPast(new Date(dl)) && !isToday(new Date(dl));
  });

  const urgent = myDemands.filter((d) => d.priority === "urgente" && !overdue.includes(d));
  const normal = myDemands.filter((d) => !overdue.includes(d) && !urgent.includes(d));

  // Stats
  const total = myDemands.length;
  const overdueCount = overdue.length;
  const dueToday = myDemands.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    return dl && isToday(new Date(dl));
  }).length;

  const roleLabel = member.role === "cliente"
    ? "Aprovações"
    : STEPS[mySteps[0]]?.label || member.role;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {member.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {member.role === "cliente"
              ? "Demandas aguardando sua aprovação"
              : `Suas tarefas como ${roleLabel}`}
          </p>
        </div>
      </div>

      {/* Stats rápidas */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Em aberto</p>
          </div>
          <div className={cn("rounded-xl border p-3 text-center", overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-card border-border")}>
            <p className={cn("text-2xl font-bold", overdueCount > 0 ? "text-red-600" : "text-foreground")}>{overdueCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Atrasadas</p>
          </div>
          <div className={cn("rounded-xl border p-3 text-center", dueToday > 0 ? "bg-amber-50 border-amber-200" : "bg-card border-border")}>
            <p className={cn("text-2xl font-bold", dueToday > 0 ? "text-amber-600" : "text-foreground")}>{dueToday}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Vencem hoje</p>
          </div>
        </div>
      )}

      {/* Atrasadas */}
      {overdue.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-600">Atrasadas ({overdue.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {overdue.map((d) => (
              <MyTaskCard key={d.id} demand={d} member={member} onUpdated={refetch} onOpenDetail={setSelectedDemand} />
            ))}
          </div>
        </section>
      )}

      {/* Urgentes (prioridade urgente mas não atrasadas) */}
      {urgent.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-orange-600">Urgentes ({urgent.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {urgent.map((d) => (
              <MyTaskCard key={d.id} demand={d} member={member} onUpdated={refetch} onOpenDetail={setSelectedDemand} />
            ))}
          </div>
        </section>
      )}

      {/* Normais agrupadas por cliente */}
      {normal.length > 0 && (
        (() => {
          const byClient = {};
          normal.forEach((d) => {
            const key = d.client_name || "Sem cliente";
            if (!byClient[key]) byClient[key] = [];
            byClient[key].push(d);
          });
          return Object.entries(byClient).map(([clientName, clientDemands]) => (
            <section key={clientName}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h2 className="text-sm font-semibold">{clientName} <span className="text-muted-foreground font-normal">({clientDemands.length})</span></h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {clientDemands.map((d) => (
                  <MyTaskCard key={d.id} demand={d} member={member} onUpdated={refetch} onOpenDetail={setSelectedDemand} />
                ))}
              </div>
            </section>
          ));
        })()
      )}

      {/* Estado vazio */}
      {myDemands.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Tudo em dia!</p>
          <p className="text-xs mt-1">Nenhuma demanda aguardando sua ação.</p>
        </div>
      )}

      <DemandDetailModal
        demand={selectedDemand}
        member={member}
        onClose={() => setSelectedDemand(null)}
        onUpdated={refetch}
      />
    </div>
  );
}