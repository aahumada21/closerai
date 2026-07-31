-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
-- Nodo:        load_agent_prompt_templates
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH input_payload AS (
  SELECT
    '{{ JSON.stringify($json.context_packet || {}).replace(/'/g, "''") }}'::jsonb AS context_packet,
    '{{ ($json.context_packet?.agent?.id || $json.context_packet?.routing?.agent_id || "").replace(/'/g, "''") }}' AS raw_agent_id
), normalized AS (
  SELECT
    context_packet,
    CASE
      WHEN raw_agent_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN raw_agent_id::uuid
      ELSE NULL
    END AS agent_id
  FROM input_payload
), latest_templates AS (
  SELECT DISTINCT ON (apt.template_key)
    apt.template_key,
    apt.template_type,
    apt.content,
    apt.variables,
    apt.version,
    apt.updated_at
  FROM public.agent_prompt_templates apt
  JOIN normalized n ON n.agent_id = apt.agent_id
  WHERE apt.is_active = true
    AND apt.template_key IN (
      'decision_prompt',
      'tone_policy',
      'business_boundaries',
      'output_schema',
      'fallback_policy'
    )
  ORDER BY apt.template_key, apt.version DESC, apt.updated_at DESC
)
SELECT
  n.context_packet,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'template_key', lt.template_key,
        'template_type', lt.template_type,
        'content', lt.content,
        'variables', lt.variables,
        'version', lt.version
      )
    ) FILTER (WHERE lt.template_key IS NOT NULL),
    '[]'::jsonb
  ) AS agent_prompt_templates,
  COALESCE(MAX(lt.version), 0) AS prompt_version
FROM normalized n
LEFT JOIN latest_templates lt ON true
GROUP BY n.context_packet;
