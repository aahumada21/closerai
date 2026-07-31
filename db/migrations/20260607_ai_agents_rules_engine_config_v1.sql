-- AI Agents rules engine hybrid config v1.
-- Extracts configurable lead qualification rules while preserving critical hardcoded safeguards.

with target_agent as (
  select
    a.id as agent_id,
    a.organization_id
  from public.agents a
  join public.organizations o on o.id = a.organization_id
  where o.slug = 'ahumada_detailing'
    and a.slug = 'ahumada_detailing_closer'
  limit 1
)
insert into public.agent_rules (
  organization_id,
  agent_id,
  rule_key,
  priority,
  rule_type,
  config,
  is_active
)
select
  ta.organization_id,
  ta.agent_id,
  'lead_required_fields',
  80,
  'required_fields_by_stage',
  '{
    "version": 1,
    "required_fields_by_stage": {
      "default": ["service_interest", "district", "vehicle_type"],
      "new_lead": ["service_interest", "district", "vehicle_type"],
      "qualified": ["service_interest", "district", "vehicle_type"],
      "quoted": ["service_interest", "district", "vehicle_type"],
      "closing": ["service_interest", "district", "vehicle_type"],
      "booking_selection": ["service_interest", "district", "vehicle_type"],
      "booking_confirmation": ["service_interest", "district", "vehicle_type", "booking_date", "booking_time"],
      "collecting_address": ["address"],
      "address_confirmation": [],
      "booked": [],
      "cancelling": [],
      "reschedule": [],
      "post_service": [],
      "human_handoff": []
    },
    "missing_field_messages": {
      "service_interest": "Perfecto. Que servicio te interesa?",
      "district": "Perfecto. Para ayudarte bien, en que comuna estas?",
      "vehicle_type": "Perfecto. Que tipo de vehiculo tienes?",
      "booking_date": "Perfecto. Para que dia te gustaria agendar?",
      "booking_time": "Perfecto. Que horario te acomoda?",
      "address": "Perfecto. Para dejar la reserva bien registrada, me puedes enviar la direccion exacta donde seria el servicio?",
      "default": "Necesito un poco mas de informacion para continuar."
    },
    "next_goal_by_field": {
      "service_interest": "collect_service_interest",
      "district": "collect_district",
      "vehicle_type": "collect_vehicle_type",
      "booking_date": "collect_booking_date",
      "booking_time": "collect_booking_time",
      "address": "collect_address",
      "default": "collect_missing_data"
    }
  }'::jsonb,
  true
from target_agent ta
on conflict (agent_id, rule_key) do update set
  priority = excluded.priority,
  rule_type = excluded.rule_type,
  config = excluded.config,
  is_active = excluded.is_active,
  updated_at = now();
