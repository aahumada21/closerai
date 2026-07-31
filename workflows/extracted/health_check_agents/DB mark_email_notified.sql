-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: health_check_agents  (workflow id ZgKBBYK2ZUyNIM7r)
-- Nodo:        DB mark_email_notified
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

=UPDATE public.health_alerts SET notified_email_at = now() WHERE id = ANY(ARRAY[{{ $json.alert_ids.map(id => "'" + id + "'").join(',') }}]::uuid[]);
