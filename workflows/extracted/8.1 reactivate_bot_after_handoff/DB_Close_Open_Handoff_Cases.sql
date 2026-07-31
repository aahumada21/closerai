-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 8.1 reactivate_bot_after_handoff  (workflow id 0d6e1092-a477-4935-8607-10fa8e6947f0)
-- Nodo:        DB_Close_Open_Handoff_Cases
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.handoff_cases
SET
  status = 'resolved',
  resolved_by = '{{ ($json.resolved_by || "human_operator").replace(/'/g, "''") }}',
  resolved_at = NOW(),
  resolution_note = '{{ ($json.resolution_note || "Bot reactivado").replace(/'/g, "''") }}',
  updated_at = NOW()
WHERE lead_id = '{{ $json.lead_id }}'::uuid
  AND status = 'open'
RETURNING
  id,
  lead_id,
  status,
  resolved_by,
  resolved_at,
  resolution_note;
