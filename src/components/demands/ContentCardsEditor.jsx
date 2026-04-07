import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Save, Send, Calendar, Clock, Tag, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const TIPOS_CONTEUDO = [
  "Post Feed", "Stories", "Reels / TikTok", "Carrossel", "Vídeo", "Copy / Legenda", "Outro"
];

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

function ContentCard({ card, index, onChange, onRemove }) {
  const toggleCanal = (canal) => {
    const next = card.canais.includes(canal)
      ? card.canais.filter((c) => c !== canal)
      : [...card.canais, canal];
    onChange({ ...card, canais: next });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 relative">
      {/* Número do card */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
          #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tema */}
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
          <Tag className="w-3 h-3" /> Tema / Assunto
        </label>
        <Input
          value={card.tema}
          onChange={(e) => onChange({ ...card, tema: e.target.value })}
          placeholder="Ex: Lançamento produto X, Dica da semana..."
          className="text-sm h-8"
        />
      </div>

      {/* Data + Dia da semana + Horário */}
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
              const dia = date ? DIAS_SEMANA[new Date(date + "T12:00:00").getDay() === 0 ? 6 : new Date(date + "T12:00:00").getDay() - 1] : "";
              onChange({ ...card, data_postagem: date, dia_semana: dia });
            }}
            className="text-xs h-8"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
            Dia
          </label>
          <Input
            value={card.dia_semana}
            readOnly
            placeholder="Auto"
            className="text-xs h-8 bg-muted/40"
          />
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
          />
        </div>
      </div>

      {/* Tipo de conteúdo */}
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
          Tipo de Conteúdo
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TIPOS_CONTEUDO.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ ...card, tipo_conteudo: t })}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors",
                card.tipo_conteudo === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/60"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Canais */}
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1.5">
          <Radio className="w-3 h-3" /> Canais
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CANAIS_OPCOES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCanal(c)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors",
                card.canais.includes(c)
                  ? "bg-violet-600 text-white border-violet-600"
                  : "border-border hover:border-violet-400/60 hover:bg-muted/60"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
          Observações para o Redator
        </label>
        <Textarea
          value={card.observacoes}
          onChange={(e) => onChange({ ...card, observacoes: e.target.value })}
          placeholder="Tom de voz, referências, hashtags sugeridas..."
          className="text-xs h-16 resize-none"
        />
      </div>
    </div>
  );
}

export default function ContentCardsEditor({ demand, onUpdated, canEdit }) {
  const existingCards = demand.content_cards || [];
  const [cards, setCards] = useState(existingCards.length > 0 ? existingCards : [emptyCard()]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Quantos conteúdos o cliente tem contratados (via demand não temos esse dado diretamente)
  // Deixamos livre para adicionar quantos quiser

  const updateCard = (idx, updated) => {
    setCards((prev) => prev.map((c, i) => (i === idx ? updated : c)));
    setSaved(false);
  };

  const addCard = () => {
    setCards((prev) => [...prev, emptyCard()]);
    setSaved(false);
  };

  const removeCard = (idx) => {
    setCards((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Demand.update(demand.id, { content_cards: cards });
    setSaving(false);
    setSaved(true);
    onUpdated();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Cards de Conteúdo</p>
          <p className="text-xs text-muted-foreground">Preencha cada card com as informações para o redator.</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button size="sm" variant="outline" onClick={addCard}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Card
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-1"><Save className="w-3.5 h-3.5 animate-pulse" /> Salvando...</span>
              ) : saved ? (
                <span className="flex items-center gap-1 text-emerald-100"><Save className="w-3.5 h-3.5" /> Salvo!</span>
              ) : (
                <span className="flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Salvar</span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card, idx) => (
          <ContentCard
            key={card.id}
            card={card}
            index={idx}
            onChange={(updated) => updateCard(idx, updated)}
            onRemove={() => removeCard(idx)}
          />
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum card ainda.{" "}
          {canEdit && (
            <button className="text-primary underline" onClick={addCard}>Adicionar o primeiro</button>
          )}
        </div>
      )}
    </div>
  );
}