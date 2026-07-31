-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 1.1 n8n_chat_test_router  (workflow id 0b02fa7c-8ba2-4a4d-a6e3-87a3165020eb)
-- Nodo:        lookup_test_agent_channel
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT agent_id, organization_id
FROM public.agent_channels
WHERE provider = 'n8n_chat_test'
  AND external_channel_id = '{{ $json.phone.replace(/'/g, "''") }}'
  AND is_active = true
LIMIT 1;
