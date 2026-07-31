-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: onboarding_manage_service  (workflow id bnQxcyxo3Hwwb7CK)
-- Nodo:        DB_write_new_config_version
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH deactivate_old AS (
  UPDATE public.agent_business_config
  SET is_active = false
  WHERE agent_id = '{{ $json.agent_id }}'::uuid AND is_active = true
  RETURNING id
),
insert_new AS (
  INSERT INTO public.agent_business_config (organization_id, agent_id, version, is_active, config)
  VALUES (
    '{{ $json.organization_id }}'::uuid,
    '{{ $json.agent_id }}'::uuid,
    {{ $json.new_version }},
    true,
    '{{ JSON.stringify($json.new_config).replace(/'/g, "\'\'") }}'::jsonb
  )
  RETURNING id, version
)
SELECT
  (SELECT id FROM insert_new) AS new_config_id,
  (SELECT version FROM insert_new) AS new_version_written,
  (SELECT count(*) FROM deactivate_old) AS deactivated_count;
