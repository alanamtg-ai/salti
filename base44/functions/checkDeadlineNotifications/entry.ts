import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const demands = await base44.asServiceRole.entities.Demand.filter({ status: "ativo" }, "-created_date", 500);
  const now = new Date();
  const notifications = [];

  for (const d of demands) {
    const dl = d.step_deadlines?.[d.current_step] || d.deadline;
    if (!dl) continue;

    const deadlineDate = new Date(dl);
    const diffMs = deadlineDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const assignee = d.assignees?.[d.current_step] || d.responsavel_atual_email;
    if (!assignee) continue;

    // Prazo vencido (enviar apenas uma vez por dia — verifica se já existe notif hoje)
    if (diffHours < 0) {
      const todayStr = now.toISOString().slice(0, 10);
      const existing = await base44.asServiceRole.entities.Notification.filter({
        demand_id: d.id,
        type: "deadline_overdue",
        recipient_email: assignee
      });
      const alreadySentToday = existing.some(n => n.created_date?.startsWith(todayStr));
      if (!alreadySentToday) {
        notifications.push({
          recipient_email: assignee,
          type: "deadline_overdue",
          title: "🚨 Demanda atrasada!",
          message: `A demanda "${d.title}" está atrasada. O prazo era ${deadlineDate.toLocaleDateString("pt-BR")}.`,
          demand_id: d.id,
          demand_title: d.title,
          read: false
        });
      }
    }
    // Prazo em até 24h
    else if (diffHours <= 24) {
      const existing = await base44.asServiceRole.entities.Notification.filter({
        demand_id: d.id,
        type: "deadline_warning",
        recipient_email: assignee
      });
      const cutoff = new Date(now - 24 * 60 * 60 * 1000);
      const alreadySent = existing.some(n => n.created_date && new Date(n.created_date) > cutoff);
      if (!alreadySent) {
        notifications.push({
          recipient_email: assignee,
          type: "deadline_warning",
          title: "⚠️ Prazo se aproximando",
          message: `A demanda "${d.title}" vence em menos de 24h (${deadlineDate.toLocaleDateString("pt-BR")}).`,
          demand_id: d.id,
          demand_title: d.title,
          read: false
        });
      }
    }
  }

  for (const notif of notifications) {
    await base44.asServiceRole.entities.Notification.create(notif);
  }

  return Response.json({ ok: true, created: notifications.length });
});