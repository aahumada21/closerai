-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
-- Nodo:        DB_resolve_audit_channel
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT external_channel_id
FROM public.agent_channels
WHERE agent_id = $1::uuid AND channel = 'whatsapp' AND is_active = true
LIMIT 1;
