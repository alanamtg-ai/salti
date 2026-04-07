import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Save, Send, Calendar, Clock, Tag, Radio, Loader2, CheckCircle2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import BulkCardGenerator from "./BulkCardGenerator";

const UNIVERSAL_MEMBERS = ["pamela", "saltiagencia@gmail.com"];

// Função para subtrair dias úteis (seg-sex)
const subtractBusinessDays = (date, businessDays) => {
  let currentDate = new Date(date);
  let count = 0;
  
  while (count < businessDays) {
    currentDate = subDays(currentDate, 1);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = domingo, 6 = sábado
      count++;
    }
  }
  
  return currentDate;
};

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const TIPOS_CONTEUDO = ["Post Feed", "Stories", "Reels / TikTok", "Carrossel", "Vídeo", "Copy / Legenda", "Outro"];
const CANAIS_OPCOES = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "WhatsApp"];

const emptyCard = () => ({
  id: crypto.randomUUID(),
  data_postagem: "",
  dia_semana: "",
  tipo_conteudo: "",
  canais: [],
  horario: "",
  tema: "",
  observacoes: "",
});

function ContentCard({ card, index, onChange, onRemove, readOnly }) {
  const toggleCanal = (canal) => {
    const next = card.canais.includes(canal)
      ? card.canais.filter((c) => c !== canal)
      : [...card.canais, canal];
    onChange({ ...card, canais: next });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 relative">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
          #{index + 1}
        </span>
        {!readOnly && (
          <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
          <Tag className="w-3 h-3" /> Tema / Assunto
        </label>
        <Input
          value={card.tema}
          onChange={(e) => onChange({ ...card, tema: e.target.value })}
          placeholder="Ex: Lançamento produto X, Dica da semana..."
          className="text-sm h-8"
          readOnly={readOnly}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" /> Data
          </label>
          <Input
            type="date"
            value={card.data_postagem}
            onChange={(e) => {
              const date = e.target.value;
              const jsDay = new Date(date + "T12:00:00").getDay();
              const dia = date ? DIAS_SEMANA[jsDay === 0 ? 6 : jsDay - 1] : "";
              onChange({ ...card, data_postagem: date, dia_semana: dia });
            }}
            className="text-xs h-8"
            readOnly={readOnly}
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Dia</label>
          <Input value={card.dia_semana} readOnly placeholder="Auto" className="text-xs h-8 bg-muted/40" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3" /> Horário
          </label>
          <Input
            type="time"
            value={card.horario}
            onChange={(e) => onChange({ ...card, horario: e.target.value })}
            className="text-xs h-8"
            readOnly={readOnly}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
          Tipo(s) de Conteúdo
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TIPOS_CONTEUDO.map((t) => {
            // Parse tipos — pode ser array ou string com vírgulas
            const tipos = Array.isArray(card.tipo_conteudo)
              ? card.tipo_conteudo
              : card.tipo_conteudo
              ? card.tipo_conteudo.split(", ").map((x) => x.trim())
              : [];
            const isSelected = tipos.includes(t);
            return (
              <button
                key={t}
                type="button"
                disabled={readOnly}
                onClick={() => {
                  const updated = isSelected
                    ? tipos.filter((x) => x !== t)
                    : [...tipos, t];
                  onChange({ ...card, tipo_conteudo: updated });
                }}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/60",
                  readOnly && "pointer-events-none"
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1.5">
          <Radio className="w-3 h-3" /> Canais
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CANAIS_OPCOES.map((c) => (
            <button
              key={c}
              type="button"
              disabled={readOnly}
              onClick={() => toggleCanal(c)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors",
                card.canais.includes(c)
                  ? "bg-violet-600 text-white border-violet-600"
                  : "border-border hover:border-violet-400/60 hover:bg-muted/60",
                readOnly && "pointer-events-none"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
          Observações para o Redator
        </label>
        <Textarea
          value={card.observacoes}
          onChange={(e) => onChange({ ...card, observacoes: e.target.value })}
          placeholder="Tom de voz, referências, hashtags sugeridas..."
          className="text-xs h-16 resize-none"
          readOnly={readOnly}
        />
      </div>

      {/* Timeline de prazos */}
      {card.data_postagem && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-border space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Timeline de Prazos</p>
          
          <div className="relative">
            {/* Linha conectora */}
            <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-700" />

            {/* Data da postagem */}
            <div className="relative pl-10 pb-6">
              <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white dark:border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Data da Postagem</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {format(new Date(card.data_postagem), "dd/MMM - EEEE", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Estratégia */}
            <div className="relative pl-10 pb-6">
              <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center border-4 border-white dark:border-slate-800">
                <span className="text-xs font-bold text-white">E</span>
              </div>
              <div>
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400">Estratégia</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {format(subDays(new Date(card.data_postagem), 45), "dd/MMM", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Redação */}
            <div className="relative pl-10 pb-6">
              <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center border-4 border-white dark:border-slate-800">
                <span className="text-xs font-bold text-white">R</span>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Redação</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {format(subDays(new Date(card.data_postagem), 20), "dd/MMM", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Design */}
            <div className="relative pl-10 pb-6">
              <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center border-4 border-white dark:border-slate-800">
                <span className="text-xs font-bold text-white">D</span>
              </div>
              <div>
                <p className="text-xs font-bold text-pink-600 dark:text-pink-400">Design</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {format(subDays(new Date(card.data_postagem), 15), "dd/MMM", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Aprovação Cliente */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center border-4 border-white dark:border-slate-800">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <div>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Aprovação Cliente (7 dias úteis)</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {format(subtractBusinessDays(new Date(card.data_postagem), 7), "dd/MMM", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Legenda de duração */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-2 border-t border-border/50">
            <div>Estratégia → Redação: <span className="font-bold">25 dias</span></div>
            <div>Redação → Design: <span className="font-bold">5 dias</span></div>
            <div>Design → Aprovação: <span className="font-bold">7 dias úteis</span></div>
          </div>
        </div>
      )}
      </div>
      );
      }

// Modal de confirmação de exclusão
function DeleteDemandModal({ open, onClose, demandTitle, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir Demanda</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a demanda <strong>"{demandTitle}"</strong>?
          </p>
          <p className="text-xs text-muted-foreground">
            Esta ação não pode ser desfeita.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal: seleciona redator e confirma envio
function SendToWriterModal({ open, onClose, cards, demand, members, onSent }) {
  const [redatorEmail, setRedatorEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const redatores = members.filter((m) => {
    if (m.role === "redator" || m.role === "admin") return true;
    if (UNIVERSAL_MEMBERS.some((name) => m.name?.toLowerCase().includes(name) || m.email === name)) return true;
    return false;
  });

  const handleSend = async () => {
    if (!redatorEmail) return;
    setSending(true);
    const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");

    // Cria uma demanda por card, já na etapa "redacao"
    await Promise.all(
      cards.map((card) =>
        base44.entities.Demand.create({
          title: card.tema || `Conteúdo - ${card.data_postagem || "sem data"}`,
          description: [
            card.tipo_conteudo && `Tipo: ${card.tipo_conteudo}`,
            card.data_postagem && `Data: ${card.data_postagem} (${card.dia_semana})`,
            card.horario && `Horário: ${card.horario}`,
            card.canais?.length && `Canais: ${card.canais.join(", ")}`,
            card.observacoes && `Observações: ${card.observacoes}`,
          ].filter(Boolean).join("\n"),
          client_id: demand.client_id,
          client_name: demand.client_name,
          priority: demand.priority,
          product_type: (() => {
            const tipo = Array.isArray(card.tipo_conteudo) ? card.tipo_conteudo[0] : card.tipo_conteudo;
            return tipo === "Post Feed" ? "post_feed"
              : tipo === "Stories" ? "post_stories"
              : tipo === "Reels / TikTok" ? "post_reels"
              : tipo === "Carrossel" ? "carrossel"
              : tipo === "Vídeo" ? "video_curto"
              : "copy_legenda";
          })(),
          steps_flow: ["redacao", "aprovacao_interna_redacao", "design", "aprovacao_interna_design", "aprovacao_cliente", "finalizado"],
          current_step: "redacao",
          current_step_index: 0,
          scheduled_date: card.data_postagem,
          assignees: { redacao: redatorEmail },
          status: "ativo",
          step_started_at: now,
          history: [{
            etapa_origem: "estrategia",
            etapa_destino: "redacao",
            acao: "aprovado",
            by: "admin",
            by_name: "Admin",
            date: now,
            observacao: `Enviado pelo estrategista. Card original: ${demand.title}`,
          }],
          // referência ao demand pai
          reference_links: demand.reference_links || [],
          sketch_data: demand.sketch_data || "",
        })
      )
    );

    setSending(false);
    setDone(true);
    setTimeout(() => {
      onSent();
      onClose();
      setDone(false);
      setRedatorEmail("");
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> Enviar para Redação
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-sm font-medium">{cards.length} demanda{cards.length > 1 ? "s" : ""} criada{cards.length > 1 ? "s" : ""} para {redatores.find((r) => r.email === redatorEmail)?.name}!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400">
                <p className="font-semibold mb-1">✓ Cards prontos para envio</p>
                <p>Serão criadas <strong>{cards.length}</strong> demanda{cards.length > 1 ? "s" : ""} na etapa de <strong>Redação</strong>.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Qual redator será responsável?</label>
                <Select value={redatorEmail} onValueChange={setRedatorEmail}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Selecione o redator..." /></SelectTrigger>
                  <SelectContent>
                    {redatores.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground">Nenhum redator disponível</div>
                    ) : (
                      redatores.map((m) => (
                        <SelectItem key={m.id} value={m.email}>{m.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSend} disabled={!redatorEmail || sending}>
                {sending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Criando...</> : <><Send className="w-4 h-4 mr-1" /> Enviar para {redatores.find((r) => r.email === redatorEmail)?.name || "Redator"}</>}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ContentCardsEditor({ demand, onUpdated, canEdit }) {
  const [cards, setCards] = useState(
    demand.content_cards?.length > 0 ? demand.content_cards : [emptyCard()]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [demandToDelete, setDemandToDelete] = useState(null);
  const [bulkGeneratorOpen, setBulkGeneratorOpen] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const updateCard = (idx, updated) => {
    setCards((prev) => prev.map((c, i) => (i === idx ? updated : c)));
    setSaved(false);
  };

  const addCard = () => { setCards((prev) => [...prev, emptyCard()]); setSaved(false); };
  const removeCard = (idx) => { setCards((prev) => prev.filter((_, i) => i !== idx)); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    // Converte arrays de tipo_conteudo para string antes de salvar
    const cardsToSave = cards.map((c) => ({
      ...c,
      tipo_conteudo: Array.isArray(c.tipo_conteudo) ? c.tipo_conteudo.join(", ") : c.tipo_conteudo,
    }));
    await base44.entities.Demand.update(demand.id, { content_cards: cardsToSave });
    setSaving(false);
    setSaved(true);
    onUpdated();
  };

  const handleDeleteDemand = async () => {
    if (!demandToDelete) return;
    await base44.entities.Demand.delete(demandToDelete.id);
    setDemandToDelete(null);
    onUpdated();
  };

  const handleBulkGenerate = (newCards) => {
    if (cards.length === 1 && cards[0].tema === "" && cards[0].data_postagem === "") {
      // Se só há um card vazio, substitui
      setCards(newCards);
    } else {
      // Caso contrário, adiciona aos existentes
      setCards([...cards, ...newCards]);
    }
    setSaved(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold">Cards de Conteúdo</p>
          <p className="text-xs text-muted-foreground">Preencha cada card — cada um vira uma demanda de redação.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <>
              <Button size="sm" variant="outline" onClick={() => setBulkGeneratorOpen(true)}>
                <Layers className="w-3.5 h-3.5 mr-1" /> Gerar em Lote
              </Button>
              <Button size="sm" variant="outline" onClick={addCard}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Card
              </Button>
            </>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              {saved && !saving ? "Salvo!" : "Salvar"}
            </Button>
          )}
          {canEdit && cards.length > 0 && (
            <Button size="sm" onClick={() => setSendModalOpen(true)}>
              <Send className="w-3.5 h-3.5 mr-1" /> Enviar para Redação
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card, idx) => (
          <ContentCard
            key={card.id}
            card={card}
            index={idx}
            onChange={(updated) => updateCard(idx, updated)}
            onRemove={() => removeCard(idx)}
            readOnly={!canEdit}
          />
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum card ainda.{" "}
          {canEdit && <button className="text-primary underline" onClick={addCard}>Adicionar o primeiro</button>}
        </div>
      )}

      <SendToWriterModal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        cards={cards}
        demand={demand}
        members={members}
        onSent={onUpdated}
      />

      <DeleteDemandModal
        open={!!demandToDelete}
        onClose={() => setDemandToDelete(null)}
        demandTitle={demandToDelete?.title}
        onConfirm={handleDeleteDemand}
      />

      <BulkCardGenerator
        open={bulkGeneratorOpen}
        onClose={() => setBulkGeneratorOpen(false)}
        onGenerate={handleBulkGenerate}
      />
    </div>
  );
}