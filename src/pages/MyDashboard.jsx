import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { getStepsForRole, getStepLabel, getStepLight, STEPS } from "@/lib/flowConfig";
import DemandCardV2 from "@/components/demands/DemandCardV2";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Inbox } from "lucide-react";
import { isPast, isToday } from "date-fns";

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

  // Para clientes: ver demandas na etapa aprovacao_cliente com o client_id deles
  let myDemands;
  if (member.role === "cliente") {
    myDemands = demands.filter(
      (d) => d.current_step === "aprovacao_cliente" && d.client_id === member.client_id
    );
  } else {
    myDemands = demands.filter((d) => {
      if (!mySteps.includes(d.current_step)) return false;
      if (d.assignees?.[d.current_step] && d.assignees[d.current_step] !== member.email) return false;
      return true;
    });
  }

  const urgent = myDemands.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    if (!dl) return false;
    const date = new Date(dl);
    return (isPast(date) && !isToday(date)) || d.priority === "urgente";
  });

  const normal = myDemands.filter((d) => !urgent.includes(d));

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {member.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {member.role === "cliente"
            ? "Demandas aguardando sua aprovação"
            : `Suas tarefas em aberto — ${STEPS[mySteps[0]]?.label || member.role}`}
        </p>
      </div>

      {/* Urgentes */}
      {urgent.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h2 className="text-sm font-semibold text-red-600">Urgente / Atrasado ({urgent.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {urgent.map((d) => (
              <DemandCardV2 key={d.id} demand={d} onClick={setSelectedDemand} />
            ))}
          </div>
        </section>
      )}

      {/* Normais por cliente */}
      {normal.length > 0 ? (
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
                <h2 className="text-sm font-semibold">{clientName} ({clientDemands.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {clientDemands.map((d) => (
                  <DemandCardV2 key={d.id} demand={d} onClick={setSelectedDemand} />
                ))}
              </div>
            </section>
          ));
        })()
      ) : urgent.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma demanda aguardando sua ação.</p>
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