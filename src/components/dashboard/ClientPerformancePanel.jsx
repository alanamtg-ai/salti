import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { format, isPast, isToday, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink, AlertTriangle, CheckCircle2, Clock, TrendingUp, DollarSign, Eye, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const CLIENT_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-pink-500",
  "bg-amber-500", "bg-indigo-500", "bg-teal-500", "bg-rose-500",
  "bg-cyan-500", "bg-orange-500", "bg-lime-500", "bg-purple-500",
];

const fmt = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return String(num || 0);
};

const fmtMoney = (n) => {
  const num = Number(n) || 0;
  if (num === 0) return "—";
  if (num >= 1000) return "R$ " + (num / 1000).toFixed(1) + "K";
  return "R$ " + num.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

function getLastUpdate(demands) {
  if (!demands.length) return null;
  const sorted = [...demands].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
  return sorted[0]?.updated_date;
}

function getOverallStatus(demands) {
  const active = demands.filter((d) => d.status === "ativo");
  const overdue = active.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    return dl && isPast(new Date(dl)) && !isToday(new Date(dl));
  });
  if (overdue.length > 0) return { label: "Atrasado", color: "text-red-500 bg-red-50", icon: AlertTriangle };
  if (active.length > 0) return { label: "Em Andamento", color: "text-amber-600 bg-amber-50", icon: Clock };
  return { label: "Em Dia", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 };
}

function getSocialSummary(profile) {
  if (!profile) return null;
  const allPosts = [
    ...(profile.instagram_posts || []),
    ...(profile.facebook_posts || []),
    ...(profile.tiktok_posts || []),
    ...(profile.linkedin_posts || []),
  ];
  if (!allPosts.length) return null;
  const totalViews = allPosts.reduce((s, p) => s + (Number(p.visualizacoes) || 0), 0);
  const totalLikes = allPosts.reduce((s, p) => s + (Number(p.curtidas) || 0), 0);
  const totalPosts = allPosts.length;
  return { totalViews, totalLikes, totalPosts };
}

function getAdsSummary(profile) {
  if (!profile) return null;
  const allCamps = [
    ...(profile.meta_ads || []),
    ...(profile.google_ads || []),
    ...(profile.tiktok_ads || []),
  ];
  if (!allCamps.length) return null;
  const totalInvest = allCamps.reduce((s, c) => s + (Number(c.investimento) || 0), 0);
  const totalConv = allCamps.reduce((s, c) => s + (Number(c.conversoes) || 0), 0);
  return { totalInvest, totalConv, totalCamps: allCamps.length };
}

function ClientRow({ client, demands, profile, colorClass }) {
  const [expanded, setExpanded] = useState(false);
  const clientDemands = demands.filter((d) => d.client_id === client.id);
  const active = clientDemands.filter((d) => d.status === "ativo").length;
  const finished = clientDemands.filter((d) => d.status === "finalizado").length;
  const status = getOverallStatus(clientDemands);
  const lastUpdate = getLastUpdate(clientDemands);
  const social = getSocialSummary(profile);
  const ads = getAdsSummary(profile);
  const StatusIcon = status.icon;

  return (
    <div className="border-b border-border last:border-0">
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0", colorClass)}>
          {client.name.charAt(0)}
        </div>

        {/* Name + company */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{client.name}</p>
          {client.company && <p className="text-[10px] text-muted-foreground truncate">{client.company}</p>}
        </div>

        {/* Status badge */}
        <span className={cn("hidden sm:flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full shrink-0", status.color)}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>

        {/* Demand counts */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-center">
            <p className="text-sm font-bold">{active}</p>
            <p className="text-[9px] text-muted-foreground">Ativas</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-emerald-600">{finished}</p>
            <p className="text-[9px] text-muted-foreground">Finalizadas</p>
          </div>
        </div>

        {/* Last update */}
        {lastUpdate && (
          <p className="hidden lg:block text-[10px] text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(lastUpdate), { locale: ptBR, addSuffix: true })}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Link to={`/kanban-cliente?id=${client.id}`} onClick={(e) => e.stopPropagation()}>
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Link>
          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded: metrics */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Social summary */}
          {social ? (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">📊 Orgânico</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                  <Eye className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
                  <p className="text-sm font-bold">{fmt(social.totalViews)}</p>
                  <p className="text-[10px] text-muted-foreground">Views Totais</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                  <Heart className="w-3.5 h-3.5 mx-auto mb-1 text-pink-400" />
                  <p className="text-sm font-bold">{fmt(social.totalLikes)}</p>
                  <p className="text-[10px] text-muted-foreground">Curtidas Totais</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                  <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1 text-violet-400" />
                  <p className="text-sm font-bold">{social.totalPosts}</p>
                  <p className="text-[10px] text-muted-foreground">Posts Registrados</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Sem métricas orgânicas registradas.</p>
          )}

          {/* Ads summary */}
          {ads && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">💰 Tráfego Pago</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                  <DollarSign className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                  <p className="text-sm font-bold">{fmtMoney(ads.totalInvest)}</p>
                  <p className="text-[10px] text-muted-foreground">Investimento</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-orange-400" />
                  <p className="text-sm font-bold">{fmt(ads.totalConv)}</p>
                  <p className="text-[10px] text-muted-foreground">Conversões</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                  <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
                  <p className="text-sm font-bold">{ads.totalCamps}</p>
                  <p className="text-[10px] text-muted-foreground">Campanhas</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent demands */}
          {clientDemands.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">🗂 Últimas Demandas</p>
              <div className="space-y-1.5">
                {clientDemands.slice(0, 3).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-3 py-2">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", d.status === "finalizado" ? "bg-emerald-500" : "bg-amber-400")} />
                    <span className="truncate flex-1 font-medium">{d.title}</span>
                    <span className="text-muted-foreground shrink-0 text-[10px]">
                      {d.updated_date ? formatDistanceToNow(new Date(d.updated_date), { locale: ptBR, addSuffix: true }) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientPerformancePanel({ clients, demands }) {
  const { data: profiles = [] } = useQuery({
    queryKey: ["all_client_profiles"],
    queryFn: () => base44.entities.ClientProfile.list(),
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.client_id, p]));

  // Aggregate social metrics across all clients
  const totalViews = profiles.reduce((s, p) => {
    const posts = [...(p.instagram_posts || []), ...(p.facebook_posts || []), ...(p.tiktok_posts || []), ...(p.linkedin_posts || [])];
    return s + posts.reduce((ss, post) => ss + (Number(post.visualizacoes) || 0), 0);
  }, 0);

  const totalAdInvest = profiles.reduce((s, p) => {
    const camps = [...(p.meta_ads || []), ...(p.google_ads || []), ...(p.tiktok_ads || [])];
    return s + camps.reduce((ss, c) => ss + (Number(c.investimento) || 0), 0);
  }, 0);

  const totalAdConv = profiles.reduce((s, p) => {
    const camps = [...(p.meta_ads || []), ...(p.google_ads || []), ...(p.tiktok_ads || [])];
    return s + camps.reduce((ss, c) => ss + (Number(c.conversoes) || 0), 0);
  }, 0);

  return (
    <div className="bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <h2 className="font-semibold">Performance por Cliente</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Resumo de demandas, social e ads de cada cliente</p>
      </div>

      {/* Aggregate top bar */}
      {(totalViews > 0 || totalAdInvest > 0) && (
        <div className="grid grid-cols-3 gap-px bg-border border-b border-border">
          {[
            { label: "Views Orgânicos (total)", value: fmt(totalViews), icon: Eye, color: "text-blue-500" },
            { label: "Investimento em Ads (total)", value: fmtMoney(totalAdInvest), icon: DollarSign, color: "text-emerald-500" },
            { label: "Conversões em Ads (total)", value: fmt(totalAdConv), icon: TrendingUp, color: "text-orange-500" },
          ].map((s) => (
            <div key={s.label} className="bg-card p-4 text-center">
              <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Client rows */}
      <div className="divide-y divide-border">
        {clients.map((client, i) => (
          <ClientRow
            key={client.id}
            client={client}
            demands={demands}
            profile={profileMap[client.id] || null}
            colorClass={CLIENT_COLORS[i % CLIENT_COLORS.length]}
          />
        ))}
        {clients.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente cadastrado</div>
        )}
      </div>
    </div>
  );
}