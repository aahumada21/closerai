-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.0 resolve_pricing_from_db  (workflow id 72b60f14-db90-436e-b48c-02b96dd4f946)
-- Nodo:        get_pricing_from_db
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH input_values AS (
  SELECT
    NULLIF('{{ String($json.agent_id || "").replace(/'/g, "''") }}', '')::uuid AS agent_id,
    '{{ String($json.service_code || "").replace(/'/g, "''") }}'::text AS service_code,
    '{{ String($json.vehicle_type || "").replace(/'/g, "''") }}'::text AS vehicle_type,
    '{{ String($json.district_key || "").replace(/'/g, "''") }}'::text AS district_key,
    {{ $json.price_list_requested === true ? 'true' : 'false' }}::boolean AS price_list_requested
),

active_version AS (
  SELECT v.id
  FROM public.pricing_versions v
  JOIN input_values i ON i.agent_id = v.agent_id
  WHERE v.is_active = true
    AND v.valid_from <= NOW()
  ORDER BY v.valid_from DESC
  LIMIT 1
),

base_rows AS (
  SELECT
    p.pricing_version_id,
    replace(lower(trim(p.service_code)), ' ', '_') AS service_code,
    replace(lower(trim(p.vehicle_type)), ' ', '_') AS vehicle_type,
    p.base_price
  FROM public.service_vehicle_prices p
  JOIN active_version v
    ON v.id = p.pricing_version_id
  JOIN input_values i
    ON (
      i.price_list_requested = true
      OR replace(lower(trim(p.service_code)), ' ', '_') = i.service_code
    )
   AND (
      replace(lower(trim(p.vehicle_type)), ' ', '_') = i.vehicle_type
      OR (
        i.vehicle_type = 'hatchback'
        AND replace(lower(trim(p.vehicle_type)), ' ', '_') = 'sedan'
      )
      OR (
        i.vehicle_type = 'city_car'
        AND replace(lower(trim(p.vehicle_type)), ' ', '_') = 'sedan'
      )
   )
  WHERE p.is_active = true
),

district_rule AS (
  SELECT
    d.district_key,
    d.surcharge
  FROM public.district_surcharges d
  JOIN active_version v
    ON v.id = d.pricing_version_id
  JOIN input_values i
    ON replace(lower(trim(d.district_key)), ' ', '_') IN (i.district_key, '*')
  WHERE d.is_active = true
  ORDER BY
    CASE
      WHEN replace(lower(trim(d.district_key)), ' ', '_') = (SELECT district_key FROM input_values) THEN 0
      ELSE 1
    END
  LIMIT 1
),

priced_rows AS (
  SELECT
    b.pricing_version_id,
    b.service_code,
    b.vehicle_type,
    b.base_price,
    COALESCE(d.surcharge, 0) AS surcharge,
    b.base_price + COALESCE(d.surcharge, 0) AS final_price
  FROM base_rows b
  LEFT JOIN district_rule d ON true
),

ordered_rows AS (
  SELECT *
  FROM priced_rows
  ORDER BY CASE service_code
    WHEN 'lavado_basico' THEN 1
    WHEN 'lavado_premium' THEN 2
    WHEN 'encerado_full' THEN 3
    ELSE 99
  END
)

SELECT
  EXISTS(SELECT 1 FROM ordered_rows WHERE final_price > 0) AS pricing_found,
  i.service_code,
  i.vehicle_type,
  i.district_key,
  i.price_list_requested,
  (SELECT pricing_version_id FROM ordered_rows LIMIT 1) AS pricing_version_id,
  CASE WHEN i.price_list_requested = false THEN (SELECT base_price FROM ordered_rows LIMIT 1) ELSE NULL END AS base_price,
  CASE WHEN i.price_list_requested = false THEN (SELECT surcharge FROM ordered_rows LIMIT 1) ELSE NULL END AS surcharge,
  CASE WHEN i.price_list_requested = false THEN (SELECT final_price FROM ordered_rows LIMIT 1) ELSE NULL END AS final_price,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'service_code', service_code,
          'vehicle_type', vehicle_type,
          'base_price', base_price,
          'surcharge', surcharge,
          'price', final_price
        )
      )
      FROM ordered_rows
    ),
    '[]'::jsonb
  ) AS price_list
FROM input_values i;
