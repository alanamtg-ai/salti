import { useMemo } from "react";
import { differenceInHours, parseISO } from "date-fns";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function ProductivitySummary({ demands, members }) {
  const ranking = useMemo(() => {
    const scores = {};

    demands.forEach((d) => {
      (d.history || []).forEach((h) => {
        if (h.action !== "avançado" || !h.by) return;
        if (!scores[h.by]) scores[h.by] = { name: h.by_name || h.by, delivered: 0, totalHours: 0, countHours: 0 };
        scores[h.by].delivered++;
      });

      // Calcula horas por etapa via history
      const history = d.history || [];
      for (let i = 0; i < history.length - 1; i++) {
        const curr = history[i];
        const next = history[i + 1];
        if (!curr?.by || !curr?.date || !next?.date) continue;
        const hours = differenceInHours(parseISO(next.date), parseISO(curr.date));
        if (hours >= 0 && hours <= 720 && scores[curr.by]) {
          scores[curr.by].totalHours += hours;
          scores[curr.by].countHours++;
        }
      }
    });

    // Consolida entradas com emails diferentes mas que correspondem ao mesmo membro
    // (dados legados podem ter email antigo como "alana@agencia.com" vs "alanamtg@gmail.com")
    members.forEach((m) => {
      // Se já existe entrada pelo email correto, sobrescreve o nome
      if (scores[m.email]) {
        scores[m.email].name = m.name;
      }
      // Procura entradas com mesmo nome mas email diferente e funde com o email correto
      Object.keys(scores).forEach((key) => {
        if (key !== m.email && scores[key].name?.toLowerCase() === m.name?.toLowerCase()) {
          if (!scores[m.email]) {
            scores[m.email] = { name: m.name, delivered: 0, totalHours: 0, countHours: 0 };
          }
          scores[m.email].delivered += scores[key].delivered;
          scores[m.email].totalHours += scores[key].totalHours;
          scores[m.email].countHours += scores[key].countHours;
          scores[m.email].name = m.name;
          delete scores[key];
        }
      });
    });

    return Object.entries(scores)
      .map(([email, v]) => ({
        email,
        name: v.name,
        delivered: v.delivered,
        avgHours: v.countHours > 0 ? Math.round(v.totalHours / v.countHours) : null,
      }))
      .sort((a, b) => b.delivered - a.delivered);
  }, [demands, members]);

  if (ranking.length === 0) return null;

  const max = ranking[0].delivered;

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h2 className="font-semibold text-sm">Produtividade dos Colaboradores</h2>
        <span className="text-xs text-muted-foreground ml-1">— etapas entregues</span>
      </div>
      <div className="divide-y divide-border">
        {ranking.map((r, i) => {
          const pct = Math.round((r.delivered / max) * 100);
          return (
            <div key={r.email} className="px-5 py-3 flex items-center gap-3">
              <span className="w-7 text-center text-sm shrink-0">
                {i < 3 ? MEDAL[i] : <span className="text-muted-foreground font-bold text-xs">#{i + 1}</span>}
              </span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{r.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{r.name}</span>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    {r.avgHours !== null && (
                      <span className="text-[10px] text-muted-foreground hidden sm:block">
                        ~{r.avgHours}h/etapa
                      </span>
                    )}
                    <span className="text-sm font-bold text-primary">{r.delivered}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-400" : "bg-primary/50"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}