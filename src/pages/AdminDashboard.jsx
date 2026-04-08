import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Plus, AlertTriangle, CheckCircle2, Users, Layers,
  Trash2, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import TodayCalendar from "@/components/dashboard/TodayCalendar";
import ReportsSummary from "@/components/dashboard/ReportsSummary";
import ProductivitySummary from "@/components/dashboard/ProductivitySummary";
import LiveClock from "@/components/dashboard/LiveClock";
import NewDemandForm from "@/components/demands/NewDemandForm";
import ClientPerformancePanel from "@/components/dashboard/ClientPerformancePanel";
import DeadlineAlerts from "@/components/dashboard/DeadlineAlerts";
import NoticeBoard from "@/components/notices/NoticeBoard";
import CompletedByMeSection from "@/components/demands/CompletedByMeSection";
import MyTaskCard from "@/components/demands/MyTaskCard";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { getStepLabel, getStepLight, STEPS, getStepsForRole } from "@/lib/flowConfig";

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
  const sessionStart = useRef(new Date()).current;
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

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const active = demands.filter((d) => d.status === "ativo");

  // Tarefas do fluxo onde o admin (Alana) é responsável
  const adminSteps = getStepsForRole("admin");
  const myFlowTasks = active.filter((d) => {
    const step = d.current_step;
    const assignee = d.assignees?.[step];
    if (assignee === member?.email) return true;
    if (adminSteps.includes(step) && !assignee) return true;
    return false;
  });
  const overdue = active.filter((d) => {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    return dl && isPast(new Date(dl)) && !isToday(new Date(dl));
  });

  const allFinished = demands.filter((d) => d.status === "finalizado");

  // "Concluídas" = redes sociais (fluxo com agendamento — publicadas)
  const concluded = allFinished.filter((d) => (d.steps_flow || []).includes("agendamento"));
  // "Finalizadas" = entregas diretas sem publicação (flyer, banner, etc.)
  const finalized = allFinished.filter((d) => !(d.steps_flow || []).includes("agendamento"));

  const concludedThisMonth = concluded.filter((d) => {
    const lastEntry = [...(d.history || [])].reverse().find((h) => h.acao === "aprovado");
    if (!lastEntry?.date) return false;
    const dt = new Date(lastEntry.date);
    return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
  });

  const concludedThisYear = concluded.filter((d) => {
    const lastEntry = [...(d.history || [])].reverse().find((h) => h.acao === "aprovado");
    if (!lastEntry?.date) return false;
    return new Date(lastEntry.date).getFullYear() === currentYear;
  });

  const finalizedThisMonth = finalized.filter((d) => {
    const lastEntry = [...(d.history || [])].reverse().find((h) => h.acao === "aprovado");
    if (!lastEntry?.date) return false;
    const dt = new Date(lastEntry.date);
    return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
  });



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

      {/* Relógio ao vivo + sessão */}
      <LiveClock sessionStart={sessionStart} />

      {/* KPIs — linha 1: operacional */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ativas", value: active.length, icon: Layers, cls: "bg-primary/10 text-primary" },
          { label: "Atrasadas", value: overdue.length, icon: AlertTriangle, cls: "bg-red-100 text-red-500" },
          { label: "Clientes", value: clients.length, icon: Users, cls: "bg-emerald-100 text-emerald-600" },
          { label: "Aguardando minha ação", value: myFlowTasks.length, icon: CheckCircle2, cls: "bg-violet-100 text-violet-600" },
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

      {/* KPIs — linha 2: entregas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-teal-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-teal-100 text-teal-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-3xl font-bold">{concluded.length}</p>
            <p className="text-xs text-muted-foreground">Postadas (Redes Sociais)</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {concludedThisMonth.length} esse mês · {concludedThisYear.length} esse ano
            </p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-sky-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 text-sky-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-3xl font-bold">{finalized.length}</p>
            <p className="text-xs text-muted-foreground">Entregues (Artes avulsas)</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {finalizedThisMonth.length} esse mês · flyers, banners, artes avulsas
            </p>
          </div>
        </div>
      </div>

      {/* Quadro de Avisos */}
      <div className="bg-card rounded-xl border border-border p-5">
        <NoticeBoard member={member} />
      </div>

      {/* Alertas de Prazos */}
       <div className="bg-card rounded-xl border border-border p-5">
         <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
           <AlertTriangle className="w-5 h-5" /> Alertas de Prazos
         </h2>
         <DeadlineAlerts />
       </div>

       {/* Resumo de Relatórios */}
       <ReportsSummary demands={demands} />

       {/* Calendário do dia */}
       <TodayCalendar demands={demands} onOpenDetail={setSelectedDemand} />

      {/* Performance por Cliente + Ranking da equipe */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ClientPerformancePanel clients={clients} demands={demands} />
        </div>
        <div>
          <ProductivitySummary demands={demands} members={members} />
        </div>
      </div>



      {/* Minhas tarefas no fluxo */}
      {myFlowTasks.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-violet-500" />
            Minhas Tarefas no Fluxo
            <span className="text-xs font-normal text-muted-foreground">({myFlowTasks.length} aguardando)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {myFlowTasks.map((d) => (
              <MyTaskCard key={d.id} demand={d} onOpenDetail={setSelectedDemand} />
            ))}
          </div>
        </div>
      )}

      {/* Concluídas por mim */}
      <CompletedByMeSection demands={demands} member={member} onOpenDetail={setSelectedDemand} />

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