import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const { event, data, old_data } = body;

  if (!data) return Response.json({ ok: true });

  const notifications = [];

  // 1. Demanda atribuída a alguém (assignee mudou)
  if (event?.type === "update" && old_data) {
    const steps = ["estrategia", "redacao", "design", "aprovacao_cliente", "distribuicao", "trafego_pago"];
    for (const step of steps) {
      const newAssignee = data.assignees?.[step];
      const oldAssignee = old_data.assignees?.[step];
      if (newAssignee && newAssignee !== oldAssignee) {
        notifications.push({
          recipient_email: newAssignee,
          type: "demand_assigned",
          title: "📋 Nova demanda atribuída a você",
          message: `A demanda "${data.title}" foi atribuída a você na etapa de ${step}.`,
          demand_id: data.id,
          demand_title: data.title,
          read: false
        });
      }
    }
  }

  // 2. Etapa da demanda mudou
  if (event?.type === "update" && old_data && data.current_step !== old_data.current_step) {
    const assignee = data.assignees?.[data.current_step] || data.responsavel_atual_email;
    if (assignee) {
      const stepLabels = {
        estrategia: "Estratégia",
        redacao: "Redação",
        design: "Design",
        aprovacao_cliente: "Aprovação do Cliente",
        distribuicao: "Distribuição",
        trafego_pago: "Tráfego Pago",
        finalizado: "Finalizado"
      };
      notifications.push({
        recipient_email: assignee,
        type: "step_changed",
        title: "🔄 Demanda chegou na sua etapa",
        message: `A demanda "${data.title}" avançou para ${stepLabels[data.current_step] || data.current_step} e aguarda sua ação.`,
        demand_id: data.id,
        demand_title: data.title,
        read: false
      });
    }
  }

  // 3. Demanda criada: notifica o responsável da primeira etapa
  if (event?.type === "create") {
    const firstStep = data.steps_flow?.[0] || "estrategia";
    const assignee = data.assignees?.[firstStep] || data.responsavel_atual_email;
    if (assignee) {
      notifications.push({
        recipient_email: assignee,
        type: "demand_assigned",
        title: "📋 Nova demanda criada para você",
        message: `A demanda "${data.title}" foi criada e está na sua fila.`,
        demand_id: data.id,
        demand_title: data.title,
        read: false
      });
    }
  }

  // Salva todas as notificações geradas
  for (const notif of notifications) {
    await base44.asServiceRole.entities.Notification.create(notif);
  }

  return Response.json({ ok: true, created: notifications.length });
});