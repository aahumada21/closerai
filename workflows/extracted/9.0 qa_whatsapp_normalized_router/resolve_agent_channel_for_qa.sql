-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.0 qa_whatsapp_normalized_router  (workflow id 1badeb35-0335-4aaa-96a6-2e021376db8a)
-- Nodo:        resolve_agent_channel_for_qa
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH input AS (
  SELECT
    NULLIF('{{ String($json.source_metadata?.phone_number_id || $json.routing?.phone_number_id || "").replace(/'/g, "''") }}', '')::text AS phone_number_id,
    COALESCE(NULLIF('{{ String($json.source_metadata?.provider || $json.routing?.provider || "").replace(/'/g, "''") }}', ''), 'meta_whatsapp_cloud_api')::text AS provider,
    NULLIF('{{ String($json.source_metadata?.display_phone_number || "").replace(/'/g, "''") }}', '')::text AS display_phone_number
), resolved AS (
  SELECT
    o.id AS organization_id,
    o.slug AS organization_slug,
    o.name AS organization_name,
    o.timezone,
    o.locale,
    a.id AS agent_id,
    a.slug AS agent_slug,
    a.name AS agent_name,
    a.role AS agent_role,
    a.personality,
    a.model_config,
    a.policies,
    ac.id AS channel_config_id,
    ac.channel,
    ac.provider,
    ac.external_channel_id,
    ac.display_name,
    ac.config AS channel_config
  FROM input i
  JOIN public.agent_channels ac
    ON ac.provider = i.provider
   AND ac.external_channel_id = i.phone_number_id
   AND ac.is_active = true
  JOIN public.agents a
    ON a.id = ac.agent_id
   AND a.is_active = true
  JOIN public.organizations o
    ON o.id = ac.organization_id
   AND o.is_active = true
  LIMIT 1
)
SELECT
  CASE
    WHEN r.agent_id IS NOT NULL THEN true
    ELSE false
  END AS should_process,
  CASE
    WHEN i.phone_number_id IS NULL THEN true
    ELSE false
  END AS legacy_mode,
  CASE
    WHEN r.agent_id IS NOT NULL THEN NULL
    WHEN i.phone_number_id IS NULL THEN 'missing_phone_number_id'
    ELSE 'agent_channel_not_found_or_inactive'
  END AS error_code,
  i.phone_number_id,
  CASE WHEN r.organization_id IS NULL THEN NULL ELSE jsonb_build_object(
    'id', r.organization_id,
    'slug', r.organization_slug,
    'name', r.organization_name,
    'timezone', r.timezone,
    'locale', r.locale
  ) END AS organization,
  CASE WHEN r.agent_id IS NULL THEN NULL ELSE jsonb_build_object(
    'id', r.agent_id,
    'slug', r.agent_slug,
    'name', r.agent_name,
    'role', r.agent_role,
    'personality', r.personality,
    'model_config', r.model_config,
    'policies', r.policies
  ) END AS agent,
  CASE WHEN r.agent_id IS NULL THEN NULL ELSE jsonb_build_object(
    'id', r.channel_config_id,
    'channel', r.channel,
    'provider', r.provider,
    'external_channel_id', r.external_channel_id,
    'display_name', r.display_name,
    'config', r.channel_config,
    'resolution_source', 'agent_channels'
  ) END AS channel_config,
  jsonb_build_object(
    'channel', 'whatsapp',
    'provider', i.provider,
    'phone_number_id', i.phone_number_id,
    'organization_id', r.organization_id,
    'agent_id', r.agent_id,
    'environment', COALESCE(r.channel_config->>'environment', 'production'),
    'resolution_source', CASE WHEN r.agent_id IS NULL THEN NULL ELSE 'agent_channels' END
  ) AS routing
FROM input i
LEFT JOIN resolved r ON true;
