-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: google_calendar_oauth_callback  (workflow id ulUOTFazrMcE2BdJ)
-- Nodo:        DB lookup_agent_valid
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

=SELECT EXISTS (SELECT 1 FROM public.agents WHERE id = '{{ $json.agent_id }}'::uuid AND organization_id = '{{ $json.organization_id }}'::uuid AND is_active = true) AS agent_valid;
