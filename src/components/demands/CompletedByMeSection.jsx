import { useState, useMemo } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { getStepLabel, getStepLight } from "@/lib/flowConfig";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const priorityConfig = {
  baixa:   { label: "Baixa",   cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  media:   { label: "Média",   cls: "bg-amber-100 text-amber-700 border-amber-200" },
  alta:    { label: "Alta",    cls: "bg-orange-100 text-orange-700 border-orange-200" },
  urgente: { label: "Urgente", cls: "bg-red-100 text-red-700 border-red-200" },
};

/**
 * Filtra as demandas que o membro já aprovou/avançou mas que agora estão em outra etapa.
 * Ou seja: demandas que passaram pela mão desse membro e já seguiram adiante.
 */
function getCompletedByMe(demands, member) {
  if (!member) return [];

  return demands.filter((d) => {
    // Se ainda está na etapa do membro, não é "concluída para ele"
    const history = d.history || [];

    // Verifica se o membro aprovou alguma etapa nessa demanda
    const myApproval = history.some(
      (h) => h.by === member.email && h.acao === "aprovado"
    );
    if (!myApproval) return false;

    // Verifica que a demanda NÃO está mais aguardando ação desse membro
    // (ou seja, a etapa atual não é mais de responsabilidade dele, ou ele não é o assignee)
    const isCurrentAssignee =
      d.assignees?.[d.current_step] === member.email ||
      (!d.assignees?.[d.current_step]);

    // Se a etapa atual ainda precisa dele, não considerar concluída
    // (apenas se a etapa do fluxo corresponde ao papel dele)
    return true; // Retorna todas que ele aprovou — filtramos no componente
  }).filter((d) => {
    // Garante que não está atualmente aguardando ação do membro
    const myStepApprovals = (d.history || []).filter(
      (h) => h.by === member.email && h.acao === "aprovado"
    );
    // Pega a aprovação mais recente dele
    const lastApproval = myStepApprovals[myStepApprovals.length - 1];
    if (!lastApproval) return false;

    // A etapa atual deve ser diferente da etapa que ele aprovou
    return d.current_step !== lastApproval.etapa_origem;
  });
}

export default function CompletedByMeSection({ demands, member, onOpenDetail }) {
  const [expanded, setExpanded] = useState(false);

  const completed = useMemo(
    () => getCompletedByMe(demands, member),
    [demands, member]
  );

  if (completed.length === 0) return null;

  const visible = expanded ? completed : completed.slice(0, 3);

  return (
    <section>
      <div
        className="flex items-center gap-2 mb-3 cursor-pointer group select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <h2 className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 transition-colors">
          Concluídas por mim ({completed.length})
        </h2>
        <span className="text-xs text-muted-foreground ml-1">
          {expanded ? "— clique para recolher" : "— clique para expandir"}
        </span>
        <div className="ml-auto">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map((d) => {
            const p = priorityConfig[d.priority] || priorityConfig.media;
            const lastApproval = [...(d.history || [])].reverse().find(
              (h) => h.by === member.email && h.acao === "aprovado"
            );
            return (
              <div
                key={d.id}
                onClick={() => onOpenDetail(d)}
                className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-md transition-all opacity-75 hover:opacity-100 group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground truncate block">{d.client_name}</span>
                    <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {d.title}
                    </h4>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px] shrink-0 border", p.cls)}>{p.label}</Badge>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {lastApproval && (
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium line-through opacity-60", getStepLight(lastApproval.etapa_origem))}>
                      {getStepLabel(lastApproval.etapa_origem)}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", getStepLight(d.current_step))}>
                    {getStepLabel(d.current_step)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  {lastApproval?.date && (
                    <span className="text-[10px] text-muted-foreground">
                      ✓ {format(parseISO(lastApproval.date), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  )}
                  <span className="text-[10px] text-primary font-medium ml-auto flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Ver demanda
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full rounded-xl border-2 border-dashed border-emerald-200 py-3 text-xs text-emerald-600 font-medium hover:bg-emerald-50 transition-colors"
        >
          Ver {completed.length} demanda{completed.length > 1 ? "s" : ""} concluída{completed.length > 1 ? "s" : ""} por mim →
        </button>
      )}
    </section>
  );
}