-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 8.1 reactivate_bot_after_handoff  (workflow id 0d6e1092-a477-4935-8607-10fa8e6947f0)
-- Nodo:        DB_Reactivate_Lead_State
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

UPDATE public.lead_state
SET
  human_handoff = false,
  stage = '{{ ($json.resume_stage || "closing").replace(/'/g, "''") }}',
  next_goal = '{{ ($json.next_goal || "continue_conversation").replace(/'/g, "''") }}',
  last_bot_action = 'bot_reactivated_after_handoff',
  updated_at = NOW()
WHERE lead_id = '{{ $json.lead_id }}'::uuid
RETURNING
  lead_id,
  stage,
  human_handoff,
  next_goal,
  last_bot_action,
  updated_at;
