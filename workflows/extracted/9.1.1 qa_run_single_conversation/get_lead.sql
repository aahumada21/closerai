-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
-- Nodo:        get_lead
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT id, phone, external_id, organization_id, agent_id
FROM public.leads
WHERE phone = '{{ $("build_inbound_payload").item.json.phone }}'
   OR external_id = '{{ $("build_inbound_payload").item.json.phone }}'
ORDER BY created_at DESC
LIMIT 1;
