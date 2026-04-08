import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentMember } from "@/lib/useCurrentMember";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import { useState } from "react";
import { Inbox, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { getStepLight, getStepLabel } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityLabel = { urgente: "Urgente", alta: "Alta", media: "Média", baixa: "Baixa" };
const priorityStyle = {
  urgente: "bg-red-100 text-red-700",
  alta: "bg-orange-100 text-orange-700",
  media: "bg-amber-100 text-amber-700",
  baixa: "bg-emerald-100 text-emerald-700",
};

export default function ClientDashboard() {
  const { member, isLoading } = useCurrentMember();
  const [selected, setSelected] = useState(null);

  const { data: demands = [], refetch } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
    enabled: !!member,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  // Admins veem tudo; clientes veem só as suas
  const isAdmin = member?.role === "admin";
  const clientFilter = (d) => isAdmin || d.client_id === member?.client_id;

  // Demandas aguardando aprovação deste cliente
  const pending = demands.filter(
    (d) => d.current_step === "aprovacao_cliente" && clientFilter(d)
  );

  const approved = demands.filter(
    (d) => d.status === "finalizado" && clientFilter(d)
  );

  // Demandas avulsas (ativas, mas não aguardando aprovação do cliente)
  const freelance = demands.filter(
    (d) => d.status === "ativo" && clientFilter(d) && d.current_step !== "aprovacao_cliente"
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {member?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Demandas aguardando sua aprovação
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className={cn("rounded-xl border p-4 text-center", pending.length > 0 ? "bg-orange-50 border-orange-200" : "bg-card border-border")}>
          <p className={cn("text-3xl font-bold", pending.length > 0 ? "text-orange-600" : "text-foreground")}>{pending.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Aguardando aprovação</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{freelance.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Demandas avulsas</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{approved.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Publicadas</p>
        </div>
      </div>

      {/* Demandas avulsas */}
      {freelance.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Demandas avulsas em andamento
          </h2>
          <div className="grid gap-3">
            {freelance.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className="w-full text-left bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm">{d.title}</p>
                  {d.priority && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium", priorityStyle[d.priority])}>
                      {priorityLabel[d.priority]}
                    </span>
                  )}
                </div>
                {d.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{d.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStepLight(d.current_step))}>
                    {getStepLabel(d.current_step)}
                  </span>
                  <span className="text-xs text-muted-foreground">Em andamento</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de pendências */}
      {pending.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Inbox className="w-4 h-4 text-orange-500" />
            Pendentes de aprovação
          </h2>
          {pending.map((d) => {
            const dl = d.step_deadlines?.aprovacao_cliente || d.deadline;
            const isOverdue = dl && isPast(new Date(dl)) && !isToday(new Date(dl));
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className={cn(
                  "w-full text-left bg-card rounded-xl border p-4 hover:shadow-md transition-all hover:border-primary/30",
                  isOverdue && "border-red-200 bg-red-50"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm">{d.title}</p>
                  {d.priority && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium", priorityStyle[d.priority])}>
                      {priorityLabel[d.priority]}
                    </span>
                  )}
                </div>
                {d.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{d.description}</p>
                )}
                <div className="flex items-center justify-between">
                  {dl && (
                    <span className={cn("text-xs", isOverdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
                      {isOverdue ? "⚠ Atrasada — " : "Prazo: "}
                      {format(new Date(dl), "d 'de' MMM", { locale: ptBR })}
                    </span>
                  )}
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium ml-auto">
                    Aguardando sua aprovação
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Nenhuma aprovação pendente!</p>
          <p className="text-xs mt-1">Avisaremos quando houver conteúdo para revisar.</p>
        </div>
      )}

      <DemandDetailModal
        demand={selected}
        member={member}
        onClose={() => setSelected(null)}
        onUpdated={refetch}
      />
    </div>
  );
}