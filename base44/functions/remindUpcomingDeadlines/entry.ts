import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const now = new Date();
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const in55min = new Date(now.getTime() + 55 * 60 * 1000);

  // Fetch active demands
  const demands = await base44.asServiceRole.entities.Demand.filter({ status: "ativo" });

  let notificationsCreated = 0;

  for (const demand of demands) {
    if (!demand.current_step || demand.current_step === "finalizado") continue;

    // Get the effective deadline: step-specific or general
    const stepDeadlineStr = demand.step_deadlines?.[demand.current_step] || demand.deadline;
    if (!stepDeadlineStr) continue;

    // If step deadline has no time, treat as end of that day
    const deadlineDate = stepDeadlineStr.includes("T")
      ? new Date(stepDeadlineStr)
      : new Date(stepDeadlineStr + "T23:59:00");

    // Check if deadline falls within the next 55–65 minutes window
    if (deadlineDate >= in55min && deadlineDate <= in1h) {
      // Determine who to notify: assignee for current step
      const assigneeEmail = demand.assignees?.[demand.current_step] || demand.responsavel_atual_email;
      if (!assigneeEmail) continue;

      // Avoid duplicate notifications: check if one was already sent in the last hour
      const recentNotifs = await base44.asServiceRole.entities.Notification.filter({
        recipient_email: assigneeEmail,
        demand_id: demand.id,
        type: "deadline_warning",
      });

      const alreadySent = recentNotifs.some((n) => {
        const created = new Date(n.created_date);
        return (now - created) < 2 * 60 * 60 * 1000; // within 2 hours
      });

      if (alreadySent) continue;

      const minutesLeft = Math.round((deadlineDate - now) / 60000);

      await base44.asServiceRole.entities.Notification.create({
        recipient_email: assigneeEmail,
        type: "deadline_warning",
        title: "⏰ Prazo se aproximando!",
        message: `A demanda "${demand.title}" (${demand.client_name}) vence em aproximadamente ${minutesLeft} minutos.`,
        demand_id: demand.id,
        demand_title: demand.title,
        read: false,
      });

      notificationsCreated++;
    }
  }

  return Response.json({ success: true, notificationsCreated });
});