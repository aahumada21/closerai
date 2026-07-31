-- Mejora copy vendedor del primer mensaje al pedir servicio.
-- Mantener ASCII para evitar mojibake en runtime/n8n exports.

with prompt as (
  select concat_ws(E'\n',
    'Gracias por escribir a Ahumada Detailing. Te ayudo a elegir el servicio ideal para tu auto.',
    '',
    'Tenemos 3 opciones:',
    '1. Lavado basico: mantencion rapida para dejarlo limpio por dentro y fuera.',
    '2. Lavado premium: limpieza mas completa y detallada, ideal si viene bien sucio o quieres un resultado mas pro.',
    '3. Encerado full: proteccion y brillo para la pintura.',
    '',
    'Cual te interesa? Si no estas seguro, cuentame como esta tu auto y te recomiendo uno.'
  ) as text
)
update public.agent_rules ar
set
  config = jsonb_set(
    coalesce(ar.config, '{}'::jsonb),
    '{missing_field_messages,service_interest}',
    to_jsonb((select text from prompt)),
    true
  ),
  updated_at = now()
where ar.rule_key = 'lead_required_fields'
  and ar.is_active = true;

update public.agent_business_config abc
set
  config = jsonb_set(
    coalesce(abc.config, '{}'::jsonb),
    '{services}',
    '[
      {
        "key": "lavado_basico",
        "name": "Lavado basico",
        "aliases": ["lavado basico", "basico", "simple", "normal"],
        "description": "Mantencion rapida para dejarlo limpio por dentro y fuera. Buena opcion si buscas algo practico."
      },
      {
        "key": "lavado_premium",
        "name": "Lavado premium",
        "aliases": ["lavado premium", "premium", "detallado", "lavado full"],
        "description": "Limpieza mas completa y detallada. Recomendado si el auto viene bien sucio o quieres un resultado mas pro."
      },
      {
        "key": "encerado_full",
        "name": "Encerado full",
        "aliases": ["encerado", "encerado full", "cera", "proteccion pintura"],
        "description": "Proteccion y brillo para la pintura. Ideal si quieres mejorar la terminacion exterior y cuidar el auto."
      }
    ]'::jsonb,
    true
  ),
  updated_at = now()
from public.agents a
where abc.agent_id = a.id
  and a.slug = 'ahumada_detailing_closer'
  and abc.is_active = true;
