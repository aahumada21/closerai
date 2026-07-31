-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.0 qa_whatsapp_normalized_router  (workflow id 1badeb35-0335-4aaa-96a6-2e021376db8a)
-- Nodo:        insert_inbound_message
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH target_lead AS (
  SELECT id
  FROM public.leads
  WHERE channel = '{{ ($json.lead.channel || "whatsapp").replace(/'/g, "''") }}'
    AND external_id = '{{ ($json.lead.external_id || "").replace(/'/g, "''") }}'
  LIMIT 1
),
created_lead AS (
  INSERT INTO public.leads (
    channel,
    external_id,
    phone,
    name,
    created_at,
    updated_at
  )
  SELECT
    '{{ ($json.lead.channel || "whatsapp").replace(/'/g, "''") }}',
    '{{ ($json.lead.external_id || "").replace(/'/g, "''") }}',
    '{{ ($json.lead.phone || "").replace(/'/g, "''") }}',
    '{{ ($json.lead.name || "Cliente QA").replace(/'/g, "''") }}',
    NOW(),
    NOW()
  WHERE NOT EXISTS (SELECT 1 FROM target_lead)
  RETURNING id
),
final_lead AS (
  SELECT id FROM target_lead
  UNION ALL
  SELECT id FROM created_lead
  LIMIT 1
),
created_state AS (
  INSERT INTO public.lead_state (
    lead_id,
    stage,
    intent_last,
    interest_score,
    service_interest,
    vehicle_type,
    district,
    missing_fields,
    last_bot_action,
    next_goal,
    human_handoff,
    updated_at
  )
  SELECT
    id,
    'new_lead',
    NULL,
    0,
    NULL,
    NULL,
    NULL,
    '[]'::jsonb,
    NULL,
    'qualify_lead',
    false,
    NOW()
  FROM final_lead
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.lead_state s
    WHERE s.lead_id::text = (SELECT id::text FROM final_lead)
  )
),
inserted_message AS (
  INSERT INTO public.messages (
    lead_id,
    direction,
    channel,
    message_type,
    content,
    provider_message_id,
    provider_status,
    status,
    created_at
  )
  SELECT
    id,
    'inbound',
    '{{ ($json.event.channel || "whatsapp").replace(/'/g, "''") }}',
    '{{ ($json.event.message_type || "text").replace(/'/g, "''") }}',
    '{{ ($json.event.text || "").replace(/'/g, "''") }}',
    '{{ ($json.event.message_id || "").replace(/'/g, "''") }}',
    'received',
    'received',
    NOW()
  FROM final_lead
  RETURNING id, lead_id, content, created_at
)
SELECT
  (SELECT id FROM final_lead) AS lead_id,
  (SELECT id FROM inserted_message) AS message_db_id,
  '{{ JSON.stringify($json.event).replace(/'/g, "''") }}'::jsonb AS event,
  '{{ JSON.stringify($json.lead).replace(/'/g, "''") }}'::jsonb AS lead;
