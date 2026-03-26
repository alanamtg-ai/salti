import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FLOW_TEMPLATES, STEPS } from "@/lib/flowConfig";
import { format } from "date-fns";

export default function NewDemandForm({ open, onClose, onSave, preselectedClientId }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    client_id: preselectedClientId || "",
    client_name: "",
    category: "social_media",
    priority: "media",
    deadline: "",
    flow_template: "social_media",
    steps_flow: [],
    assignees: {},
    step_deadlines: {},
  });
  const [saving, setSaving] = useState(false);

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });
  const { data: members = [] } = useQuery({ queryKey: ["team_members"], queryFn: () => base44.entities.TeamMember.list() });

  useEffect(() => {
    if (preselectedClientId) {
      const client = clients.find((c) => c.id === preselectedClientId);
      setForm((f) => ({ ...f, client_id: preselectedClientId, client_name: client?.name || "" }));
    }
  }, [preselectedClientId, clients]);

  useEffect(() => {
    const template = FLOW_TEMPLATES[form.flow_template];
    if (template) setForm((f) => ({ ...f, steps_flow: template.steps }));
  }, [form.flow_template]);

  const getMembersForRole = (role) => members.filter((m) => m.role === role);

  const stepsNeedingAssignee = (form.steps_flow || []).filter(
    (s) => STEPS[s]?.role && STEPS[s].role !== "admin" && STEPS[s].role !== "cliente" && s !== "publicado"
  );

  const handleClientChange = (id) => {
    const client = clients.find((c) => c.id === id);
    setForm((f) => ({ ...f, client_id: id, client_name: client?.name || "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    await base44.entities.Demand.create({
      ...form,
      current_step: form.steps_flow[0],
      current_step_index: 0,
      status: "ativo",
      history: [{ step: form.steps_flow[0], action: "criado", by: "admin", by_name: "Alana", date: now }],
    });
    setSaving(false);
    onSave();
    onClose();
    setStep(1);
    setForm({ title: "", description: "", client_id: "", client_name: "", category: "social_media", priority: "media", deadline: "", flow_template: "social_media", steps_flow: [], assignees: {}, step_deadlines: {} });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Demanda {step === 2 ? "— Fluxo e Responsáveis" : ""}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Post carrossel produto X" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-20" placeholder="Briefing, referências, observações..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <Select value={form.client_id} onValueChange={handleClientChange} disabled={!!preselectedClientId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prazo Final</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
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
                <Label>Tipo de Fluxo</Label>
                <Select value={form.flow_template} onValueChange={(v) => setForm({ ...form, flow_template: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FLOW_TEMPLATES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">Atribua responsáveis e prazos para cada etapa do fluxo.</p>
            {stepsNeedingAssignee.map((s) => {
              const roleMembers = getMembersForRole(STEPS[s].role);
              return (
                <div key={s} className="bg-muted/40 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">{STEPS[s].label}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={form.assignees[s] || ""}
                      onValueChange={(v) => setForm({ ...form, assignees: { ...form.assignees, [s]: v } })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Responsável" /></SelectTrigger>
                      <SelectContent>
                        {roleMembers.map((m) => <SelectItem key={m.id} value={m.email}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={form.step_deadlines[s] || ""}
                      onChange={(e) => setForm({ ...form, step_deadlines: { ...form.step_deadlines, [s]: e.target.value } })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          {step === 2 && <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!form.title || !form.client_id}>
              Próximo →
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Criando..." : "Criar Demanda"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}