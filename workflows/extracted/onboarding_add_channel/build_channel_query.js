// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_add_channel  (workflow id 0rz0ue6OkEKRlqUG)
// Nodo:        build_channel_query
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

function sqlText(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function sqlUuidOrNull(value) {
  const text = String(value || "").trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  return isUuid ? "'" + text + "'" : "NULL";
}

function sqlJsonb(value) {
  const json = JSON.stringify(value === undefined ? null : value);
  return "'" + json.replace(/'/g, "''") + "'::jsonb";
}

if (!input.valid) {
  return [{ json: { ...input, channel_query: null } }];
}

const query = `
WITH membership AS (
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = ${sqlUuidOrNull(input.user_id)}
      AND organization_id = ${sqlUuidOrNull(input.organization_id)}
  ) AS is_member
),
agent_check AS (
  SELECT EXISTS (
    SELECT 1 FROM agents
    WHERE id = ${sqlUuidOrNull(input.agent_id)}
      AND organization_id = ${sqlUuidOrNull(input.organization_id)}
  ) AS agent_belongs
),
upserted_channel AS (
  INSERT INTO agent_channels (organization_id, agent_id, channel, provider, external_channel_id, display_name, is_active, config)
  SELECT
    ${sqlUuidOrNull(input.organization_id)},
    ${sqlUuidOrNull(input.agent_id)},
    ${sqlText(input.channel)},
    ${sqlText(input.provider)},
    ${sqlText(input.external_channel_id)},
    ${sqlText(input.display_name)},
    true,
    ${sqlJsonb(input.config)}
  WHERE (SELECT is_member FROM membership) AND (SELECT agent_belongs FROM agent_check)
  ON CONFLICT (provider, external_channel_id) DO UPDATE SET
    organization_id = excluded.organization_id,
    agent_id = excluded.agent_id,
    channel = excluded.channel,
    display_name = excluded.display_name,
    is_active = true,
    config = excluded.config,
    updated_at = now()
  RETURNING id, agent_id
)
SELECT
  (SELECT is_member FROM membership) AS is_member,
  (SELECT agent_belongs FROM agent_check) AS agent_belongs,
  (SELECT id FROM upserted_channel) AS channel_id
;
`;

return [{
  json: {
    ...input,
    channel_query: query
  }
}];
