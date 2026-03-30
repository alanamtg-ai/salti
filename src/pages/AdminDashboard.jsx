import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Plus, AlertTriangle, CheckCircle2, Users, Layers,
  Trash2, ExternalLink, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import TodayCalendar from "@/components/dashboard/TodayCalendar";
import NewDemandForm from "@/components/demands/NewDemandForm";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { getStepLabel, getStepLight, STEPS } from "@/lib/flowConfig";

const CLIENT_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-pink-500",
  "bg-amber-500", "bg-indigo-500", "bg-teal-500", "bg-rose-500",
  "bg-cyan-500", "bg-orange-500", "bg-lime-500", "bg-purple-500",
  "bg-fuchsia-500", "bg-sky-500", "bg-red-500",
];

// ── Modal de adicionar cliente ─────────────────────────────────────────────
function AddClientModal({ open, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Client.create({ name, company, email, active: true });
    setSaving(false);
    setName(""); setCompany(""); setEmail("");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div className="space-y-1.5">
            <Label>Empresa</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nome da empresa" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@cliente.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Salvando..." : "Cadastrar Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dashboard principal ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { member } = useCurrentMember();
  const qc = useQueryClient();
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState(null);

  const { data: demands = [], refetch: refetchDemands } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
  });
  const { data: members = [] } = useQuery({ queryKey: ["team_members"], queryFn: () => base44.entities.TeamMember.list() });
  const { data: clients = [], refetch: refetchClients } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });

  const refetchAll = () => { refetchDemands(); qc.invalidateQueries(["clients"]); };

  const active = demands.filter((d) => d.current_step !== "publicado");
  const overdue = active.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    return dl && isPast(new Date(dl)) && !isToday(new Date(dl));
  });
  const published = demands.filter((d) => d.status === "publicado");



  // Stats de cliente
  const clientStats = (clientId) => {
    const cd = demands.filter((d) => d.client_id === clientId);
    return {
      active: cd.filter((d) => d.current_step !== "publicado").length,
      published: cd.filter((d) => d.status === "publicado").length,
    };
  };

  const handleDeleteClient = async (clientId) => {
    await base44.entities.Client.delete(clientId);
    setDeletingClientId(null);
    refetchClients();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header CEO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {member?.name?.split(" ")[0] || "Alana"} 👑
          </h1>
          <p className="text-sm text-muted-foreground">Visão geral da agência</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setClientFormOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1" /> Cliente
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova Demanda
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ativas", value: active.length, icon: Layers, cls: "bg-primary/10 text-primary" },
          { label: "Atrasadas", value: overdue.length, icon: AlertTriangle, cls: "bg-red-100 text-red-500" },
          { label: "Clientes", value: clients.length, icon: Users, cls: "bg-emerald-100 text-emerald-600" },
          { label: "Publicadas", value: published.length, icon: CheckCircle2, cls: "bg-sky-100 text-sky-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", s.cls)}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendário do dia */}
      <TodayCalendar demands={demands} onOpenDetail={setSelectedDemand} />

      {/* Gestão de Clientes */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Clientes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{clients.length} cadastrados</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setClientFormOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
          </Button>
        </div>
        <div className="divide-y divide-border">
          {clients.map((client, i) => {
            const stats = clientStats(client.id);
            const color = CLIENT_COLORS[i % CLIENT_COLORS.length];
            return (
              <div key={client.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0", color)}>
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{client.name}</p>
                  {client.company && <p className="text-[11px] text-muted-foreground">{client.company}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-bold">{stats.active}</p>
                    <p className="text-[9px] text-muted-foreground">Ativas</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-bold text-emerald-600">{stats.published}</p>
                    <p className="text-[9px] text-muted-foreground">Publicadas</p>
                  </div>
                  <Link to={`/kanban-cliente?id=${client.id}`}>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setDeletingClientId(client.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          {clients.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente cadastrado</div>
          )}
        </div>
      </div>

      {/* Modais */}
      <DemandDetailModal demand={selectedDemand} member={member} onClose={() => setSelectedDemand(null)} onUpdated={refetchDemands} />
      <NewDemandForm open={formOpen} onClose={() => setFormOpen(false)} onSave={refetchAll} />
      <AddClientModal open={clientFormOpen} onClose={() => setClientFormOpen(false)} onSaved={refetchClients} />

      {/* Confirm delete cliente */}
      <Dialog open={!!deletingClientId} onOpenChange={() => setDeletingClientId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Remover cliente?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Essa ação não pode ser desfeita. As demandas do cliente não serão removidas.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingClientId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleDeleteClient(deletingClientId)}>
              <Trash2 className="w-4 h-4 mr-1" /> Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}