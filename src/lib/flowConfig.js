// Etapas oficiais do fluxo Salti Design
export const STEPS = {
  briefing:           { label: "Briefing",          role: "admin",        color: "bg-slate-500",   light: "bg-slate-100 text-slate-700" },
  estrategia:         { label: "Estratégia",         role: "estrategista", color: "bg-violet-500",  light: "bg-violet-100 text-violet-700" },
  redacao:            { label: "Redação",             role: "redator",      color: "bg-blue-500",    light: "bg-blue-100 text-blue-700" },
  design:             { label: "Design",              role: "designer",     color: "bg-pink-500",    light: "bg-pink-100 text-pink-700" },
  aprovacao_cliente:  { label: "Aprovação Cliente",  role: "cliente",      color: "bg-orange-500",  light: "bg-orange-100 text-orange-700" },
  distribuicao:       { label: "Distribuição",        role: "social_media", color: "bg-emerald-500", light: "bg-emerald-100 text-emerald-700" },
  finalizado:         { label: "Finalizado",          role: null,           color: "bg-slate-400",   light: "bg-slate-100 text-slate-500" },
};

// Fluxo padrão — único fluxo oficial
export const FLOW_TEMPLATES = {
  padrao: {
    label: "Fluxo Padrão Salti",
    steps: ["briefing", "estrategia", "redacao", "design", "aprovacao_cliente", "distribuicao", "finalizado"],
  },
  sem_redacao: {
    label: "Sem Redação",
    steps: ["briefing", "estrategia", "design", "aprovacao_cliente", "distribuicao", "finalizado"],
  },
  sem_distribuicao: {
    label: "Sem Distribuição",
    steps: ["briefing", "estrategia", "redacao", "design", "aprovacao_cliente", "finalizado"],
  },
  estrategia_only: {
    label: "Só Estratégia",
    steps: ["briefing", "estrategia", "aprovacao_cliente", "finalizado"],
  },
};

// Etapa de rejeição total — sempre volta para estrategia
export const REJECTION_STEP = "estrategia";

export function getStepLabel(step) {
  return STEPS[step]?.label || step || "—";
}

export function getStepColor(step) {
  return STEPS[step]?.color || "bg-slate-400";
}

export function getStepLight(step) {
  return STEPS[step]?.light || "bg-slate-100 text-slate-600";
}

export function getRoleForStep(step) {
  return STEPS[step]?.role || null;
}

export function getStepsForRole(role) {
  return Object.entries(STEPS)
    .filter(([, v]) => v.role === role)
    .map(([k]) => k);
}