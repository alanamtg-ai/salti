import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { getStepLabel, getStepLight, STEPS, REJECTION_STEP } from "@/lib/flowConfig";
import DemandTimeline from "./DemandTimeline";
import ContentCardsEditor from "./ContentCardsEditor";
import { CheckCircle2, XCircle, RotateCcw, Clock, AlertTriangle, ChevronRight, BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const priorityConfig = {
  baixa:   "bg-emerald-100 text-emerald-700",
  media:   "bg-amber-100 text-amber-700",
  alta:    "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};




export default function DemandDetailModal({ demand, member, onClose, onUpdated }) {
  const [note, setNote]                         = useState("");
  const [contentText, setContentText]           = useState(demand?.content_text || "");
  const [loading, setLoading]                   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("briefing");
  const [selectedDesigner, setSelectedDesigner] = useState(demand?.assignees?.design || "");

  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  if (!demand) return null;

  const currentStep  = demand.current_step;
  const stepIndex    = demand.current_step_index || 0;
  const stepsFlow    = demand.steps_flow || [];
  const isLastStep   = stepIndex >= stepsFlow.length - 1;
  const stepDeadline = demand.step_deadlines?.[currentStep];
  const deadline     = stepDeadline || demand.deadline;
  const isOverdue    = deadline && isPast(new Date(deadline)) && !isToday(new Date(deadline));
  const daysLate     = deadline ? Math.abs(differenceInDays(new Date(deadline), new Date())) : 0;

  const myRole  = member?.role;
  const stepRole = STEPS[currentStep]?.role;
  const isRedacaoStep = currentStep === "redacao";
  const isAssignee = demand.assignees?.[currentStep] === member?.email;
  const canAct = isRedacaoStep
    ? (isAssignee || (myRole === "redator" && !demand.assignees?.[currentStep]))
    : (myRole === stepRole || myRole === "admin");

  const buildEntry = (etapa_origem, etapa_destino, acao, observacao = "") => ({
    etapa_origem,
    etapa_destino,
    acao,
    by:       member?.email   || "sistema",
    by_name:  member?.name    || "Sistema",
    date:     format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    observacao: observacao || note,
  });

  // ✅ APROVAR — avança para próxima etapa
  const handleAprovar = async () => {
    // Se estou em redação e preciso designar designer, validar
    if (currentStep === "redacao" && stepsFlow.includes("design") && !selectedDesigner.trim()) {
      alert("Selecione um designer para a próxima etapa");
      return;
    }

    setLoading(true);
    const nextIndex = stepIndex + 1;
    const nextStep  = stepsFlow[nextIndex] || "finalizado";

    const updates = {
      current_step:       nextStep,
      current_step_index: nextIndex,
      status:             nextStep === "finalizado" ? "finalizado" : "ativo",
      rejection_note:     "",
      step_started_at:    format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      history: [...(demand.history || []), buildEntry(currentStep, nextStep, "aprovado")],
    };

    // Salvar conteúdo de redação se houver
    if (currentStep === "redacao" && contentText.trim()) {
      updates.content_text = contentText;
    }

    // Atualizar assignee do design se em redação
    if (currentStep === "redacao" && selectedDesigner.trim()) {
      updates.assignees = { ...demand.assignees, design: selectedDesigner };
    }

    await base44.entities.Demand.update(demand.id, updates);
    setNote("");
    setLoading(false);
    onUpdated();
    onClose();
  };

  // 🔁 REVISAR — volta para etapa anterior (com nota)
  const handleRevisar = async () => {
    if (!note.trim()) return;
    setLoading(true);
    const prevIndex = Math.max(0, stepIndex - 1);
    const prevStep  = stepsFlow[prevIndex];
    await base44.entities.Demand.update(demand.id, {
      current_step:       prevStep,
      current_step_index: prevIndex,
      rejection_note:     note,
      step_started_at:    format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      history: [...(demand.history || []), buildEntry(currentStep, prevStep, "revisou", note)],
    });
    setNote("");
    setLoading(false);
    onUpdated();
    onClose();
  };

  // ❌ REPROVAR — na aprovação interna de design volta para redação ou design
  const handleReprovar = async (targetOverride = null) => {
    if (!note.trim()) return;
    setLoading(true);

    let targetStep, targetIndex;

    if (targetOverride) {
      // escolha explícita (volta p/ redação ou design)
      targetStep = targetOverride;
      targetIndex = stepsFlow.indexOf(targetStep);
    } else {
      // padrão: volta para estrategia
      targetStep = REJECTION_STEP;
      targetIndex = stepsFlow.indexOf(targetStep);
    }

    await base44.entities.Demand.update(demand.id, {
      current_step:       targetStep,
      current_step_index: targetIndex >= 0 ? targetIndex : 0,
      rejection_note:     note,
      step_started_at:    format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      history: [...(demand.history || []), buildEntry(currentStep, targetStep, "reprovou", note)],
    });
    setNote("");
    setLoading(false);
    onUpdated();
    onClose();
  };

  const nextStep = stepsFlow[stepIndex + 1];

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.Demand.delete(demand.id);
    setDeleting(false);
    setShowDeleteConfirm(false);
    onUpdated();
    onClose();
  };

  // Admin pode deletar sempre; estrategista pode deletar em briefing/estratégia ou logo após envio para redação
  const canDelete = myRole === "admin" || (myRole === "estrategista" && (demand.current_step === "estrategia" || demand.current_step === "redacao"));

  // Label do botão de aprovação por contexto
  const approveLabel = () => {
    if (currentStep === "estrategia") return null; // estrategia usa ContentCardsEditor
    if (currentStep === "redacao") return "Enviar para Aprovação";
    if (currentStep === "design") return "Enviar para Aprovação";
    if (currentStep === "aprovacao_interna_design") return "Aprovar Design → Cliente";
    if (isLastStep) return "Finalizar";
    return "Aprovar";
  };

  // Reprovar na aprovação interna de design: escolhe se volta para redação ou design
  const isInternalDesignApproval = currentStep === "aprovacao_interna_design";

  return (
    <Dialog open={!!demand} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">{demand.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge className={cn("text-[10px]", priorityConfig[demand.priority])}>{demand.priority}</Badge>
            <Badge variant="outline" className="text-[10px]">{demand.client_name}</Badge>
            {isOverdue && (
              <Badge className="text-[10px] bg-red-100 text-red-700">
                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                Atrasado {daysLate}d
              </Badge>
            )}
            {deadline && !isOverdue && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> {format(new Date(deadline), "dd/MM/yyyy")}
              </span>
            )}
          </div>

          {/* Timeline */}
          <div className="overflow-x-auto">
            <DemandTimeline stepsFlow={stepsFlow} currentStepIndex={stepIndex} />
          </div>

          {/* Etapa atual + responsável + próxima */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Etapa Atual</p>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", getStepLight(currentStep))}>
                  {getStepLabel(currentStep)}
                </span>
              </div>
              {nextStep && nextStep !== "finalizado" && (
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Próxima Etapa</p>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full", getStepLight(nextStep))}>
                    {getStepLabel(nextStep)}
                  </span>
                </div>
              )}
            </div>
            {demand.assignees?.[currentStep] && (
              <p className="text-xs text-muted-foreground">
                👤 Responsável: <strong>{demand.assignees[currentStep]}</strong>
              </p>
            )}
            {demand.rejection_note && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                <strong>Nota:</strong> {demand.rejection_note}
              </div>
            )}
          </div>

          {/* Cards de conteúdo — apenas na etapa estratégia */}
          {currentStep === "estrategia" && (
            <div className="border-t pt-4 space-y-4">
              <ContentCardsEditor demand={demand} onUpdated={onUpdated} canEdit={canAct} member={member} />

              {/* Botão de exclusão em estratégia */}
              {canDelete && !showDeleteConfirm && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 border-red-200 hover:bg-red-100 w-full"
                  >
                    🗑️ Excluir Demanda
                  </Button>
                </div>
              )}
              {showDeleteConfirm && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? "Excluindo..." : "Confirmar Exclusão"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Abas: Briefing / Conteúdo (apenas em redação) */}
          {(demand.description || demand.sketch_data || (demand.reference_links || []).length > 0 || currentStep === "redacao") && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex gap-2 border-b border-border">
                <button
                  onClick={() => setActiveTab("briefing")}
                  className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors", 
                    activeTab === "briefing" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Briefing
                </button>
                {currentStep === "redacao" && (
                  <button
                    onClick={() => setActiveTab("conteudo")}
                    className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors", 
                      activeTab === "conteudo" 
                        ? "border-primary text-primary" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" /> Conteúdo
                  </button>
                )}
              </div>

              {/* Aba Briefing */}
              {activeTab === "briefing" && (
                <div className="space-y-3">
                  {demand.description && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Briefing</p>
                      <p className="text-sm whitespace-pre-line">{demand.description}</p>
                    </div>
                  )}

                  {demand.sketch_data && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Rabisco</p>
                      <img src={demand.sketch_data} alt="sketch" className="rounded-lg border border-border max-h-48 object-contain w-full bg-slate-50" />
                    </div>
                  )}

                  {(demand.reference_links || []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Referências</p>
                      <div className="space-y-1">
                        {demand.reference_links.map((l, i) => (
                          <a key={i} href={l} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary underline truncate">{l}</a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Aba Conteúdo (redação: editável | aprovação interna: leitura) */}
              {activeTab === "conteudo" && currentStep === "redacao" && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Escrever Conteúdo</p>
                  <Textarea
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    placeholder="Escreva o conteúdo aqui..."
                    className="h-48 text-sm resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground">Seu conteúdo será salvo ao enviar para aprovação.</p>
                </div>
              )}
              </div>
              )}

              {/* Seleção de Designer (ao aprovar redação) */}
              {currentStep === "redacao" && stepsFlow.includes("design") && canAct && (
              <div className="border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Designar Designer para Próxima Etapa *</p>
              <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione um designer..." /></SelectTrigger>
                <SelectContent>
                  {members.filter((m) => m.role === "designer" || m.role === "admin").map((m) => (
                    <SelectItem key={m.id} value={m.email}>{m.name}</SelectItem>
                  ))}
                  {members.filter((m) => m.role === "designer" || m.role === "admin").length === 0 && (
                    <SelectItem value={null} disabled>Nenhum designer disponível</SelectItem>
                  )}
                </SelectContent>
              </Select>
              </div>
              )}

          {/* ── AÇÕES ── */}
          {canAct && currentStep !== "finalizado" && currentStep !== "estrategia" && (
            <div className="border-t pt-4 space-y-3">
              {showDeleteConfirm && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? "Excluindo..." : "Confirmar Exclusão"}
                    </Button>
                  </div>
                </div>
              )}
              <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sua Ação</p>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Observação (obrigatória para Revisar e Reprovar)..."
                    className="h-20 text-sm"
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Reprovar — aprovação interna de design: escolhe destino */}
                    {isInternalDesignApproval ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReprovar("redacao")}
                          disabled={loading || !note.trim()}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reprovar → Redação
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReprovar("design")}
                          disabled={loading || !note.trim()}
                          className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" /> Reprovar → Design
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReprovar()}
                          disabled={loading || !note.trim()}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reprovar
                        </Button>
                        {stepIndex > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRevisar}
                            disabled={loading || !note.trim()}
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" /> Revisar
                          </Button>
                        )}
                      </>
                    )}

                    {/* Aprovar */}
                    {approveLabel() && (
                      <Button
                        size="sm"
                        onClick={() => handleAprovar()}
                        disabled={loading || (currentStep === "redacao" && !contentText.trim())}
                        className="ml-auto"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        {approveLabel()}
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    )}
                  </div>
              </>
            </div>
          )}

          {/* Botão de exclusão para estrategista na etapa de redação */}
          {canDelete && !showDeleteConfirm && (
            <div className="border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 w-full"
              >
                🗑️ Excluir Demanda
              </Button>
            </div>
          )}

          {/* Histórico */}
          {(demand.history || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Histórico</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[...(demand.history || [])].reverse().map((h, i) => {
                  const acaoColors = { aprovado: "text-emerald-600", revisou: "text-amber-600", reprovou: "text-red-600", criado: "text-blue-600" };
                  return (
                    <div key={i} className="text-xs flex gap-2 flex-wrap">
                      <span className="text-muted-foreground shrink-0">
                        {h.date ? format(new Date(h.date), "dd/MM HH:mm") : "—"}
                      </span>
                      <span className="font-medium">{h.by_name}</span>
                      <span className={cn("font-semibold", acaoColors[h.acao] || "text-muted-foreground")}>
                        {h.acao}
                      </span>
                      {h.etapa_origem && (
                        <span className="text-muted-foreground">
                          {getStepLabel(h.etapa_origem)} → {getStepLabel(h.etapa_destino)}
                        </span>
                      )}
                      {!h.etapa_origem && h.step && (
                        <span className="text-muted-foreground">em <em>{getStepLabel(h.step)}</em></span>
                      )}
                      {(h.observacao || h.note) && (
                        <span className="text-foreground italic">"{h.observacao || h.note}"</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}