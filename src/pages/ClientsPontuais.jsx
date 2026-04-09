import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, ExternalLink, Layers, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { cn } from "@/lib/utils";

const CLIENT_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-pink-500",
  "bg-amber-500", "bg-indigo-500", "bg-teal-500", "bg-rose-500",
  "bg-cyan-500", "bg-orange-500", "bg-lime-500", "bg-purple-500",
];

export default function ClientsPontuais() {
  const { member } = useCurrentMember();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");

  const { data: clients = [], refetch } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });
  const { data: demands = [] } = useQuery({ queryKey: ["demands"], queryFn: () => base44.entities.Demand.list("-created_date", 500) });

  const isAdmin = member?.role === "admin";
  const pontuais = clients.filter((c) => c.client_type === "avulso");

  const handleAdd = async () => {
    await base44.entities.Client.create({ name, company, email, active: true, client_type: "avulso" });
    setName(""); setCompany(""); setEmail("");
    setFormOpen(false);
    refetch();
  };

  const getClientStats = (clientId) => {
    const cd = demands.filter((d) => d.client_id === clientId);
    const active = cd.filter((d) => d.current_step !== "publicado").length;
    const published = cd.filter((d) => d.current_step === "publicado").length;
    return { total: cd.length, active, published };
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header com tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-border overflow-hidden">
            <Link
              to="/clientes"
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background hover:bg-muted transition-colors"
            >
              📅 Recorrência
            </Link>
            <div className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground">
              ⚡ Pontuais ({pontuais.length})
            </div>
          </div>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Cliente
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pontuais.map((client, i) => {
          const stats = getClientStats(client.id);
          const color = CLIENT_COLORS[i % CLIENT_COLORS.length];
          return (
            <Link key={client.id} to={`/kanban-cliente?id=${client.id}`}>
              <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0", color)}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{client.name}</p>
                      {(client.city || client.state) && (
                        <p className="text-[11px] text-muted-foreground">{[client.city, client.state].filter(Boolean).join(" - ")}</p>
                      )}
                      {client.company && !client.city && <p className="text-xs text-muted-foreground">{client.company}</p>}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                <div className="flex gap-3">
                  <div className="text-center flex-1 bg-muted/50 rounded-lg py-2">
                    <p className="text-lg font-bold">{stats.active}</p>
                    <p className="text-[10px] text-muted-foreground">Ativas</p>
                  </div>
                  <div className="text-center flex-1 bg-muted/50 rounded-lg py-2">
                    <p className="text-lg font-bold text-emerald-600">{stats.published}</p>
                    <p className="text-[10px] text-muted-foreground">Publicadas</p>
                  </div>
                  <div className="text-center flex-1 bg-muted/50 rounded-lg py-2">
                    <p className="text-lg font-bold text-muted-foreground">{stats.total}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {pontuais.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum cliente pontual cadastrado</p>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Cliente Pontual</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}