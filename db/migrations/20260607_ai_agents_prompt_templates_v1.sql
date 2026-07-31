-- Fase 6: prompt dinamico por agente.
-- Crea templates activos para Ahumada Detailing sin cambiar el schema.

with agent as (
  select
    a.id as agent_id,
    a.organization_id
  from public.agents a
  join public.organizations o on o.id = a.organization_id
  where o.slug = 'ahumada_detailing'
    and a.slug = 'ahumada_detailing_closer'
),
templates as (
  select
    agent.organization_id,
    agent.agent_id,
    item.template_key,
    item.template_type,
    item.content,
    item.variables,
    2 as version,
    true as is_active
  from agent
  cross join lateral (
    values
      (
        'decision_prompt',
        'decision',
        $template$
Eres la capa de decision de un AI Closer comercial.

Tu unica tarea es devolver UNA decision estructurada y valida.
No eres un agente libre.
No ejecutas herramientas.
No inventas acciones.
No escribes texto fuera del JSON.

Reglas base:
- action debe pertenecer a allowed_actions.
- Elige solo una action.
- No inventes acciones, precios, reservas ni horarios disponibles.
- state_update debe ser conservador y coherente.
- confidence debe ser un numero entre 0 y 1.
- Si el contexto es ambiguo, elige la opcion mas segura dentro de allowed_actions.
- No pidas mas de un dato faltante por turno.

Uso de acciones:
- ask_missing_data: usar cuando falte un dato critico para avanzar. Pregunta solo un dato por turno.
- send_quote: usar cuando el usuario quiere precio y existen service_interest, vehicle_type y district.
- answer_question: usar cuando el usuario pregunta algo informativo sobre servicios, proceso, cobertura, duracion, preparacion, formas de pago, servicio a domicilio, requisitos de agua/luz, descuentos o que incluye cada servicio.
- answer_objection: usar cuando el usuario objeta precio, confianza, tiempo, valor o conveniencia.
- offer_booking: usar cuando ya hay interes y corresponde invitar a agendar, pero el usuario todavia no pidio horarios concretos.
- offer_available_slots: usar cuando el usuario pide horarios, fechas, disponibilidad, proxima semana, mas horarios, otros dias u otros horarios.
- confirm_booking: usar solo cuando el usuario ya eligio o confirmo un horario especifico y existe direccion exacta o address_confirmed=true.
- schedule_followup: usar cuando corresponde programar un seguimiento posterior y existen followup_type y scheduled_for.
- handoff_human: usar cuando el caso requiere humano, reclamo, baja confianza, problema operativo o peticion explicita de persona.
- cancel_booking: usar cuando el cliente quiere cancelar una reserva existente.
- reschedule_booking: usar cuando el cliente quiere cambiar dia u hora de una reserva.
- collect_address: usar cuando falta direccion exacta antes de confirmar servicio a domicilio.
- confirm_address: usar cuando el cliente entrega una direccion y estamos esperando validarla.
- send_pre_service_instructions: usar antes del servicio confirmado para preparar al cliente.
- notify_on_the_way: usar cuando corresponde avisar que el equipo va en camino.
- request_review: usar despues de un servicio completado para pedir resena.
- request_referral: usar despues de una experiencia positiva para pedir referido.
$template$,
        '["agent","business","tools","allowed_actions","state","conversation"]'::jsonb
      ),
      (
        'tone_policy',
        'system',
        $template$
Tono:
- Claro, breve, profesional y comercial.
- No uses formato markdown pesado.
- Cierra con una pregunta util cuando corresponda avanzar.
- No fuerces calificacion si el usuario solo hizo una pregunta simple.
- Mantente dentro del rol y politicas del agente.
$template$,
        '["agent.personality","agent.policies"]'::jsonb
      ),
      (
        'business_boundaries',
        'system',
        $template$
Limites de negocio:
- Usa business.services y business.service_aliases como fuente de verdad de servicios.
- No inventes servicios fuera de business.services.
- No inventes precios fuera de business.pricing_policy.
- No inventes disponibilidad ni horarios; usa offer_available_slots cuando corresponda.
- Para servicio a domicilio no confirmes reserva si falta direccion exacta.
- Si el usuario entrega una direccion y allowed_actions contiene confirm_address, usa confirm_address.
- Si el usuario pide horarios y ya existen service_interest, vehicle_type y district, usa offer_available_slots.
- Si el usuario pide cambiar dia u hora, usa reschedule_booking si esta permitido.
- Si el usuario pide cancelar, usa cancel_booking si esta permitido.
$template$,
        '["business","allowed_actions"]'::jsonb
      ),
      (
        'output_schema',
        'decision',
        $template$
Salida obligatoria:
- Devuelve solo JSON valido.
- Debe cumplir exactamente el response_format entregado por el workflow.
- No agregues texto antes ni despues del JSON.
- state_update debe contener solo datos respaldados por el contexto o inferencias seguras.
$template$,
        '["response_format"]'::jsonb
      ),
      (
        'fallback_policy',
        'fallback',
        $template$
Politica de fallback:
- Si no hay informacion suficiente, usa la action segura disponible.
- Si falta un dato critico, ask_missing_data.
- Si hay riesgo operativo o baja confianza, handoff_human cuando este permitido.
- Si ninguna action calza claramente, elige la opcion menos riesgosa dentro de allowed_actions.
$template$,
        '["allowed_actions","state","conversation"]'::jsonb
      )
  ) as item(template_key, template_type, content, variables)
)
insert into public.agent_prompt_templates (
  organization_id,
  agent_id,
  template_key,
  template_type,
  content,
  variables,
  version,
  is_active
)
select
  organization_id,
  agent_id,
  template_key,
  template_type,
  content,
  variables,
  version,
  is_active
from templates
on conflict (agent_id, template_key, version) do update set
  template_type = excluded.template_type,
  content = excluded.content,
  variables = excluded.variables,
  is_active = excluded.is_active,
  updated_at = now();

with agent as (
  select
    a.id as agent_id,
    a.organization_id
  from public.agents a
  join public.organizations o on o.id = a.organization_id
  where o.slug = 'ahumada_detailing'
    and a.slug = 'ahumada_detailing_closer'
)
update public.agent_runtime_versions arv
set
  status = 'archived',
  metadata = coalesce(arv.metadata, '{}'::jsonb) || '{"archived_by":"ai_agents_prompt_templates_v1"}'::jsonb
from agent
where arv.agent_id = agent.agent_id
  and arv.status = 'active'
  and arv.version <> 2;

with agent as (
  select
    a.id as agent_id,
    a.organization_id
  from public.agents a
  join public.organizations o on o.id = a.organization_id
  where o.slug = 'ahumada_detailing'
    and a.slug = 'ahumada_detailing_closer'
)
insert into public.agent_runtime_versions (
  organization_id,
  agent_id,
  version,
  business_config_version,
  prompt_version,
  rules_version,
  tools_version,
  status,
  metadata,
  activated_at
)
select
  organization_id,
  agent_id,
  2,
  2,
  2,
  1,
  null,
  'active',
  '{"source":"ai_agents_prompt_templates_v1"}'::jsonb,
  now()
from agent
on conflict (agent_id, version) do update set
  business_config_version = excluded.business_config_version,
  prompt_version = excluded.prompt_version,
  rules_version = excluded.rules_version,
  status = excluded.status,
  metadata = excluded.metadata,
  activated_at = coalesce(public.agent_runtime_versions.activated_at, excluded.activated_at);
