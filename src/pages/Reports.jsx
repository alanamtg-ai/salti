import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval, differenceInHours, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { CheckCircle2, Clock, AlertTriangle, Trophy, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStepLabel } from "@/lib/flowConfig";

const MEDAL = ["🥇", "🥈", "🥉"];
const BAR_COLOR = "hsl(245,58%,51%)";
const BAR_COLOR2 = "hsl(160,60%,45%)";

export default function Reports() {
  const { data: demands = [] } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  // ── 1. Concluídas por mês (últimos 6 meses) ────────────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const inMonth = (dem) => isWithinInterval(new Date(dem.created_date), { start: mStart, end: mEnd });
      const monthDems = demands.filter(inMonth);
      return {
        name: format(d, "MMM/yy", { locale: ptBR }),
        Criadas: monthDems.length,
        Publicadas: monthDems.filter((dem) => dem.status === "publicado").length,
      };
    });
  }, [demands]);

  // ── 2. Tempo médio por etapa (em horas) — via history ─────────────────────
  const stepTimes = useMemo(() => {
    // Acumula horas passadas em cada etapa
    const acc = {}; // { step: { total: hours, count: n } }

    demands.forEach((d) => {
      const history = d.history || [];
      for (let i = 0; i < history.length - 1; i++) {
        const curr = history[i];
        const next = history[i + 1];
        if (!curr?.date || !next?.date) continue;
        const hours = differenceInHours(parseISO(next.date), parseISO(curr.date));
        if (hours < 0 || hours > 720) continue; // ignora valores absurdos (>30 dias)
        const step = curr.step;
        if (!acc[step]) acc[step] = { total: 0, count: 0 };
        acc[step].total += hours;
        acc[step].count += 1;
      }
    });

    return Object.entries(acc)
      .map(([step, { total, count }]) => ({
        step: getStepLabel(step),
        horas: count > 0 ? Math.round(total / count) : 0,
        count,
      }))
      .filter((x) => x.horas > 0)
      .sort((a, b) => b.horas - a.horas);
  }, [demands]);

  // ── 3. Ranking de produtividade — quem aparece mais no history como executor ─
  const ranking = useMemo(() => {
    const scores = {}; // email -> { name, entregues, etapas }

    demands.forEach((d) => {
      (d.history || []).forEach((h) => {
        if (!h.by || h.by === "admin" || h.by === "sistema") return;
        if (h.action !== "avançado") return; // só conta entregas reais
        const key = h.by;
        if (!scores[key]) scores[key] = { name: h.by_name || h.by, entregues: 0, etapas: new Set() };
        scores[key].entregues++;
        scores[key].etapas.add(h.step);
      });
    });

    // Complementa com nomes da equipe
    members.forEach((m) => {
      if (scores[m.email]) scores[m.email].name = m.name;
    });

    return Object.entries(scores)
      .map(([email, data]) => ({
        email,
        name: data.name,
        entregues: data.entregues,
        etapas: data.etapas.size,
      }))
      .sort((a, b) => b.entregues - a.entregues);
  }, [demands, members]);

  // ── KPIs rápidos ───────────────────────────────────────────────────────────
  const totalPublicados = demands.filter((d) => d.status === "publicado").length;
  const totalAtivos = demands.filter((d) => d.status === "ativo").length;
  const totalAtrasados = demands.filter((d) => {
    if (d.current_step === "publicado") return false;
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    return dl && new Date(dl) < new Date();
  }).length;
  const avgStepTime = stepTimes.length > 0
    ? Math.round(stepTimes.reduce((s, x) => s + x.horas, 0) / stepTimes.length)
    : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Desempenho de produção da equipe</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Publicados", value: totalPublicados },
          { icon: TrendingUp, color: "text-primary", bg: "bg-primary/5", label: "Em produção", value: totalAtivos },
          { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", label: "Atrasados", value: totalAtrasados },
          { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", label: "Tempo médio/etapa", value: avgStepTime > 0 ? `${avgStepTime}h` : "—" },
        ].map(({ icon: Icon, color, bg, label, value }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-5">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", bg)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Gráfico: Concluídas por mês */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-sm mb-1">Demandas Concluídas por Mês</h3>
        <p className="text-xs text-muted-foreground mb-4">Últimos 6 meses — criadas vs publicadas</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Criadas" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Publicadas" fill={BAR_COLOR2} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico: Tempo médio por etapa */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm">Tempo Médio por Etapa</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Horas médias que cada etapa leva para ser concluída</p>
        {stepTimes.length > 0 ? (
          <div className="space-y-3">
            {stepTimes.map((s) => {
              const max = stepTimes[0].horas;
              const pct = Math.round((s.horas / max) * 100);
              return (
                <div key={s.step}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{s.step}</span>
                    <span className="text-xs text-muted-foreground font-mono">{s.horas}h <span className="text-[10px]">({s.count} amostras)</span></span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Dados insuficientes — histórico de movimentações necessário
          </div>
        )}
      </div>

      {/* Ranking de Produtividade */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center gap-2 p-5 border-b border-border">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm">Ranking de Produtividade</h3>
          <span className="text-xs text-muted-foreground ml-1">— Etapas entregues por membro</span>
        </div>

        {ranking.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Histórico de entregas insuficiente
          </div>
        ) : (
          <div className="divide-y divide-border">
            {ranking.map((m, i) => {
              const max = ranking[0].entregues;
              const pct = Math.round((m.entregues / max) * 100);
              return (
                <div key={m.email} className="px-5 py-4 flex items-center gap-4">
                  {/* Posição */}
                  <div className="w-8 text-center shrink-0">
                    {i < 3 ? (
                      <span className="text-lg">{MEDAL[i]}</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{m.name.charAt(0)}</span>
                  </div>

                  {/* Info + barra */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold">{m.name}</span>
                      <span className="text-sm font-bold text-primary">{m.entregues}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-400" : "bg-primary"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{m.etapas} etapa{m.etapas !== 1 ? "s" : ""} diferentes</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}