-- Mejorar pregunta de tipo de vehiculo para evitar respuestas ambiguas con modelo.
update public.agent_rules ar
set
  config = jsonb_set(
    coalesce(ar.config, '{}'::jsonb),
    '{missing_field_messages,vehicle_type}',
    to_jsonb('Perfecto. Para cotizar bien, que tipo de vehiculo tienes? Puede ser SUV, camioneta, hatchback, sedan, city car, moto o furgon.'::text),
    true
  ),
  updated_at = now()
from public.agents a
where a.id = ar.agent_id
  and a.slug = 'ahumada_detailing_closer'
  and ar.rule_key = 'lead_required_fields'
  and ar.is_active = true;

update public.agent_business_config abc
set
  config = jsonb_set(
    coalesce(abc.config, '{}'::jsonb),
    '{messages,ask_vehicle_type}',
    to_jsonb('Perfecto. Para cotizar bien, que tipo de vehiculo tienes? Puede ser SUV, camioneta, hatchback, sedan, city car, moto o furgon.'::text),
    true
  ),
  updated_at = now()
from public.agents a
where a.id = abc.agent_id
  and a.slug = 'ahumada_detailing_closer'
  and abc.is_active = true;
