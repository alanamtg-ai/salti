// Etapas disponíveis no sistema
export const STEPS = {
  estrategista: { label: "Estrategista", role: "admin", color: "bg-violet-500", light: "bg-violet-100 text-violet-700" },
  redator: { label: "Redator", role: "redator", color: "bg-blue-500", light: "bg-blue-100 text-blue-700" },
  designer: { label: "Designer", role: "designer", color: "bg-pink-500", light: "bg-pink-100 text-pink-700" },
  aprovacao_interna: { label: "Aprovação Interna", role: "admin", color: "bg-amber-500", light: "bg-amber-100 text-amber-700" },
  aprovacao_cliente: { label: "Aprovação Cliente", role: "cliente", color: "bg-orange-500", light: "bg-orange-100 text-orange-700" },
  social_media: { label: "Social Media", role: "social_media", color: "bg-emerald-500", light: "bg-emerald-100 text-emerald-700" },
  publicado: { label: "Publicado", role: null, color: "bg-slate-500", light: "bg-slate-100 text-slate-600" },
};

// Templates de fluxo por tipo de demanda
export const FLOW_TEMPLATES = {
  social_media: {
    label: "Social Media (completo)",
    steps: ["estrategista", "redator", "designer", "aprovacao_interna", "aprovacao_cliente", "social_media", "publicado"],
  },
  copy_only: {
    label: "Só Copy",
    steps: ["estrategista", "redator", "aprovacao_interna", "aprovacao_cliente", "social_media", "publicado"],
  },
  design_only: {
    label: "Só Design",
    steps: ["estrategista", "designer", "aprovacao_interna", "aprovacao_cliente", "social_media", "publicado"],
  },
  video: {
    label: "Vídeo",
    steps: ["estrategista", "redator", "designer", "aprovacao_interna", "aprovacao_cliente", "social_media", "publicado"],
  },
  website: {
    label: "Website / Landing Page",
    steps: ["estrategista", "redator", "designer", "aprovacao_interna", "aprovacao_cliente", "publicado"],
  },
  estrategia: {
    label: "Estratégia",
    steps: ["estrategista", "aprovacao_interna", "aprovacao_cliente", "publicado"],
  },
};

export function getStepLabel(step) {
  return STEPS[step]?.label || step;
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

// Dado o role do usuário, quais etapas ele pode "trabalhar"
export function getStepsForRole(role) {
  return Object.entries(STEPS)
    .filter(([, v]) => v.role === role)
    .map(([k]) => k);
}