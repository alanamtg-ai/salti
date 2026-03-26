import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const defaultForm = {
  title: "",
  description: "",
  status: "pendente",
  priority: "media",
  assignee: "",
  assignee_name: "",
  client: "",
  category: "social_media",
  deadline: "",
};

export default function DemandForm({ open, onClose, onSave, demand }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  useEffect(() => {
    if (demand) {
      setForm({
        title: demand.title || "",
        description: demand.description || "",
        status: demand.status || "pendente",
        priority: demand.priority || "media",
        assignee: demand.assignee || "",
        assignee_name: demand.assignee_name || "",
        client: demand.client || "",
        category: demand.category || "social_media",
        deadline: demand.deadline || "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [demand, open]);

  const handleMemberChange = (email) => {
    const member = members.find((m) => m.email === email);
    setForm({ ...form, assignee: email, assignee_name: member?.name || "" });
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (demand?.id) {
        await base44.entities.Demand.update(demand.id, form);
      } else {
        await base44.entities.Demand.create(form);
      }
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{demand ? "Editar Demanda" : "Nova Demanda"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Post Instagram para cliente X"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes da demanda..."
              className="h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prazo</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="copy">Copy</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="estrategia">Estratégia</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select value={form.assignee} onValueChange={handleMemberChange}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.email}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? "Salvando..." : demand ? "Salvar" : "Criar Demanda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}