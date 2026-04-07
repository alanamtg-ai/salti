import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FLOW_TEMPLATES } from "@/lib/flowConfig";
import { Loader2, Repeat } from "lucide-react";

const PRODUCT_TYPES = [
  { value: "outro", label: "Outro" },
  { value: "servicos_administrativos", label: "Serviços Administrativos" },
  { value: "copy_email", label: "E-mail Marketing" },
  { value: "relatorio", label: "Relatório" },
  { value: "apresentacao", label: "Apresentação" },
  { value: "planejamento_estrategico", label: "Planejamento Estratégico" },
  { value: "pauta_editorial", label: "Pauta Editorial" },
  { value: "post_feed", label: "Post Feed" },
  { value: "post_stories", label: "Stories" },
  { value: "post_reels", label: "Reels / TikTok" },
  { value: "carrossel", label: "Carrossel" },
  { value: "banner_digital", label: "Banner Digital" },
  { value: "flyer", label: "Flyer / Panfleto" },
  { value: "video_curto", label: "Vídeo Curto" },
  { value: "video_longo", label: "Vídeo Longo" },
  { value: "copy_legenda", label: "Legenda / Copy" },
  { value: "copy_anuncio", label: "Anúncio (Google/Meta)" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const defaultForm = {
  title: "",
  description: "",
  product_type: "outro",
  client_id: "",
  client_name: "",
  priority: "media",
  flow_template: "padrao",
  steps_flow: FLOW_TEMPLATES["padrao"].steps,
  assignees: {},
  recurrence_type: "monthly",
  recurrence_day_of_month: 1,
  recurrence_day_of_week: 1,
  active: true,
};

export default function RecurringDemandForm({ open, onClose, onSave, editing = null }) {
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });

  useEffect(() => {
    if (editing) {
      setForm({ ...defaultForm, ...editing });
    } else {
      setForm({ ...defaultForm });
    }
  }, [editing, open]);

  useEffect(() => {
    const template = FLOW_TEMPLATES[form.flow_template];
    if (template) setForm((f) => ({ ...f, steps_flow: template.steps }));
  }, [form.flow_template]);

  const handleClientChange = (id) => {
    const client = clients.find((c) => c.id === id);
    setForm((f) => ({ ...f, client_id: id, client_name: client?.name || "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form };
    if (editing?.id) {
      await base44.entities.RecurringDemand.update(editing.id, data);
    } else {
      await base44.entities.RecurringDemand.create(data);
    }
    setSaving(false);
    onSave();
    onClose();
  };

  const recurrenceLabel = () => {
    if (form.recurrence_type === "monthly") return `Todo dia ${form.recurrence_day_of_month} do mês`;
    if (form.recurrence_type === "weekly") return `Toda ${DAYS_OF_WEEK.find(d => d.value === form.recurrence_day_of_week)?.label}`;
    return "Todo dia";
  };

  const canSave = form.title && form.client_id && form.product_type;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-primary" />
            {editing ? "Editar Demanda Recorrente" : "Nova Demanda Recorrente"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Gerar nota fiscal do fee mensal" />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label>Descrição / Instrução</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-20" placeholder="O que deve ser feito..." />
          </div>

          {/* Tipo de produto */}
          <div className="space-y-1.5">
            <Label>Tipo de Produto</Label>
            <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Select value={form.client_id} onValueChange={handleClientChange}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Recorrência */}
          <div className="space-y-3 bg-muted/40 rounded-xl p-4">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recorrência</Label>

            <div className="space-y-1.5">
              <Label>Frequência</Label>
              <Select value={form.recurrence_type} onValueChange={(v) => setForm({ ...form, recurrence_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.recurrence_type === "monthly" && (
              <div className="space-y-1.5">
                <Label>Dia do mês (1–28)</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.recurrence_day_of_month}
                  onChange={(e) => setForm({ ...form, recurrence_day_of_month: Number(e.target.value) })}
                />
              </div>
            )}

            {form.recurrence_type === "weekly" && (
              <div className="space-y-1.5">
                <Label>Dia da semana</Label>
                <Select value={String(form.recurrence_day_of_week)} onValueChange={(v) => setForm({ ...form, recurrence_day_of_week: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((d) => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-xs font-medium">
              🔁 {recurrenceLabel()}
            </div>
          </div>

          {/* Prioridade + Fluxo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  <SelectItem value="media">🟡 Média</SelectItem>
                  <SelectItem value="alta">🟠 Alta</SelectItem>
                  <SelectItem value="urgente">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fluxo</Label>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando...</> : editing ? "Salvar" : "Criar Recorrência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}