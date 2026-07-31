-- AI Agents Ahumada business config v2.
-- Moves business-facing context into agent_business_config without changing legacy fallback.

with target_agent as (
  select
    a.id as agent_id,
    a.organization_id
  from public.agents a
  join public.organizations o on o.id = a.organization_id
  where o.slug = 'ahumada_detailing'
    and a.slug = 'ahumada_detailing_closer'
  limit 1
),
deactivate_old as (
  update public.agent_business_config abc
  set is_active = false,
      updated_at = now()
  from target_agent ta
  where abc.agent_id = ta.agent_id
    and abc.version <> 2
  returning abc.id
)
insert into public.agent_business_config (
  organization_id,
  agent_id,
  version,
  is_active,
  config
)
select
  ta.organization_id,
  ta.agent_id,
  2,
  true,
  '{
    "business_name": "Ahumada Detailing",
    "locale": "es-CL",
    "timezone": "America/Santiago",
    "currency": "CLP",
    "services": [
      {
        "key": "lavado_basico",
        "name": "Lavado basico",
        "description": "Limpieza interior y exterior general para mantencion.",
        "aliases": ["lavado basico", "basico", "simple", "normal"]
      },
      {
        "key": "lavado_premium",
        "name": "Lavado premium",
        "description": "Limpieza mas detallada interior y exterior.",
        "aliases": ["lavado premium", "premium", "detallado", "lavado full"]
      },
      {
        "key": "encerado_full",
        "name": "Encerado full",
        "description": "Proteccion y brillo exterior para pintura.",
        "aliases": ["encerado", "encerado full", "cera", "proteccion pintura"]
      }
    ],
    "service_aliases": {
      "lavado basico": "lavado_basico",
      "basico": "lavado_basico",
      "lavado premium": "lavado_premium",
      "premium": "lavado_premium",
      "lavado full": "lavado_premium",
      "encerado": "encerado_full",
      "cera": "encerado_full"
    },
    "coverage": {
      "districts": [
        "Huechuraba",
        "Vitacura",
        "Las Condes",
        "Providencia",
        "Lo Barnechea",
        "Santiago",
        "Nunoa",
        "Independencia",
        "Recoleta",
        "Quilicura",
        "Conchali",
        "Colina",
        "La Reina",
        "Penalolen",
        "Macul",
        "La Florida",
        "Maipu",
        "San Miguel",
        "La Cisterna",
        "Puente Alto",
        "Pudahuel",
        "Renca"
      ]
    },
    "pricing_policy": {
      "source": "legacy_pricing_workflow",
      "must_not_invent_prices": true,
      "requires_service_vehicle_district": true,
      "on_pricing_error": "handoff_or_retry_before_booking"
    },
    "booking_policy": {
      "duration_minutes_default": 120,
      "max_slots_default": 3,
      "requires_address_confirmation": true,
      "requires_availability_confirmation": true,
      "timezone": "America/Santiago"
    },
    "messages": {
      "ask_service": "Perfecto. Que servicio te interesa?",
      "ask_district": "Perfecto. Para ayudarte bien, en que comuna estas?",
      "no_slots": "Por ahora no encontre horarios disponibles para los proximos dias. Si quieres, te puedo derivar para revisar manualmente una hora.",
      "handoff": "Te derivo con una persona para revisar esto manualmente."
    },
    "agent_limits": {
      "max_booking_options": 3,
      "do_not_confirm_without_address": true,
      "do_not_book_without_valid_quote": true,
      "do_not_invent_availability": true
    }
  }'::jsonb
from target_agent ta
on conflict (agent_id, version) do update set
  organization_id = excluded.organization_id,
  config = excluded.config,
  is_active = excluded.is_active,
  updated_at = now();
