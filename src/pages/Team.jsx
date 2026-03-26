import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Plus, Trash2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

export default function Team() {
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const queryClient = useQueryClient();

  const { data: members = [], refetch } = useQuery({
    queryKey: ["team_members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const { data: demands = [] } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
  });

  const handleAdd = async () => {
    if (!name.trim()) return;
    await base44.entities.TeamMember.create({ name, email, role });
    setName("");
    setEmail("");
    setRole("");
    setFormOpen(false);
    refetch();
  };

  const handleDelete = async (id) => {
    await base44.entities.TeamMember.delete(id);
    refetch();
  };

  const getMemberStats = (memberEmail) => {
    const memberDemands = demands.filter((d) => d.assignee === memberEmail);
    return {
      total: memberDemands.length,
      completed: memberDemands.filter((d) => d.status === "concluido").length,
      active: memberDemands.filter((d) => d.status !== "concluido").length,
    };
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Equipe</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie os membros da equipe</p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => {
          const stats = getMemberStats(m.email);
          return (
            <Card key={m.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{m.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role || "Membro"}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-4 mt-4 pt-3 border-t border-border">
                <div className="text-center flex-1">
                  <p className="text-lg font-bold">{stats.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-emerald-600">{stats.completed}</p>
                  <p className="text-[10px] text-muted-foreground">Concluídas</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-blue-600">{stats.active}</p>
                  <p className="text-[10px] text-muted-foreground">Ativas</p>
                </div>
              </div>
            </Card>
          );
        })}
        {members.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum membro adicionado</p>
            <p className="text-xs mt-1">Adicione membros para atribuir demandas</p>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Função</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Designer, Redator..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}