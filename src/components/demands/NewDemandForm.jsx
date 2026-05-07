import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { STEPS } from "@/lib/flowConfig";
import StepBuilder from "@/components/demands/StepBuilder";
import { format } from "date-fns";
import SketchPad from "@/components/demands/SketchPad";
import { Plus, X, Link as LinkIcon, Upload, Loader2, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PRODUCT_TYPES = [
  { group: "Social Media", items: [
    { value: "post_feed", label: "Post Feed" },
    { value: "post_stories", label: "Stories" },
    { value: "post_reels", label: "Reels / TikTok" },
    { value: "carrossel", label: "Carrossel" },
  ]},
  { group: "Design", items: [
    { value: "banner_digital", label: "Banner Digital" },
    { value: "banner_impresso", label: "Banner Impresso" },
    { value: "flyer", label: "Flyer / Panfleto" },
    { value: "infografico", label: "Infográfico" },
    { value: "logo", label: "Logo" },
    { value: "identidade_visual", label: "Identidade Visual" },
    { value: "papelaria", label: "Papelaria" },
    { value: "embalagem", label: "Embalagem" },
  ]},
  { group: "Vídeo & Motion", items: [
    { value: "video_curto", label: "Vídeo Curto (< 1 min)" },
    { value: "video_longo", label: "Vídeo Longo" },
    { value: "motion_graphics", label: "Motion Graphics" },
    { value: "animacao", label: "Animação" },
    { value: "roteiro", label: "Roteiro" },
  ]},
  { group: "Copy & Texto", items: [
    { value: "copy_legenda", label: "Legenda / Copy" },
    { value: "copy_email", label: "E-mail Marketing" },
    { value: "copy_blog", label: "Artigo / Blog" },
    { value: "copy_anuncio", label: "Anúncio (Google/Meta)" },
  ]},
  { group: "Web", items: [
    { value: "landing_page", label: "Landing Page" },
    { value: "website", label: "Website" },
    { value: "ecommerce", label: "E-commerce" },
  ]},
  { group: "Estratégia", items: [
    { value: "planejamento_estrategico", label: "Planejamento Estratégico" },
    { value: "relatorio", label: "Relatório" },
    { value: "apresentacao", label: "Apresentação" },
    { value: "pauta_editorial", label: "Pauta Editorial" },
    { value: "briefing", label: "Briefing" },
  ]},
  { group: "Foto", items: [
    { value: "foto_produto", label: "Foto de Produto" },
    { value: "foto_editorial", label: "Foto Editorial" },
  ]},
  { group: "Outro", items: [{ value: "outro", label: "Outro" }] },
];

const STEPS_LABELS = {
  1: "Informações",
  2: "Fluxo",
  3: "Briefing Visual",
};

const defaultForm = {
  title: "",
  description: "",
  product_type: "",
  client_id: "",
  client_name: "",
  category: "social_media",
  priority: "media",
  deadline: "",
  steps_flow: ["finalizado"],
  assignees: {},
  step_deadlines: {},
  sketch_data: "",
  reference_links: [],
  file_urls: [],
};

// Multi-client picker component
function ClientMultiPicker({ clients, selectedIds, onChange, disabled }) {
  const allSelected = selectedIds.length === clients.length && clients.length > 0;

  const toggleAll = () => {
    onChange(allSelected ? [] : clients.map((c) => c.id));
  };

  const toggleOne = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      {!disabled && (
        <button
          type="button"
          onClick={toggleAll}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
            allSelected ? "bg-primary/10 border-primary text-primary" : "border-border bg-muted/30 hover:bg-muted/60"
          )}
        >
          <Users className="w-4 h-4" />
          {allSelected ? "✓ Todos os clientes selecionados" : "Selecionar todos os clientes"}
        </button>
      )}
      <div className="max-h-44 overflow-y-auto space-y-1 border border-border rounded-lg p-2 bg-background">
        {clients.map((c) => {
          const selected = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleOne(c.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left",
                selected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60",
                disabled && "opacity-50 pointer-events-none"
              )}
            >
              <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[10px]",
                selected ? "bg-primary border-primary text-white" : "border-muted-foreground"
              )}>
                {selected && <Check className="w-2.5 h-2.5" />}
              </span>
              {c.name}
            </button>
          );
        })}
        {clients.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhum cliente encontrado.</p>}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} cliente{selectedIds.length > 1 ? "s" : ""} selecionado{selectedIds.length > 1 ? "s" : ""}
          {selectedIds.length > 1 && <span className="text-primary font-medium"> — será criada uma demanda para cada</span>}
        </p>
      )}
    </div>
  );
}

export default function NewDemandForm({ open, onClose, onSave, preselectedClientId }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...defaultForm, client_id: preselectedClientId || "" });
  const [selectedClientIds, setSelectedClientIds] = useState(preselectedClientId ? [preselectedClientId] : []);
  const [saving, setSaving] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });
  const { data: members = [] } = useQuery({ queryKey: ["team_members"], queryFn: () => base44.entities.TeamMember.list() });

  useEffect(() => {
    if (preselectedClientId && clients.length) {
      const client = clients.find((c) => c.id === preselectedClientId);
      setForm((f) => ({ ...f, client_id: preselectedClientId, client_name: client?.name || "" }));
      setSelectedClientIds([preselectedClientId]);
    }
  }, [preselectedClientId, clients]);

  useEffect(() => {
    if (!form.steps_flow || form.steps_flow.length === 0) {
      setForm((f) => ({ ...f, steps_flow: ["finalizado"] }));
    }
  }, []);

  // Pré-calcula prazos sugeridos por etapa a partir de hoje (apenas dias úteis)
  const getSuggestedDeadlines = () => {
    const addWorkDays = (date, days) => {
      const d = new Date(date);
      let added = 0;
      while (added < days) {
        d.setDate(d.getDate() + 1);
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) added++; // ignora domingo (0) e sábado (6)
      }
      return format(d, "yyyy-MM-dd");
    };
    const today = new Date();
    const estrategia   = addWorkDays(today, 2);   // +2 dias úteis
    const redacao      = addWorkDays(today, 4);   // +2 dias úteis após estratégia
    const design       = addWorkDays(today, 7);   // +3 dias úteis após redação
    const aprovacao    = addWorkDays(today, 11);  // +2 aprovação interna + 2 revisão
    const distribuicao = addWorkDays(today, 13);  // +2 dias úteis após aprovação
    return { estrategia, redacao, design, aprovacao_cliente: aprovacao, distribuicao };
  };

  const UNIVERSAL_MEMBERS = ["pamela"]; // nomes (lowercase) que aparecem em todas as etapas

  const getMembersForRole = (role) => {
    return members.filter((m) => {
      const memberRoles = Array.isArray(m.role) ? m.role : (m.role ? [m.role] : []);
      if (memberRoles.includes(role) || memberRoles.includes("admin")) return true;
      if (UNIVERSAL_MEMBERS.some((name) => m.name?.toLowerCase().includes(name))) return true;
      return false;
    });
  };

  const stepsNeedingAssignee = (form.steps_flow || []).filter(
    (s) => STEPS[s]?.role && STEPS[s].role !== "admin" && STEPS[s].role !== "cliente" && s !== "finalizado"
  );

  const handleClientChange = (id) => {
    const client = clients.find((c) => c.id === id);
    setForm((f) => ({ ...f, client_id: id, client_name: client?.name || "" }));
  };

  const handleMultiClientChange = (ids) => {
    setSelectedClientIds(ids);
    // sync single client_id for step validation
    if (ids.length === 1) {
      const client = clients.find((c) => c.id === ids[0]);
      setForm((f) => ({ ...f, client_id: ids[0], client_name: client?.name || "" }));
    } else if (ids.length > 1) {
      setForm((f) => ({ ...f, client_id: ids[0], client_name: "múltiplos" }));
    } else {
      setForm((f) => ({ ...f, client_id: "", client_name: "" }));
    }
  };

  const addLink = () => {
    const url = newLink.trim();
    if (!url) return;
    setForm((f) => ({ ...f, reference_links: [...(f.reference_links || []), url] }));
    setNewLink("");
  };

  const removeLink = (i) => {
    setForm((f) => ({ ...f, reference_links: f.reference_links.filter((_, idx) => idx !== i) }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingFile(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setForm((f) => ({ ...f, file_urls: [...(f.file_urls || []), ...urls] }));
    setUploadingFile(false);
    e.target.value = "";
  };

  const removeFile = (i) => {
    setForm((f) => ({ ...f, file_urls: f.file_urls.filter((_, idx) => idx !== i) }));
  };

  const handleSave = async () => {
    setSaving(true);
    const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    const clientsToCreate = selectedClientIds.length > 0 ? selectedClientIds : [form.client_id];
    await Promise.all(clientsToCreate.map((cid) => {
      const client = clients.find((c) => c.id === cid);
      return base44.entities.Demand.create({
        ...form,
        client_id: cid,
        client_name: client?.name || "",
        current_step: form.steps_flow[0],
        current_step_index: 0,
        status: "ativo",
        step_started_at: now,
        history: [{
          etapa_origem: null,
          etapa_destino: form.steps_flow[0],
          acao: "criado",
          by: "admin",
          by_name: "Admin",
          date: now,
          observacao: "",
        }],
      });
    }));
    setSaving(false);
    onSave();
    onClose();
    setStep(1);
    setSelectedClientIds(preselectedClientId ? [preselectedClientId] : []);
    setForm({ ...defaultForm, client_id: preselectedClientId || "" });
  };

  const canGoStep2 = form.title && selectedClientIds.length > 0 && form.product_type;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Nova Demanda
            <div className="flex gap-1 ml-2">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium transition-colors",
                    step === s ? "bg-primary text-primary-foreground" : step > s ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                  )}
                >
                  {s}. {STEPS_LABELS[s]}
                </span>
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* ── PASSO 1: Informações ── */}
        {step === 1 && (
          <div className="space-y-4 py-2">

            {/* Tipo de Produto */}
            <div className="space-y-1.5">
              <Label>Tipo de Produto / Serviço *</Label>
              <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {PRODUCT_TYPES.map((group) => (
                    <div key={group.group}>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 sticky top-0">
                        {group.group}
                      </div>
                      {group.items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div className="space-y-1.5">
              <Label>Título da Demanda *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Post carrossel lançamento produto X" />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label>Descrição / Briefing</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="h-24"
                placeholder="Descreva o objetivo, tom de voz, detalhes importantes..."
              />
            </div>

            {/* Cliente(s) + Prazo */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Cliente(s) * <span className="text-muted-foreground font-normal text-[11px]">— selecione um ou mais</span></Label>
                <ClientMultiPicker
                  clients={clients}
                  selectedIds={selectedClientIds}
                  onChange={handleMultiClientChange}
                  disabled={!!preselectedClientId}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prazo Final</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>

            {/* Prioridade */}
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

            {/* Construtor de Fluxo */}
            <div className="space-y-1.5">
              <Label>Etapas do Fluxo</Label>
              <StepBuilder
                value={form.steps_flow}
                onChange={(steps) => setForm({ ...form, steps_flow: steps })}
              />
            </div>
          </div>
        )}

        {/* ── PASSO 2: Fluxo e Responsáveis ── */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Atribua responsáveis e prazos para cada etapa do fluxo.</p>
              <button
                type="button"
                onClick={() => {
                  const suggested = getSuggestedDeadlines();
                  setForm((f) => ({ ...f, step_deadlines: { ...suggested, ...Object.fromEntries(Object.entries(f.step_deadlines).filter(([,v]) => v)) } }));
                }}
                className="text-xs text-primary underline hover:opacity-70"
              >
                ✨ Sugerir prazos
              </button>
            </div>
            {stepsNeedingAssignee.map((s) => {
              const roleMembers = getMembersForRole(STEPS[s].role);
              return (
                <div key={s} className="bg-muted/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", STEPS[s]?.color || "bg-slate-400")} />
                    <p className="text-xs font-semibold">{STEPS[s].label}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={form.assignees[s] || ""}
                      onValueChange={(v) => setForm({ ...form, assignees: { ...form.assignees, [s]: v } })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Responsável" /></SelectTrigger>
                      <SelectContent>
                        {roleMembers.map((m) => <SelectItem key={m.id} value={m.email}>{m.name}</SelectItem>)}
                        {roleMembers.length === 0 && <SelectItem value={null} disabled>Sem membros nessa função</SelectItem>}
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
            {stepsNeedingAssignee.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma etapa com atribuição necessária nesse fluxo.</p>
            )}
          </div>
        )}

        {/* ── PASSO 3: Briefing Visual ── */}
        {step === 3 && (
          <div className="space-y-5 py-2">

            {/* Rabisco */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                🎨 Rabisco da Demanda
                <span className="text-[10px] text-muted-foreground font-normal">(estilo paint)</span>
              </Label>
              <SketchPad value={form.sketch_data} onChange={(v) => setForm({ ...form, sketch_data: v })} />
            </div>

            {/* Links de referência */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" /> Referências por Link
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://..."
                  className="text-sm"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
                />
                <Button type="button" size="sm" variant="outline" onClick={addLink} disabled={!newLink.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {(form.reference_links || []).length > 0 && (
                <div className="space-y-1.5">
                  {form.reference_links.map((link, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-1.5">
                      <LinkIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate flex-1">{link}</a>
                      <button type="button" onClick={() => removeLink(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload de imagens */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload de Referências (imagens/arquivos)
              </Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingFile ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Enviando...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1.5" />
                    <p className="text-sm text-muted-foreground">Clique ou arraste arquivos aqui</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, PDF, etc.</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.pptx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {(form.file_urls || []).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {form.file_urls.map((url, i) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
                    return (
                      <div key={i} className="relative group bg-muted/40 rounded-lg overflow-hidden border border-border">
                        {isImage ? (
                          <img src={url} alt="" className="w-full h-20 object-cover" />
                        ) : (
                          <div className="h-20 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                            📎 {url.split("/").pop()?.slice(0, 30)}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>← Voltar</Button>}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>

          {step < 3 && (
            <Button onClick={() => {
              if (step === 1) {
                // Ao entrar no passo 2, pré-preenche prazos sugeridos onde ainda não há valor
                const suggested = getSuggestedDeadlines();
                setForm((f) => ({
                  ...f,
                  step_deadlines: {
                    ...suggested,
                    ...Object.fromEntries(Object.entries(f.step_deadlines).filter(([,v]) => v))
                  }
                }));
              }
              setStep(step + 1);
            }} disabled={step === 1 && !canGoStep2}>
              Próximo →
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Criando...</>
                : selectedClientIds.length > 1
                  ? `Criar ${selectedClientIds.length} Demandas`
                  : "Criar Demanda"
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}