-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: WA Reminders  (workflow id 9c27f106-a2bc-455b-99cd-584486d0b735)
-- Nodo:        DB - Insert reminder sent
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO reminders_sent (
  dedupe_key,
  event_id,
  reminder_type,
  phone,
  start_datetime,
  sent_at
) VALUES (
  :dedupeKey,
  :eventId,
  :reminderType,
  :phone,
  :startDateTime,
  NOW()
);
