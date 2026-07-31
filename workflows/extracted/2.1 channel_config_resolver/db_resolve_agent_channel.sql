-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 2.1 channel_config_resolver  (workflow id gYYvc3jTVgDnAB8K)
-- Nodo:        db_resolve_agent_channel
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH input AS (
  SELECT
    '{{ String($json.resolver_input?.channel || "whatsapp").replace(/'/g, "''") }}'::text AS channel,
    '{{ String($json.resolver_input?.provider || "meta_whatsapp_cloud_api").replace(/'/g, "''") }}'::text AS provider,
    NULLIF('{{ String($json.resolver_input?.external_channel_id || "").replace(/'/g, "''") }}', '')::text AS external_channel_id,
    NULLIF('{{ String($json.resolver_input?.phone_number_id || "").replace(/'/g, "''") }}', '')::text AS phone_number_id,
    NULLIF('{{ String($json.resolver_input?.display_phone_number || "").replace(/'/g, "''") }}', '')::text AS display_phone_number,
    NULLIF('{{ String($json.resolver_input?.lead_id || "").replace(/'/g, "''") }}', '')::text AS lead_id,
    NULLIF('{{ String($json.resolver_input?.message_id || "").replace(/'/g, "''") }}', '')::text AS message_id,
    '{{ JSON.stringify($json.resolver_input?.raw || {}).replace(/'/g, "''") }}'::jsonb AS raw
),
channel_candidate AS (
  SELECT
    ac.id AS channel_config_id,
    ac.organization_id AS channel_organization_id,
    ac.agent_id AS channel_agent_id,
    ac.channel,
    ac.provider,
    ac.external_channel_id,
    ac.display_name,
    ac.config AS channel_config,
    ac.is_active AS channel_is_active,
    a.id AS agent_id,
    a.slug AS agent_slug,
    a.name AS agent_name,
    a.role AS agent_role,
    a.personality,
    a.model_config,
    a.policies,
    a.is_active AS agent_is_active,
    o.id AS organization_id,
    o.slug AS organization_slug,
    o.name AS organization_name,
    o.timezone,
    o.locale,
    o.is_active AS organization_is_active
  FROM input i
  LEFT JOIN public.agent_channels ac
    ON ac.provider = i.provider
   AND ac.external_channel_id = i.external_channel_id
  LEFT JOIN public.agents a
    ON a.id = ac.agent_id
  LEFT JOIN public.organizations o
    ON o.id = ac.organization_id
  LIMIT 1
),
evaluated AS (
  SELECT
    i.channel,
    i.provider,
    i.external_channel_id,
    i.phone_number_id,
    i.display_phone_number,
    i.lead_id,
    i.message_id,
    i.raw,
    c.channel_config_id,
    c.channel_organization_id,
    c.channel_agent_id,
    c.display_name,
    c.channel_config,
    c.channel_is_active,
    c.agent_id,
    c.agent_slug,
    c.agent_name,
    c.agent_role,
    c.personality,
    c.model_config,
    c.policies,
    c.agent_is_active,
    c.organization_id,
    c.organization_slug,
    c.organization_name,
    c.timezone,
    c.locale,
    c.organization_is_active,
    CASE
      WHEN i.external_channel_id IS NULL THEN 'missing_external_channel_id'
      WHEN c.channel_config_id IS NULL THEN 'agent_channel_not_found'
      WHEN COALESCE(c.channel_is_active, false) = false THEN 'agent_channel_inactive'
      WHEN c.agent_id IS NULL THEN 'agent_not_found'
      WHEN COALESCE(c.agent_is_active, false) = false THEN 'agent_inactive'
      WHEN c.organization_id IS NULL THEN 'organization_not_found'
      WHEN COALESCE(c.organization_is_active, false) = false THEN 'organization_inactive'
      WHEN lower(COALESCE(c.channel_config->>'inbound_enabled', 'true')) IN ('false', '0', 'no', 'off') THEN 'channel_inbound_disabled'
      ELSE NULL
    END AS not_processed_reason
  FROM input i
  LEFT JOIN channel_candidate c ON true
)
SELECT
  (not_processed_reason IS NULL) AS found,
  (not_processed_reason IS NULL) AS should_process,
  not_processed_reason,
  not_processed_reason AS error_code,
  CASE
    WHEN not_processed_reason IS NULL THEN NULL
    WHEN not_processed_reason = 'missing_external_channel_id' THEN 'external_channel_id is required'
    WHEN not_processed_reason = 'agent_channel_not_found' THEN 'no agent_channel configured for provider and external_channel_id'
    WHEN not_processed_reason = 'agent_channel_inactive' THEN 'agent_channel is inactive'
    WHEN not_processed_reason = 'agent_not_found' THEN 'agent referenced by channel was not found'
    WHEN not_processed_reason = 'agent_inactive' THEN 'agent is inactive'
    WHEN not_processed_reason = 'organization_not_found' THEN 'organization referenced by channel was not found'
    WHEN not_processed_reason = 'organization_inactive' THEN 'organization is inactive'
    WHEN not_processed_reason = 'channel_inbound_disabled' THEN 'channel inbound is disabled'
    ELSE 'channel config resolution failed'
  END AS error_message,
  jsonb_build_object(
    'channel', channel,
    'provider', provider,
    'external_channel_id', external_channel_id,
    'phone_number_id', phone_number_id,
    'display_phone_number', display_phone_number,
    'lead_id', lead_id,
    'message_id', message_id,
    'raw', raw
  ) AS input,
  CASE WHEN organization_id IS NULL THEN '{}'::jsonb ELSE jsonb_build_object(
    'id', organization_id,
    'slug', organization_slug,
    'name', organization_name,
    'timezone', timezone,
    'locale', locale,
    'is_active', organization_is_active
  ) END AS organization,
  CASE WHEN agent_id IS NULL THEN '{}'::jsonb ELSE jsonb_build_object(
    'id', agent_id,
    'slug', agent_slug,
    'name', agent_name,
    'role', agent_role,
    'personality', personality,
    'model_config', model_config,
    'policies', policies,
    'is_active', agent_is_active
  ) END AS agent,
  CASE WHEN channel_config_id IS NULL THEN '{}'::jsonb ELSE jsonb_build_object(
    'id', channel_config_id,
    'channel', channel,
    'provider', provider,
    'external_channel_id', external_channel_id,
    'display_name', display_name,
    'is_active', channel_is_active,
    'config', COALESCE(channel_config, '{}'::jsonb),
    'resolution_source', 'agent_channels'
  ) END AS channel_config,
  jsonb_build_object(
    'channel', channel,
    'provider', provider,
    'external_channel_id', external_channel_id,
    'phone_number_id', phone_number_id,
    'organization_id', organization_id,
    'agent_id', agent_id,
    'environment', COALESCE(channel_config->>'environment', 'production'),
    'resolution_source', CASE WHEN channel_config_id IS NULL THEN NULL ELSE 'agent_channels' END
  ) AS routing
FROM evaluated;
