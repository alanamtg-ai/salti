import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Plus, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import DemandCardV2 from "@/components/demands/DemandCardV2";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import NewDemandForm from "@/components/demands/NewDemandForm";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { getStepLabel, getStepColor, STEPS } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";

const STEP_ORDER = ["estrategista", "redator", "designer", "aprovacao_interna", "aprovacao_cliente", "social_media", "publicado"];

export default function ClientKanban() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get("id");

  const { member } = useCurrentMember();
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });
  const { data: demands = [], refetch } = useQuery({ queryKey: ["demands"], queryFn: () => base44.entities.Demand.list("-created_date", 500) });

  const client = clients.find((c) => c.id === clientId);
  const clientDemands = demands.filter((d) => d.client_id === clientId);

  // Quais etapas têm demandas nesse cliente
  const activeSteps = STEP_ORDER.filter((s) => clientDemands.some((d) => d.current_step === s));
  const columns = activeSteps.length > 0 ? activeSteps : STEP_ORDER.slice(0, 5);

  const isAdmin = member?.role === "admin";

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/clientes">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{client?.name || "Cliente"}</h1>
            <p className="text-sm text-muted-foreground">{clientDemands.length} demandas</p>
          </div>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Demanda
          </Button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((step) => {
          const stepDemands = clientDemands.filter((d) => d.current_step === step);
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
              <div className="p-2 space-y-2 min-h-[150px] max-h-[calc(100vh-240px)] overflow-y-auto">
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

      <DemandDetailModal demand={selectedDemand} member={member} onClose={() => setSelectedDemand(null)} onUpdated={refetch} />
      <NewDemandForm open={formOpen} onClose={() => setFormOpen(false)} onSave={refetch} preselectedClientId={clientId} />
    </div>
  );
}