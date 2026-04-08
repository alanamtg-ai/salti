import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentMember } from "@/lib/useCurrentMember";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import MyTaskCard from "@/components/demands/MyTaskCard";
import { useState, useMemo } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Clock, Trophy, Star, Send } from "lucide-react";
import NoticeBoard from "@/components/notices/NoticeBoard";
import CompletedByMeSection from "@/components/demands/CompletedByMeSection";
import { getStepsForRole, getStepLabel, STEPS } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";
import { isPast, isToday, differenceInDays, parseISO } from "date-fns";

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

  const mySteps = useMemo(() => getStepsForRole(member?.role), [member]);

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

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {member?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {roleLabel} · suas tarefas e métricas
        </p>
      </div>

      {/* Quadro de Avisos */}
      <div className="bg-card rounded-xl border border-border p-5">
        <NoticeBoard member={member} />
      </div>

      {/* Métricas pessoais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Em aberto", value: myDemands.length, icon: Clock, cls: "bg-primary/10 text-primary" },
          { label: "Atrasadas", value: overdue.length, icon: AlertTriangle, cls: overdue.length > 0 ? "bg-red-100 text-red-500" : "bg-muted text-muted-foreground" },
          { label: "Concluídas por mim", value: metrics.delivered, icon: Send, cls: "bg-teal-100 text-teal-600" },
          {
            label: "Tempo médio",
            value: metrics.avgDays ? `${metrics.avgDays}d` : "—",
            icon: Star,
            cls: "bg-amber-100 text-amber-600"
          },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.cls)}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

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