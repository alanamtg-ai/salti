import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (no user) or admin user
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') isAuthorized = true;
    } catch {
      // Called by scheduler (no user context) — allow via service role
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const todayDow = now.getDay();       // 0=Sun...6=Sat
    const todayDom = now.getDate();      // 1-31
    const nowISO   = now.toISOString();
    const todayStr = nowISO.slice(0, 10);

    const recurring = await base44.asServiceRole.entities.RecurringDemand.list();
    const active = recurring.filter((r) => r.active);

    const created = [];

    for (const r of active) {
      // Check if already generated today
      if (r.last_generated_date && r.last_generated_date.slice(0, 10) === todayStr) continue;

      let shouldFire = false;
      if (r.recurrence_type === 'daily') shouldFire = true;
      if (r.recurrence_type === 'weekly' && r.recurrence_day_of_week === todayDow) shouldFire = true;
      if (r.recurrence_type === 'monthly' && r.recurrence_day_of_month === todayDom) shouldFire = true;

      if (!shouldFire) continue;

      const steps = r.steps_flow?.length ? r.steps_flow : ['briefing', 'estrategia', 'redacao', 'design', 'aprovacao_cliente', 'agendamento', 'distribuicao', 'finalizado'];

      // Se client_id for "__todos__", cria uma demanda para cada cliente ativo
      let clientsToCreate = [];
      if (r.client_id === '__todos__') {
        const allClients = await base44.asServiceRole.entities.Client.list();
        clientsToCreate = allClients.filter((c) => c.active !== false).map((c) => ({ id: c.id, name: c.name }));
      } else {
        clientsToCreate = [{ id: r.client_id, name: r.client_name || '' }];
      }

      for (const client of clientsToCreate) {
        await base44.asServiceRole.entities.Demand.create({
          title: r.title,
          description: r.description || '',
          product_type: r.product_type || 'outro',
          client_id: client.id,
          client_name: client.name,
          priority: r.priority || 'media',
          steps_flow: steps,
          assignees: r.assignees || {},
          current_step: steps[0],
          current_step_index: 0,
          status: 'ativo',
          step_started_at: nowISO,
          history: [{
            etapa_origem: null,
            etapa_destino: steps[0],
            acao: 'criado',
            by: 'sistema',
            by_name: 'Automação Recorrente',
            date: nowISO,
            observacao: `Gerado automaticamente pela recorrência: ${r.title}`,
          }],
        });
      }

      await base44.asServiceRole.entities.RecurringDemand.update(r.id, {
        last_generated_date: nowISO,
      });

      created.push(r.title);
    }

    return Response.json({ created, count: created.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});