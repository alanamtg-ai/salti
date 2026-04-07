import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Plus, ChevronLeft, Columns, BookOpen, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import DemandCardV2 from "@/components/demands/DemandCardV2";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import NewDemandForm from "@/components/demands/NewDemandForm";
import BriefingTab from "@/components/demands/BriefingTab";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { getStepLabel, getStepColor, STEPS } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";
import ContratoSection from "@/components/client-profile/ContratoSection";
import BrandingSection from "@/components/client-profile/BrandingSection";
import PublicoSection from "@/components/client-profile/PublicoSection";
import LoginsSection from "@/components/client-profile/LoginsSection";
import SelosSection from "@/components/client-profile/SelosSection";
import DatasSection from "@/components/client-profile/DatasSection";
import GestaoCriseSection from "@/components/client-profile/GestaoCriseSection";
import TikTokSection from "@/components/client-profile/TikTokSection";
import SocialMetricsSection from "@/components/client-profile/SocialMetricsSection";
import AdsMetricsSection from "@/components/client-profile/AdsMetricsSection";

const STEP_ORDER = ["briefing", "estrategia", "redacao", "design", "aprovacao_cliente", "distribuicao", "finalizado"];

const TABS = [
  { key: "briefing", label: "📋 Briefing", icon: BookOpen },
  { key: "kanban", label: "Kanban", icon: Columns },
  { key: "perfil", label: "Perfil do Cliente", icon: BookOpen },
  { key: "resultados", label: "Resultados", icon: BarChart2 },
];

export default function ClientKanban() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get("id");

  const { member } = useCurrentMember();
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("kanban");

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });
  const { data: demands = [], refetch } = useQuery({ queryKey: ["demands"], queryFn: () => base44.entities.Demand.list("-created_date", 500) });
  const { data: profiles = [], refetch: refetchProfile } = useQuery({
    queryKey: ["client_profile", clientId],
    queryFn: () => base44.entities.ClientProfile.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  const client = clients.find((c) => c.id === clientId);
  const clientDemands = demands.filter((d) => d.client_id === clientId);
  const profile = profiles[0] || null;

  const activeSteps = STEP_ORDER.filter((s) => clientDemands.some((d) => d.current_step === s));
  const columns = activeSteps.length > 0 ? activeSteps : STEP_ORDER.slice(0, 5);

  const isAdmin = member?.role === "admin";

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/clientes">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{client?.name || "Cliente"}</h1>
            <p className="text-sm text-muted-foreground">
              {[client?.city, client?.state].filter(Boolean).join(" - ")}
              {client?.contents_count ? ` · ${client.contents_count} conteúdos/${client.contents_period === "mes" ? "mês" : "semana"}` : ""}
              {" · "}{clientDemands.length} demandas
            </p>
          </div>
        </div>
        {isAdmin && activeTab === "kanban" && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Demanda
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Briefing Tab */}
      {activeTab === "briefing" && (
        <BriefingTab demands={clientDemands} onUpdated={refetch} />
      )}

      {/* Kanban */}
      {activeTab === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((step) => {
            let stepDemands = clientDemands.filter((d) => d.current_step === step);
            // Ordenar por data de postagem crescente (primeiro card do mês)
            stepDemands = stepDemands.sort((a, b) => {
              const dateA = a.scheduled_date;
              const dateB = b.scheduled_date;
              if (!dateA) return 1;
              if (!dateB) return -1;
              return new Date(dateA) - new Date(dateB);
            });
            const color = getStepColor(step);
            return (
              <div key={step} className="min-w-[260px] max-w-[300px] flex-shrink-0 bg-muted/40 rounded-xl">
                <div className="p-3 flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
                  <span className="text-xs font-semibold">{getStepLabel(step)}</span>
                  <span className="ml-auto text-xs bg-background rounded-full px-2 py-0.5 font-medium">
                    {stepDemands.length}
                  </span>
                </div>
                <div className="p-2 space-y-2 min-h-[150px] max-h-[calc(100vh-300px)] overflow-y-auto">
                  {stepDemands.map((d) => (
                    <DemandCardV2 key={d.id} demand={d} onClick={setSelectedDemand} />
                  ))}
                  {stepDemands.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-6">Vazio</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Perfil do Cliente */}
      {activeTab === "perfil" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ContratoSection profile={profile} clientId={clientId} onUpdated={refetchProfile} />
          <BrandingSection profile={profile} clientId={clientId} onUpdated={refetchProfile} />
          <PublicoSection profile={profile} clientId={clientId} onUpdated={refetchProfile} />
          <LoginsSection profile={profile} clientId={clientId} onUpdated={refetchProfile} />
          <SelosSection profile={profile} clientId={clientId} onUpdated={refetchProfile} />
          <DatasSection profile={profile} clientId={clientId} onUpdated={refetchProfile} />
          <div className="lg:col-span-2">
            <GestaoCriseSection profile={profile} clientId={clientId} onUpdated={refetchProfile} />
          </div>
        </div>
      )}

      {/* Resultados */}
      {activeTab === "resultados" && (
        <div className="space-y-6">
          {/* Social Orgânico */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">📊 Orgânico — Redes Sociais</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <TikTokSection profile={profile} clientId={clientId} onUpdated={refetchProfile} />
              <SocialMetricsSection emoji="📸" title="Instagram — Métricas" fieldKey="instagram_posts" linkPlaceholder="https://instagram.com/p/..." profile={profile} clientId={clientId} onUpdated={refetchProfile} />
              <SocialMetricsSection emoji="👥" title="Facebook — Métricas" fieldKey="facebook_posts" linkPlaceholder="https://facebook.com/..." profile={profile} clientId={clientId} onUpdated={refetchProfile} />
              <SocialMetricsSection emoji="💼" title="LinkedIn — Métricas" fieldKey="linkedin_posts" linkPlaceholder="https://linkedin.com/posts/..." profile={profile} clientId={clientId} onUpdated={refetchProfile} />
            </div>
          </div>
          {/* Ads */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">💰 Tráfego Pago</p>
            <div className="space-y-5">
              <AdsMetricsSection emoji="🎵" title="TikTok Ads" fieldKey="tiktok_ads" profile={profile} clientId={clientId} onUpdated={refetchProfile} />
              <AdsMetricsSection emoji="📘" title="Meta Ads (Facebook & Instagram)" fieldKey="meta_ads" profile={profile} clientId={clientId} onUpdated={refetchProfile} />
              <AdsMetricsSection emoji="🔍" title="Google Ads" fieldKey="google_ads" profile={profile} clientId={clientId} onUpdated={refetchProfile} />
            </div>
          </div>
        </div>
      )}

      <DemandDetailModal demand={selectedDemand} member={member} onClose={() => setSelectedDemand(null)} onUpdated={refetch} />
      <NewDemandForm open={formOpen} onClose={() => setFormOpen(false)} onSave={refetch} preselectedClientId={clientId} />
    </div>
  );
}