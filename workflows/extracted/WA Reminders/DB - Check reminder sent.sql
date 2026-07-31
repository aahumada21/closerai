-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: WA Reminders  (workflow id 9c27f106-a2bc-455b-99cd-584486d0b735)
-- Nodo:        DB - Check reminder sent
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT 1
FROM reminders_sent
WHERE dedupe_key = :dedupeKey
LIMIT 1;
