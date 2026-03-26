import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getStepLabel, getStepLight, STEPS } from "@/lib/flowConfig";
import DemandTimeline from "./DemandTimeline";
import { CheckCircle2, XCircle, ChevronRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const priorityConfig = {
  baixa: "bg-emerald-100 text-emerald-700",
  media: "bg-amber-100 text-amber-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

export default function DemandDetailModal({ demand, member, onClose, onUpdated }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  if (!demand) return null;

  const currentStep = demand.current_step;
  const stepIndex = demand.current_step_index || 0;
  const stepsFlow = demand.steps_flow || [];
  const isLastStep = stepIndex >= stepsFlow.length - 1;
  const stepDeadline = demand.step_deadlines?.[currentStep];

  // Verifica se o usuário logado pode agir na etapa atual
  const myRole = member?.role;
  const stepRole = STEPS[currentStep]?.role;
  const canAct = myRole === stepRole || myRole === "admin";

  const advance = async (action, extraNote = "") => {
    setLoading(true);
    const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    const newIndex = stepIndex + 1;
    const newStep = stepsFlow[newIndex] || "publicado";
    const historyEntry = {
      step: currentStep,
      action,
      by: member?.email || "sistema",
      by_name: member?.name || "Sistema",
      date: now,
      note: extraNote || note,
    };
    await base44.entities.Demand.update(demand.id, {
      current_step: newStep,
      current_step_index: newIndex,
      status: newStep === "publicado" ? "publicado" : "ativo",
      rejection_note: "",
      history: [...(demand.history || []), historyEntry],
    });
    setNote("");
    setLoading(false);
    onUpdated();
    onClose();
  };

  const reject = async () => {
    if (!note.trim()) return;
    setLoading(true);
    const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    // Volta para etapa anterior (exceto para aprovação — vai para designer/redator)
    const prevIndex = Math.max(0, stepIndex - 1);
    const prevStep = stepsFlow[prevIndex];
    const historyEntry = {
      step: currentStep,
      action: "devolvido",
      by: member?.email || "sistema",
      by_name: member?.name || "Sistema",
      date: now,
      note,
    };
    await base44.entities.Demand.update(demand.id, {
      current_step: prevStep,
      current_step_index: prevIndex,
      rejection_note: note,
      history: [...(demand.history || []), historyEntry],
    });
    setNote("");
    setLoading(false);
    onUpdated();
    onClose();
  };

  return (
    <Dialog open={!!demand} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">{demand.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge className={cn("text-[10px]", priorityConfig[demand.priority])}>{demand.priority}</Badge>
            <Badge variant="outline" className="text-[10px]">{demand.client_name}</Badge>
            {demand.deadline && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> Prazo: {format(new Date(demand.deadline), "dd/MM/yyyy")}
              </span>
            )}
          </div>

          {/* Timeline */}
          <div className="overflow-x-auto">
            <DemandTimeline stepsFlow={stepsFlow} currentStepIndex={stepIndex} />
          </div>

          {/* Etapa atual */}
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Etapa Atual</p>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", getStepLight(currentStep))}>
                {getStepLabel(currentStep)}
              </span>
              {stepDeadline && (
                <span className="text-xs text-muted-foreground">
                  Prazo: {format(new Date(stepDeadline), "dd/MM/yyyy")}
                </span>
              )}
            </div>
            {demand.rejection_note && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                <strong>Devolvido com nota:</strong> {demand.rejection_note}
              </div>
            )}
          </div>

          {/* Descrição */}
          {demand.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Briefing</p>
              <p className="text-sm text-foreground">{demand.description}</p>
            </div>
          )}

          {/* Ações para quem pode agir */}
          {canAct && currentStep !== "publicado" && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sua Ação</p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Adicionar observação (opcional para avançar, obrigatório para devolver)..."
                className="h-20 text-sm"
              />
              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <Button variant="outline" size="sm" onClick={reject} disabled={loading || !note.trim()} className="text-red-600 border-red-200 hover:bg-red-50">
                    <XCircle className="w-4 h-4 mr-1" /> Devolver
                  </Button>
                )}
                <Button size="sm" onClick={() => advance("avançado")} disabled={loading} className="ml-auto">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {isLastStep ? "Publicar" : currentStep === "aprovacao_interna" ? "Aprovar Internamente" : currentStep === "aprovacao_cliente" ? "Aprovar" : "Concluir e Avançar"}
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Histórico */}
          {(demand.history || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Histórico</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {[...(demand.history || [])].reverse().map((h, i) => (
                  <div key={i} className="text-xs flex gap-2">
                    <span className="text-muted-foreground shrink-0">
                      {h.date ? format(new Date(h.date), "dd/MM HH:mm") : "—"}
                    </span>
                    <span className="font-medium">{h.by_name}</span>
                    <span className="text-muted-foreground">{h.action} em <em>{getStepLabel(h.step)}</em></span>
                    {h.note && <span className="text-foreground">— "{h.note}"</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}