-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
-- Nodo:        get_state_before
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT *
FROM public.lead_state
WHERE lead_id::text = '{{ $("get_lead_before").item.json.id }}'
LIMIT 1;
