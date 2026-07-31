-- Fase 7: tool registry hibrido.
-- Registra tools para Ahumada Detailing sin borrar acciones legacy.

with agent as (
  select
    a.id as agent_id,
    a.organization_id
  from public.agents a
  join public.organizations o on o.id = a.organization_id
  where o.slug = 'ahumada_detailing'
    and a.slug = 'ahumada_detailing_closer'
),
tools as (
  select
    agent.organization_id,
    agent.agent_id,
    item.tool_name,
    item.executor_type,
    item.executor_ref,
    item.required_fields,
    item.config,
    item.side_effect_level,
    true as is_active
  from agent
  cross join lateral (
    values
      (
        'message.send',
        'workflow',
        '6.1 send_outbound_message',
        '["lead_id","channel","message"]'::jsonb,
        '{"legacy_actions":["ask_missing_data","answer_question","answer_objection","offer_booking","send_service_menu","request_review","request_referral"]}'::jsonb,
        'medium'
      ),
      (
        'lead_state.update',
        'workflow',
        '6.24 persist_and_audit',
        '["lead_id"]'::jsonb,
        '{"legacy_actions":["all"]}'::jsonb,
        'medium'
      ),
      (
        'quote.create',
        'workflow',
        '6.8 send_quote',
        '["lead_id","channel","service_interest","vehicle_type","district"]'::jsonb,
        '{"legacy_actions":["send_quote"],"also_uses":["message.send"]}'::jsonb,
        'medium'
      ),
      (
        'calendar.availability',
        'workflow',
        '6.23 offer_available_slots',
        '["lead_id","channel","service_interest","vehicle_type","district"]'::jsonb,
        '{"legacy_actions":["offer_available_slots"]}'::jsonb,
        'low'
      ),
      (
        'calendar.create_booking',
        'workflow',
        '6.5 confirm_booking_executor',
        '["lead_id","channel","service_interest","vehicle_type","district","booking_date","booking_time","availability_confirmed"]'::jsonb,
        '{"legacy_actions":["confirm_booking"]}'::jsonb,
        'high'
      ),
      (
        'calendar.cancel_booking',
        'workflow',
        '6.6 cancel_booking',
        '["lead_id","channel"]'::jsonb,
        '{"legacy_actions":["cancel_booking"]}'::jsonb,
        'high'
      ),
      (
        'calendar.reschedule_booking',
        'workflow',
        '6.10 reschedule_booking',
        '["lead_id","channel"]'::jsonb,
        '{"legacy_actions":["reschedule_booking"]}'::jsonb,
        'high'
      ),
      (
        'handoff.create',
        'workflow',
        '6.22 handoff_human',
        '["lead_id","handoff_reason"]'::jsonb,
        '{"legacy_actions":["handoff_human"]}'::jsonb,
        'high'
      ),
      (
        'followup.schedule',
        'workflow',
        '6.21 schedule_followup',
        '["lead_id","followup_type","scheduled_for"]'::jsonb,
        '{"legacy_actions":["schedule_followup"]}'::jsonb,
        'medium'
      ),
      (
        'review.request',
        'workflow',
        '6.15 request_review',
        '["lead_id","channel"]'::jsonb,
        '{"legacy_actions":["request_review"]}'::jsonb,
        'medium'
      ),
      (
        'referral.request',
        'workflow',
        '6.16 request_referral',
        '["lead_id","channel"]'::jsonb,
        '{"legacy_actions":["request_referral"]}'::jsonb,
        'medium'
      )
  ) as item(tool_name, executor_type, executor_ref, required_fields, config, side_effect_level)
)
insert into public.agent_tools (
  organization_id,
  agent_id,
  tool_name,
  executor_type,
  executor_ref,
  required_fields,
  config,
  side_effect_level,
  is_active
)
select
  organization_id,
  agent_id,
  tool_name,
  executor_type,
  executor_ref,
  required_fields,
  config,
  side_effect_level,
  is_active
from tools
on conflict (agent_id, tool_name) do update set
  executor_type = excluded.executor_type,
  executor_ref = excluded.executor_ref,
  required_fields = excluded.required_fields,
  config = excluded.config,
  side_effect_level = excluded.side_effect_level,
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
  tools_version = 1,
  metadata = coalesce(arv.metadata, '{}'::jsonb) || '{"tool_registry":"v1"}'::jsonb
from agent
where arv.agent_id = agent.agent_id
  and arv.status = 'active';
