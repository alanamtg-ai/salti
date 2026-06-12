// FLUXO OFICIAL SALTI DESIGN
// Etapas fixas e responsáveis permitidos por etapa

export const STEPS = {
  estrategia: {
    label: "Estratégia",
    role: "estrategista",
    color: "bg-violet-500",
    light: "bg-violet-100 text-violet-700",
    allowedResponsibles: ["Alana"], // somente Alana
  },
  redacao: {
    label: "Redação",
    role: "redator",
    color: "bg-blue-500",
    light: "bg-blue-100 text-blue-700",
    allowedResponsibles: ["Alana", "Pamela", "Abner", "Gabriel"],
  },
  design: {
    label: "Design",
    role: "designer",
    color: "bg-pink-500",
    light: "bg-pink-100 text-pink-700",
    allowedResponsibles: ["Alana", "Pamela", "Gabriel", "Joilson", "Bruno", "Luis"],
  },
  aprovacao_cliente: {
    label: "Aprovação Cliente",
    role: "cliente",
    color: "bg-orange-500",
    light: "bg-orange-100 text-orange-700",
    allowedResponsibles: ["cliente"],
  },
  distribuicao: {
    label: "Distribuição",
    role: "social_media",
    color: "bg-emerald-500",
    light: "bg-emerald-100 text-emerald-700",
    allowedResponsibles: ["Pamela"], // somente Pamela
  },
  trafego_pago: {
    label: "Tráfego Pago",
    role: "gestor_trafego",
    color: "bg-cyan-500",
    light: "bg-cyan-100 text-cyan-700",
    allowedResponsibles: ["Jones"], // somente Jones
  },
  finalizado: {
    label: "Finalizado",
    role: "admin",
    color: "bg-slate-400",
    light: "bg-slate-100 text-slate-500",
    allowedResponsibles: ["Pamela"],
  },
};

// FLUXO ÚNICO OFICIAL
export const OFFICIAL_FLOW = [
  "estrategia",
  "redacao",
  "design",
  "aprovacao_cliente",
  "distribuicao",
  "trafego_pago",
  "finalizado"
];

// Etapa inicial padrão
export const INITIAL_STEP = "estrategia";
export const INITIAL_RESPONSIBLE = "Alana";

// Responsável por padrão na etapa de aprovação do cliente
export const CLIENTE_APPROVAL_NEXT_STEP = "distribuicao";
export const CLIENTE_APPROVAL_NEXT_RESPONSIBLE = "Pamela";

// Responsável final da demanda
export const FINAL_RESPONSIBLE = "Pamela";

// Etapa de rejeição — volta para a anterior
export const REJECTION_STEP_BEHAVIOR = "previous";

export function getStepLabel(step) {
  return STEPS[step]?.label || step || "—";
}

export function getStepColor(step) {
  return STEPS[step]?.color || "bg-slate-400";
}

export function getStepLight(step) {
  return STEPS[step]?.light || "bg-slate-100 text-slate-600";
}

// Obter responsáveis permitidos para uma etapa
export function getAllowedResponsiblesForStep(step) {
  return STEPS[step]?.allowedResponsibles || [];
}

// Obter próxima etapa no fluxo
export function getNextStep(currentStep) {
  const index = OFFICIAL_FLOW.indexOf(currentStep);
  if (index === -1 || index === OFFICIAL_FLOW.length - 1) return null;
  return OFFICIAL_FLOW[index + 1];
}

// Obter etapa anterior no fluxo
export function getPreviousStep(currentStep) {
  const index = OFFICIAL_FLOW.indexOf(currentStep);
  if (index <= 0) return null;
  return OFFICIAL_FLOW[index - 1];
}

// Validar se um responsável é permitido em uma etapa
export function isResponsibleAllowedInStep(responsible, step) {
  const allowed = getAllowedResponsiblesForStep(step);
  return allowed.includes(responsible);
}

// Obter responsável automático para uma etapa (quando há somente um)
export function getAutomaticResponsible(step) {
  const allowed = getAllowedResponsiblesForStep(step);
  if (allowed.length === 1) return allowed[0];
  return null;
}