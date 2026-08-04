-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.29 release_expired_payment_holds  (workflow id j4DjI0eQ0eOYpAnJ)
-- Nodo:        find_expired_holds
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT a.id AS appointment_id, a.event_id, a.conversation_id AS lead_id,
       a.start_at, a.end_at, l.phone, l.channel,
       abc.config->>'calendar_id' AS calendar_id
FROM public.appointments a
JOIN public.leads l ON l.id = a.conversation_id
JOIN public.lead_state ls ON ls.lead_id = a.conversation_id
JOIN public.agent_business_config abc
  ON abc.agent_id = ls.agent_id AND abc.is_active = true
WHERE a.cancelled_at IS NULL
  AND a.start_at > NOW()
  AND a.created_at < NOW() - INTERVAL '30 minutes'
  -- sin calendario propio no se toca nada: antes se borraba de "primary",
  -- que es el calendario de otro tenant
  AND COALESCE(abc.config->>'calendar_id', '') <> ''
  AND (
    -- (a) diseno original: el hold se creo como pending_payment
    a.status = 'pending_payment'
    -- (b) como pasa en la realidad: la cita queda confirmed y el vencimiento
    --     lo marca 6.30 en lead_state
    OR (
      a.status = 'confirmed'
      AND ls.stage = 'booked_pending'
      AND ls.payment_status = 'expired'
    )
  );
