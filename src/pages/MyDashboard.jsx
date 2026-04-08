import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { getStepLabel, OFFICIAL_FLOW, STEPS } from "@/lib/flowConfig";
import { Loader2, Inbox, CheckCircle2, Clock, AlertTriangle, Trophy } from "lucide-react";
import { isPast, isToday, startOfMonth, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import MyTaskCard from "@/components/demands/MyTaskCard";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import DeadlineAlertsCompact from "@/components/dashboard/DeadlineAlertsCompact";
import MonthlyGoalsCard from "@/components/dashboard/MonthlyGoalsCard";
import MemberProfileCard from "@/components/profile/MemberProfileCard";
import NoticeBoard from "@/components/notices/NoticeBoard";
import CompletedByMeSection from "@/components/demands/CompletedByMeSection";

export default function MyDashboard() {
  const { member, isLoading: loadingMember } = useCurrentMember();
  const [selectedDemand, setSelectedDemand] = useState(null);

  // Mapeia os papéis do membro para as etapas que ele pode atuar
  const mySteps = useMemo(() => {
    const roleStepsMap = {
      estrategista: ["estrategia"],
      redator: ["redacao"],
      designer: ["design"],
      social_media: ["distribuicao"],
      gestor_trafego: ["trafego_pago"],
      admin: OFFICIAL_FLOW,
      cliente: ["aprovacao_cliente"]
    };
    
    const roles = Array.isArray(member?.role) ? member.role : [member?.role];
    const allSteps = new Set();
    roles.forEach((role) => {
      const steps = roleStepsMap[role] || [];
      steps.forEach((step) => allSteps.add(step));
    });
    return Array.from(allSteps);
  }, [member]);

  // Aplicar tema salvo ao carregar
  useEffect(() => {
    if (!member) return;
    if (member.theme === "dark") document.documentElement.classList.add("dark");else
    document.documentElement.classList.remove("dark");
  }, [member?.theme]);

  const { data: demands = [], refetch } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
    enabled: !!member
  });

  if (loadingMember) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>);


  if (!member) return (
    <div className="text-center py-20 text-muted-foreground">
      <p className="text-sm">Seu e-mail não está cadastrado na equipe.</p>
      <p className="text-xs mt-1">Peça ao administrador para te adicionar.</p>
    </div>);


  // Filtrar demandas que são minhas
  let myDemands;
  if (member.role === "cliente") {
    myDemands = demands.filter(
      (d) => d.current_step === "aprovacao_cliente" && d.client_id === member.client_id && d.status === "ativo"
    );
  } else {
    // Colaboradores: ver demandas onde é o responsável atual
    myDemands = demands.filter((d) => {
      if (d.current_step === "finalizado" || d.status !== "ativo") return false;
      
      // Se é admin, mostra todas as demandas ativas
      if (member.role === "admin") return true;
      
      // Verifica se o membro é assignee na etapa atual
      const assigneeThisStep = d.assignees?.[d.current_step];
      if (assigneeThisStep === member.email) return true;
      
      // Se ninguém foi atribuído e o membro tem esse role, pode agir
      if (!assigneeThisStep && mySteps.includes(d.current_step)) return true;
      
      return false;
    });
  }

  // Separar em urgentes/atrasadas e normais
  const isUrgent = (d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    if (!dl) return false;
    const date = new Date(dl);
    return isPast(date) && !isToday(date) || d.priority === "urgente";
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

  const roleLabel = member.role === "cliente" ?
  "Aprovações" :
  STEPS[OFFICIAL_FLOW[0]]?.label || member.role;

  // Ranking: contar aprovações por colaborador no histórico
  const rankingMap = {};
  demands.forEach((d) => {
    (d.history || []).forEach((h) => {
      if (h.acao === "aprovou" && h.usuario_email) {
        rankingMap[h.usuario_email] = (rankingMap[h.usuario_email] || 0) + 1;
      }
    });
  });
  const rankingSorted = Object.entries(rankingMap).sort((a, b) => b[1] - a[1]);
  const myRankPos = rankingSorted.findIndex(([email]) => email === member.email) + 1;

  // Concluídas no mês e no ano — conta aprovações (avanços de etapa), não status final
  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  
  const getApprovalsByMember = (targetDate) => {
    const approvals = new Set();
    demands.forEach((d) => {
      (d.history || []).forEach((h) => {
        if (h.acao === "aprovou" && h.usuario_email === member.email && h.date && new Date(h.date) >= targetDate) {
          approvals.add(d.id);
        }
      });
    });
    return approvals.size;
  };
  
  const concludedThisMonth = getApprovalsByMember(monthStart);
  const concludedThisYear = getApprovalsByMember(yearStart);

  // Demandas que você aprovou hoje (para mostrar como concluídas)
  const approvedToday = demands.filter((d) => {
    const lastApproval = [...(d.history || [])].reverse().find((h) => h.acao === "aprovou" && h.usuario_email === member.email);
    if (!lastApproval || !lastApproval.date) return false;
    return isToday(new Date(lastApproval.date));
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Perfil do membro */}
      <MemberProfileCard member={member} onUpdated={refetch} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Olá, {member.name.split(" ")[0]} 👋
            {myRankPos > 0 &&
            <span className="flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                <Trophy className="w-3.5 h-3.5" />
                #{myRankPos} ranking
              </span>
            }
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {member.role === "cliente" ?
            "Demandas aguardando sua aprovação" :
            `Suas tarefas como ${roleLabel}`}
          </p>
        </div>
      </div>

      {/* Quadro de Avisos */}
      <div className="bg-[#f1efea] p-5 rounded-xl border border-border">
        <NoticeBoard member={member} />
      </div>

      {/* Alertas de prazos */}
       <DeadlineAlertsCompact userEmail={member.email} />

       {/* Meta mensal */}
       <MonthlyGoalsCard demands={demands} member={member} concludedThisMonth={concludedThisMonth} />

       {/* Stats rápidas */}
       {total > 0 &&
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{concludedThisMonth}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Concluídas/mês</p>
          </div>
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-violet-600">{concludedThisYear}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Concluídas/ano</p>
          </div>
        </div>
      }

      {/* Atrasadas */}
      {overdue.length > 0 &&
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
      }

      {/* Urgentes (prioridade urgente mas não atrasadas) */}
      {urgent.length > 0 &&
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
      }

      {/* Concluídas por você hoje */}
      {approvedToday.length > 0 &&
      <section>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-emerald-600">Concluídas hoje ({approvedToday.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {approvedToday.map((d) => (
          <MyTaskCard key={d.id} demand={d} member={member} onUpdated={refetch} onOpenDetail={setSelectedDemand} />
            ))}
          </div>
        </section>
      }

      {/* Normais agrupadas por cliente */}
      {normal.length > 0 &&
      (() => {
        const byClient = {};
        normal.forEach((d) => {
          const key = d.client_name || "Sem cliente";
          if (!byClient[key]) byClient[key] = [];
          byClient[key].push(d);
        });
        return Object.entries(byClient).map(([clientName, clientDemands]) =>
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
        );
      })()
      }

      {/* Concluídas por mim (reabríveis) */}
      <CompletedByMeSection demands={demands} member={member} onOpenDetail={setSelectedDemand} />

      {/* Estado vazio */}
      {myDemands.length === 0 &&
      <div className="text-center py-20 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Tudo em dia!</p>
          <p className="text-xs mt-1">Nenhuma demanda aguardando sua ação.</p>
        </div>
      }

      <DemandDetailModal
        demand={selectedDemand}
        member={member}
        onClose={() => setSelectedDemand(null)}
        onUpdated={refetch} />
      
    </div>);

}