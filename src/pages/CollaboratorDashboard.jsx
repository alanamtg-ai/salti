import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentMember } from "@/lib/useCurrentMember";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import MyTaskCard from "@/components/demands/MyTaskCard";
import { useState, useMemo, useEffect } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Clock, Trophy, Star, Send } from "lucide-react";
import NoticeBoard from "@/components/notices/NoticeBoard";
import CompletedByMeSection from "@/components/demands/CompletedByMeSection";
import MemberProfileCard from "@/components/profile/MemberProfileCard";
import DeadlineAlertsCompact from "@/components/dashboard/DeadlineAlertsCompact";
import MonthlyGoalsCard from "@/components/dashboard/MonthlyGoalsCard";
import { getStepLabel, STEPS, OFFICIAL_FLOW } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";
import { isPast, isToday, differenceInDays, parseISO, addDays, startOfMonth, startOfWeek, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CollaboratorDashboard() {
  const { member, isLoading } = useCurrentMember();
  const [selected, setSelected] = useState(null);

  // Aplicar tema salvo ao carregar
  useEffect(() => {
    if (!member) return;
    if (member.theme === "dark") document.documentElement.classList.add("dark");else
    document.documentElement.classList.remove("dark");
  }, [member?.theme]);

  const { data: demands = [], refetch } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
    enabled: !!member,
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const mySteps = useMemo(() => {
    // Mapeia os papéis do membro para as etapas que ele pode atuar
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

  // Ranking da equipe
  const ranking = useMemo(() => {
    const scores = {};
    demands.forEach((d) => {
      (d.history || []).forEach((h) => {
        if ((h.acao !== "aprovado" && h.action !== "avançado") || !h.by) return;
        if (!scores[h.by]) scores[h.by] = { name: h.by_name || h.by, count: 0 };
        scores[h.by].count++;
      });
    });
    allMembers.forEach((m) => { if (scores[m.email]) scores[m.email].name = m.name; });
    return Object.entries(scores)
      .map(([email, v]) => ({ email, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [demands, allMembers]);

  const myRankPos = ranking.findIndex((r) => r.email === member?.email);

  // Minhas tarefas abertas
  const myDemands = useMemo(() => {
    if (!member) return [];
    return demands.filter((d) => {
      if (d.current_step === "finalizado" || d.status !== "ativo") return false;
      if (!mySteps.includes(d.current_step)) return false;
      
      // Verifica se é assignee na etapa atual
      const assigneeThisStep = d.assignees?.[d.current_step];
      if (assigneeThisStep === member.email) return true;
      
      // Se ninguém foi atribuído, pode agir
      if (!assigneeThisStep) return true;
      
      return false;
    });
  }, [demands, member, mySteps]);

  // Métricas pessoais via history — conta apenas aprovações nas etapas do papel do membro
  const metrics = useMemo(() => {
    if (!member) return { delivered: 0, avgDays: 0 };
    let delivered = 0;
    let totalDays = 0;
    let countDays = 0;

    demands.forEach((d) => {
      const history = d.history || [];
      history.forEach((h, i) => {
        if (h.by !== member.email) return;
        if (h.acao !== "aprovado" && h.action !== "avançado") return;
        // Só conta se a etapa de origem é uma etapa do papel desse membro
        if (h.etapa_origem && !mySteps.includes(h.etapa_origem)) return;
        delivered++;
        const prev = history[i - 1];
        if (prev?.date && h.date) {
          const days = Math.abs(differenceInDays(parseISO(h.date), parseISO(prev.date)));
          if (days <= 30) { totalDays += days; countDays++; }
        }
      });
    });

    return {
      delivered,
      avgDays: countDays > 0 ? (totalDays / countDays).toFixed(1) : null,
    };
  }, [demands, member, mySteps]);

  const overdue = myDemands.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    return dl && isPast(new Date(dl)) && !isToday(new Date(dl));
  });
  const normal = myDemands.filter((d) => !overdue.includes(d));

  const now = new Date();
  const in48h = addDays(now, 2);

  // Vencem em breve (próximas 48h)
  const dueSoon = myDemands.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    if (!dl) return false;
    const dlDate = new Date(dl);
    return isBefore(dlDate, in48h) && !isPast(dlDate);
  }).length;

  const getGreeting = () => {
    const day = now.getDay();
    const greetings = [
      "Que domingo produtivo!",
      "Segunda é hora de bombar!",
      "Terça em ritmo!",
      "Quarta já tá bom!",
      "Quinta pro detalhe!",
      "Sexta é quase lá!",
      "Sábado também conta!"
    ];
    return greetings[day];
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  // Contar aprovações no mês e ano
  const concludedThisMonth = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const approvals = new Set();
    demands.forEach((d) => {
      (d.history || []).forEach((h) => {
        if (h.acao === "aprovado" && h.by === member?.email && h.date && new Date(h.date) >= monthStart) {
          approvals.add(d.id);
        }
      });
    });
    return approvals.size;
  }, [demands, member?.email]);

  const concludedThisYear = useMemo(() => {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const approvals = new Set();
    demands.forEach((d) => {
      (d.history || []).forEach((h) => {
        if (h.acao === "aprovado" && h.by === member?.email && h.date && new Date(h.date) >= yearStart) {
          approvals.add(d.id);
        }
      });
    });
    return approvals.size;
  }, [demands, member?.email]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Perfil do membro */}
      <MemberProfileCard member={member} onUpdated={refetch} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Olá, {member?.name?.split(" ")[0]} 👋
            {myRankPos >= 0 &&
            <span className="flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                <Trophy className="w-3.5 h-3.5" />
                #{myRankPos + 1} ranking
              </span>
            }
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{getGreeting()}</p>
        </div>
      </div>

      {/* Quadro de Avisos */}
      <div className="bg-[#f1efea] p-5 rounded-xl border border-border">
        <NoticeBoard member={member} />
      </div>

      {/* Alertas de prazos */}
      <DeadlineAlertsCompact userEmail={member?.email} />

      {/* Meta mensal */}
      <MonthlyGoalsCard demands={demands} member={member} concludedThisMonth={concludedThisMonth} />

      {/* Stats rápidas */}
      {myDemands.length > 0 &&
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{myDemands.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Em aberto</p>
          </div>
          <div className={cn("rounded-xl border p-3 text-center", overdue.length > 0 ? "bg-red-50 border-red-200" : "bg-card border-border")}>
            <p className={cn("text-2xl font-bold", overdue.length > 0 ? "text-red-600" : "text-foreground")}>{overdue.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Atrasadas</p>
          </div>
          <div className={cn("rounded-xl border p-3 text-center", dueSoon > 0 ? "bg-amber-50 border-amber-200" : "bg-card border-border")}>
            <p className={cn("text-2xl font-bold", dueSoon > 0 ? "text-amber-600" : "text-foreground")}>{dueSoon}</p>
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

      {/* Ranking geral da equipe */}
      {ranking.length > 0 && (
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Ranking da Equipe</h2>
            {myRankPos >= 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                Você está em <strong className="text-foreground">#{myRankPos + 1}</strong>
              </span>
            )}
          </div>
          <div className="divide-y divide-border">
            {ranking.map((r, i) => {
              const isMe = r.email === member?.email;
              const max = ranking[0].count;
              const pct = Math.round((r.count / max) * 100);
              const medal = ["🥇", "🥈", "🥉"][i] || `#${i + 1}`;
              return (
                <div key={r.email} className={cn("px-5 py-3 flex items-center gap-3", isMe && "bg-primary/5")}>
                  <span className="w-7 text-center text-sm shrink-0">{medal}</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{r.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-sm font-medium truncate", isMe && "text-primary font-semibold")}>
                        {r.name} {isMe && <span className="text-xs">(você)</span>}
                      </span>
                      <span className="text-sm font-bold text-primary ml-2 shrink-0">{r.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", isMe ? "bg-primary" : "bg-muted-foreground/30")}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tarefas em aberto */}
      {overdue.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-600">Atrasadas ({overdue.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {overdue.map((d) => (
              <MyTaskCard key={d.id} demand={d} member={member} onUpdated={refetch} onOpenDetail={setSelected} />
            ))}
          </div>
        </section>
      )}

      {normal.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3">Minhas Tarefas ({normal.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {normal.map((d) => (
              <MyTaskCard key={d.id} demand={d} member={member} onUpdated={refetch} onOpenDetail={setSelected} />
            ))}
          </div>
        </section>
      )}

      {/* Concluídas por mim (reabríveis) */}
      <CompletedByMeSection demands={demands} member={member} onOpenDetail={setSelected} />

      {myDemands.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Tudo em dia!</p>
          <p className="text-xs mt-1">Nenhuma tarefa aguardando sua ação.</p>
        </div>
      )}

      <DemandDetailModal demand={selected} member={member} onClose={() => setSelected(null)} onUpdated={refetch} />
    </div>
  );
}