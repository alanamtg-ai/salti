import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentMember } from "@/lib/useCurrentMember";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import MyTaskCard from "@/components/demands/MyTaskCard";
import { useState, useMemo } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Clock, Trophy, Star, Send } from "lucide-react";
import NoticeBoard from "@/components/notices/NoticeBoard";
import CompletedByMeSection from "@/components/demands/CompletedByMeSection";
import ProductivityGoalCard from "@/components/dashboard/ProductivityGoalCard";
import { getStepLabel, STEPS, OFFICIAL_FLOW } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";
import { isPast, isToday, differenceInDays, parseISO, addDays, startOfMonth, startOfWeek, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CollaboratorDashboard() {
  const { member, isLoading } = useCurrentMember();
  const [selected, setSelected] = useState(null);

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
    // Mapeia o papel do membro para as etapas que ele pode atuar
    const roleStepsMap = {
      estrategista: ["estrategia"],
      redator: ["redacao"],
      designer: ["design"],
      social_media: ["distribuicao"],
      gestor_trafego: ["trafego_pago"],
      admin: OFFICIAL_FLOW,
      cliente: ["aprovacao_cliente"]
    };
    return roleStepsMap[member?.role] || [];
  }, [member]);

  // Minhas tarefas abertas
  const myDemands = useMemo(() => {
    if (!member) return [];
    return demands.filter((d) => {
      if (d.current_step === "finalizado") return false;
      if (!mySteps.includes(d.current_step)) return false;
      if (d.assignees?.[d.current_step] && d.assignees[d.current_step] !== member.email) return false;
      return true;
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

  // Ranking da equipe pelo mesmo papel
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

  const overdue = myDemands.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    return dl && isPast(new Date(dl)) && !isToday(new Date(dl));
  });
  const normal = myDemands.filter((d) => !overdue.includes(d));

  const roleLabel = STEPS[mySteps[0]]?.label || member?.role;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  // Calcular variações e métricas adicionais
  const now = new Date();
  const yesterday = addDays(now, -1);
  const in48h = addDays(now, 2);
  const monthStart = startOfMonth(now);
  const weekStart = startOfWeek(now);

  // Atrasadas vs ontem
  const overdueYesterday = demands.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    return dl && isPast(new Date(dl)) && !isToday(new Date(dl)) && new Date(dl) <= yesterday;
  }).length;
  const overdueVariation = overdue.length - overdueYesterday;

  // Vencem em breve (próximas 48h)
  const dueSoon = myDemands.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    if (!dl) return false;
    const dlDate = new Date(dl);
    return isBefore(dlDate, in48h) && !isPast(dlDate);
  }).length;

  // Finalizadas no mês
  const completedThisMonth = demands.filter((d) => {
    if (d.status !== "finalizado") return false;
    const updated = d.updated_date ? new Date(d.updated_date) : null;
    return updated && updated >= monthStart;
  }).length;

  // Finalizadas nesta semana
  const completedThisWeek = demands.filter((d) => {
    if (d.status !== "finalizado") return false;
    const updated = d.updated_date ? new Date(d.updated_date) : null;
    return updated && updated >= weekStart;
  }).length;

  const weekVariation = completedThisWeek > 0 ? completedThisWeek : 0;

  // Finalizadas no ano
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const completedThisYear = demands.filter((d) => {
    if (d.status !== "finalizado") return false;
    const updated = d.updated_date ? new Date(d.updated_date) : null;
    return updated && updated >= yearStart;
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

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {member?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{getGreeting()}</p>
        </div>
        {myRankPos >= 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 w-fit">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">
              #{myRankPos + 1} no ranking da equipe
            </span>
          </div>
        )}
      </div>

      {/* Quadro de Avisos */}
      <div className="bg-card rounded-xl border border-border p-5">
        <NoticeBoard member={member} />
      </div>

      {/* KPIs - 5 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {/* Atrasadas */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Atrasadas</p>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{overdue.length}</p>
          {overdueVariation !== 0 && (
            <p className={cn("text-xs mt-2", overdueVariation > 0 ? "text-red-600" : "text-emerald-600")}>
              {overdueVariation > 0 ? "↑" : "↓"} {Math.abs(overdueVariation)} vs ontem
            </p>
          )}
        </div>

        {/* Vencem em breve */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Próx. 48h</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-600">{dueSoon}</p>
          <p className="text-xs text-muted-foreground mt-2">demandas</p>
        </div>

        {/* Em produção */}
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Produção</p>
            <Send className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-violet-600">{myDemands.length}</p>
          <p className="text-xs text-muted-foreground mt-2">em andamento</p>
        </div>

        {/* Produção no mês */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Mês</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{completedThisMonth}</p>
          {weekVariation > 0 && (
            <p className="text-xs text-emerald-600 mt-2">↑ {weekVariation} essa semana</p>
          )}
        </div>

        {/* Produção no ano */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Ano</p>
            <Star className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{completedThisYear}</p>
        </div>
      </div>

      {/* Meta mensal */}
      <ProductivityGoalCard demands={demands} member={member} />

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