-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
-- Nodo:        prepare_qa_lead
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH existing_lead AS (
  -- Buscar-y-si-no-existe-insertar en vez de ON CONFLICT: el unico indice
  -- unico de leads es (channel, external_id, agent_id) y los leads de QA
  -- tienen agent_id NULL, asi que ningun ON CONFLICT puede funcionar aca
  -- (los NULL son distintos entre si). Ver el comentario del script
  -- scripts/ que aplico este cambio.
  SELECT id
  FROM public.leads
  WHERE channel = 'whatsapp'
    AND external_id = '{{ ($json.phone || "").replace(/'/g, "''") }}'
  ORDER BY created_at ASC
  LIMIT 1
),
inserted_lead AS (
  INSERT INTO public.leads (
    channel, external_id, phone, name, created_at, updated_at
  )
  SELECT
    'whatsapp',
    '{{ ($json.phone || "").replace(/'/g, "''") }}',
    '{{ ($json.phone || "").replace(/'/g, "''") }}',
    'Cliente QA',
    NOW(),
    NOW()
  WHERE NOT EXISTS (SELECT 1 FROM existing_lead)
  RETURNING id
),
touched_lead AS (
  UPDATE public.leads
  SET name = 'Cliente QA', updated_at = NOW()
  WHERE id IN (SELECT id FROM existing_lead)
  RETURNING id
),
upsert_lead AS (
  SELECT id FROM existing_lead
  UNION ALL
  SELECT id FROM inserted_lead
),
cleanup AS (
  DELETE FROM public.messages
  WHERE lead_id::text = (SELECT id::text FROM upsert_lead)
),
cleanup_state AS (
  DELETE FROM public.lead_state
  WHERE lead_id::text = (SELECT id::text FROM upsert_lead)
),
cleanup_audit AS (
  DELETE FROM public.audit_logs
  WHERE lead_id::text = (SELECT id::text FROM upsert_lead)
),
cleanup_quotes AS (
  DELETE FROM public.offers_or_quotes
  WHERE lead_id::text = (SELECT id::text FROM upsert_lead)
),
cleanup_followups AS (
  DELETE FROM public.followups
  WHERE lead_id::text = (SELECT id::text FROM upsert_lead)
),
cleanup_appts AS (
  DELETE FROM public.appointments
  WHERE conversation_id::text = (SELECT id::text FROM upsert_lead)
),
new_state AS (
  INSERT INTO public.lead_state (
    lead_id, stage, intent_last, interest_score, service_interest, vehicle_type, district,
    missing_fields, last_bot_action, next_goal, human_handoff, updated_at
  )
  SELECT
    id, 'new_lead', NULL, 0, NULL, NULL, NULL, '[]'::jsonb, NULL, 'qualify_lead', false, NOW()
  FROM upsert_lead
  ON CONFLICT (lead_id) DO UPDATE SET
    stage='new_lead',
    intent_last=NULL,
    interest_score=0,
    service_interest=NULL,
    vehicle_type=NULL,
    district=NULL,
    missing_fields='[]'::jsonb,
    last_bot_action=NULL,
    next_goal='qualify_lead',
    human_handoff=false,
    booking_date=NULL,
    booking_time=NULL,
    slot_id=NULL,
    booking_options='[]'::jsonb,
    service_address=NULL,
    address_reference=NULL,
    address_confirmed=false,
    address_confirmed_at=NULL,
    availability_confirmed=false,
payment_preference=NULL,
payment_mode=NULL,
payment_status=NULL,
flow_order_id=NULL,
flow_payment_url=NULL,
quoted_price=0,
pending_booking_data=NULL,
updated_at=NOW()
  RETURNING lead_id
)
SELECT
  '{{ ($json.id || "").replace(/'/g, "''") }}' AS id,
  '{{ ($json.name || "").replace(/'/g, "''") }}' AS name,
  '{{ ($json.phone || "").replace(/'/g, "''") }}' AS phone,
  '{{ ($json.run_id || "").replace(/'/g, "''") }}' AS run_id,
  '{{ JSON.stringify($json.steps || []).replace(/'/g, "''") }}'::jsonb AS steps,
  (SELECT lead_id FROM new_state LIMIT 1) AS qa_lead_id;
