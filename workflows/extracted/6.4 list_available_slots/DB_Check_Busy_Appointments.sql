-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.4 list_available_slots  (workflow id 1e882e96-85ef-4afa-8619-8a7bf5f52376)
-- Nodo:        DB_Check_Busy_Appointments
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'event_id', event_id,
        'start_at', start_at,
        'end_at', end_at,
        'status', status
      )
    ),
    '[]'::jsonb
  ) AS busy_events
FROM public.appointments
WHERE status IN ('confirmed', 'pending')
  AND start_at < '{{ $json.search_end_at }}'::timestamptz
  AND end_at > '{{ $json.search_start_at }}'::timestamptz
  AND (
    (NULLIF('{{ String($json.staff_id || "").replace(/'/g, "''") }}', '') IS NOT NULL
      AND staff_id = NULLIF('{{ String($json.staff_id || "").replace(/'/g, "''") }}', '')::uuid)
    OR (NULLIF('{{ String($json.staff_id || "").replace(/'/g, "''") }}', '') IS NULL AND staff_id IS NULL)
  );
