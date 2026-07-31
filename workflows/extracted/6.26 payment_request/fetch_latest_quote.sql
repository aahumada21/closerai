-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.26 payment_request  (workflow id wlAAdOqo3vD7O18n)
-- Nodo:        fetch_latest_quote
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH exec_ctx AS (
  SELECT
    NULLIF('{{ (($json.execution_context || {}).lead_id || "").replace(/'/g, "''") }}', '')::uuid AS lead_id,
    replace(lower(trim('{{ (($json.execution_context || {}).service_interest || ($json.context_packet && $json.context_packet.state && $json.context_packet.state.service_interest) || "").replace(/'/g, "''") }}')), ' ', '_') AS service_code,
    replace(lower(trim('{{ (($json.execution_context || {}).vehicle_type || ($json.context_packet && $json.context_packet.state && $json.context_packet.state.vehicle_type) || "").replace(/'/g, "''") }}')), ' ', '_') AS vehicle_type,
    replace(lower(trim('{{ (($json.execution_context || {}).district || ($json.context_packet && $json.context_packet.state && $json.context_packet.state.district) || "").replace(/'/g, "''") }}')), ' ', '_') AS district_key
),
stored_quote AS (
  SELECT price AS latest_price, service AS latest_service
  FROM offers_or_quotes oq
  CROSS JOIN exec_ctx ec
  WHERE oq.lead_id = ec.lead_id
  ORDER BY oq.created_at DESC
  LIMIT 1
),
agent_lookup AS (
  SELECT ls.agent_id
  FROM lead_state ls
  CROSS JOIN exec_ctx ec
  WHERE ls.lead_id = ec.lead_id
  LIMIT 1
),
active_version AS (
  SELECT pv.id
  FROM public.pricing_versions pv
  JOIN agent_lookup al ON al.agent_id = pv.agent_id
  WHERE pv.is_active = true AND pv.valid_from <= NOW()
  ORDER BY pv.valid_from DESC
  LIMIT 1
),
base_price_row AS (
  SELECT p.base_price
  FROM public.service_vehicle_prices p
  JOIN active_version av ON av.id = p.pricing_version_id
  CROSS JOIN exec_ctx ec
  WHERE replace(lower(trim(p.service_code)), ' ', '_') = ec.service_code
    AND (
      replace(lower(trim(p.vehicle_type)), ' ', '_') = ec.vehicle_type
      OR (ec.vehicle_type IN ('hatchback','city_car') AND replace(lower(trim(p.vehicle_type)), ' ', '_') = 'sedan')
    )
    AND p.is_active = true
  LIMIT 1
),
surcharge_row AS (
  SELECT COALESCE(d.surcharge, 0) AS surcharge
  FROM public.district_surcharges d
  JOIN active_version av ON av.id = d.pricing_version_id
  CROSS JOIN exec_ctx ec
  WHERE replace(lower(trim(d.district_key)), ' ', '_') IN (ec.district_key, '*')
    AND d.is_active = true
  ORDER BY CASE WHEN replace(lower(trim(d.district_key)), ' ', '_') = ec.district_key THEN 0 ELSE 1 END
  LIMIT 1
),
computed AS (
  SELECT
    COALESCE(b.base_price, 0) + COALESCE(s.surcharge, 0) AS computed_price
  FROM base_price_row b
  CROSS JOIN surcharge_row s
)
SELECT
  sq.latest_price,
  sq.latest_service,
  CASE WHEN c.computed_price > 0 THEN c.computed_price ELSE NULL END AS computed_price,
  ec.service_code AS context_service_code
FROM exec_ctx ec
LEFT JOIN stored_quote sq ON true
LEFT JOIN computed c ON true
