-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: onboarding_manage_service  (workflow id bnQxcyxo3Hwwb7CK)
-- Nodo:        DB_get_current_state
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH membership AS (
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = '{{ $json.user_id }}'::uuid
      AND organization_id = '{{ $json.organization_id }}'::uuid
  ) AS is_member
),
agent_check AS (
  SELECT EXISTS (
    SELECT 1 FROM agents
    WHERE id = '{{ $json.agent_id }}'::uuid
      AND organization_id = '{{ $json.organization_id }}'::uuid
  ) AS agent_belongs
),
found AS (
  SELECT
    abc.version AS current_version,
    abc.config AS current_config,
    (SELECT id FROM public.pricing_versions WHERE agent_id = abc.agent_id AND is_active = true LIMIT 1) AS active_pricing_version_id
  FROM public.agent_business_config abc
  WHERE abc.agent_id = '{{ $json.agent_id }}'::uuid
    AND abc.is_active = true
  LIMIT 1
)
SELECT
  (SELECT is_member FROM membership) AS is_member,
  (SELECT agent_belongs FROM agent_check) AS agent_belongs,
  (SELECT current_version FROM found) IS NOT NULL AS config_found,
  COALESCE((SELECT current_version FROM found), 0) AS current_version,
  COALESCE((SELECT current_config FROM found), '{}'::jsonb) AS current_config,
  (SELECT active_pricing_version_id FROM found) AS active_pricing_version_id;
