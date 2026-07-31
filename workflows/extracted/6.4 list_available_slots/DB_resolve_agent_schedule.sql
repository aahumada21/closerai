-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.4 list_available_slots  (workflow id 1e882e96-85ef-4afa-8619-8a7bf5f52376)
-- Nodo:        DB_resolve_agent_schedule
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT
  (SELECT schedule FROM public.agent_staff WHERE id = $2::uuid AND is_active = true LIMIT 1) AS staff_schedule,
  (SELECT config->'schedule' FROM public.agent_business_config WHERE agent_id = $1::uuid AND is_active = true LIMIT 1) AS agent_schedule;
