import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [clients, demands, members] = await Promise.all([
    base44.asServiceRole.entities.Client.filter({ active: true }),
    base44.asServiceRole.entities.Demand.filter({ status: "ativo" }),
    base44.asServiceRole.entities.TeamMember.filter({}),
  ]);

  const admins = members.filter((m) => m.role === "admin" || (Array.isArray(m.role) && m.role.includes("admin")));

  let notificationsCreated = 0;

  for (const client of clients) {
    // Find all demands for this client
    const clientDemands = demands.filter((d) => d.client_id === client.id);

    // Determine last activity: latest updated_date or created_date among client's demands
    let lastActivity = null;
    for (const d of clientDemands) {
      const activityDate = new Date(d.updated_date || d.created_date);
      if (!lastActivity || activityDate > lastActivity) {
        lastActivity = activityDate;
      }
    }

    // If no demands at all, use client creation date
    if (!lastActivity) {
      lastActivity = new Date(client.created_date);
    }

    // Skip if activity is within 7 days
    if (lastActivity >= sevenDaysAgo) continue;

    const daysSince = Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000));

    // Avoid duplicate notifications: skip if already notified in last 24h
    for (const admin of admins) {
      const recent = await base44.asServiceRole.entities.Notification.filter({
        recipient_email: admin.email,
        type: "deadline_warning",
      });

      const alreadySent = recent.some((n) => {
        return (
          n.message?.includes(client.name) &&
          n.title?.includes("inativo") &&
          (now - new Date(n.created_date)) < 24 * 60 * 60 * 1000
        );
      });

      if (alreadySent) continue;

      await base44.asServiceRole.entities.Notification.create({
        recipient_email: admin.email,
        type: "deadline_warning",
        title: `⚠️ Cliente inativo: ${client.name}`,
        message: `O cliente "${client.name}" não tem nenhuma demanda criada ou atualizada há ${daysSince} dias.`,
        read: false,
      });

      notificationsCreated++;
    }
  }

  return Response.json({ success: true, notificationsCreated });
});